import { Router } from 'express';
import { pool } from './db';
import { getDisplayName, sendPush } from './push';
import { verifyPhotoWithGemini } from './aiService.js';

// Se till att hint-kolumnen finns i game_items
pool.query(`ALTER TABLE public.game_items ADD COLUMN IF NOT EXISTS hint TEXT DEFAULT '';`).catch(err => {
  console.warn('Migration game_items.hint warning:', err.message);
});

export const gamesRouter = Router();

function parseId(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Skapa ett nytt spel / utmaning (stödjer individuellt och lagspel, classic och block)
gamesRouter.post('/', async (req, res) => {
  const hostId = parseId(req.body.host_id);
  const title = String(req.body.title || 'Fotojakt').trim();
  const gridSize = ['3x3', '3x4', '3x5', '3x7'].includes(req.body.grid_size) ? req.body.grid_size : '3x3';
  const rows = gridSize === '3x7' ? 7 : (gridSize === '3x5' ? 5 : (gridSize === '3x4' ? 4 : 3));
  const cols = 3;
  const totalTiles = rows * cols;
  const durationMinutes = Number(req.body.duration_minutes) || 30;
  const isTeamGame = Boolean(req.body.is_team_game);
  const gameMode = req.body.game_mode === 'block' ? 'block' : 'classic';
  const startsAt = req.body.starts_at ? new Date(req.body.starts_at) : new Date();

  const participantIds: number[] = Array.isArray(req.body.participant_ids)
    ? req.body.participant_ids.map(parseId).filter((id): id is number => id !== null && id !== hostId)
    : [];

  const rawItems: any[] = Array.isArray(req.body.items) && req.body.items.length === totalTiles
    ? req.body.items
    : Array.from({ length: totalTiles }, (_, i) => ({ label: `Mål ${i + 1}`, emoji: '🎯', hint: '' }));

  if (!hostId) {
    return res.status(400).json({ error: 'host_id is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const status = startsAt <= new Date() ? 'active' : 'lobby';
    const expiresAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

    const gameRes = await client.query(
      `INSERT INTO public.games (host_id, title, grid_size, rows, cols, duration_minutes, is_team_game, game_mode, status, starts_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [hostId, title, gridSize, rows, cols, durationMinutes, isTeamGame, gameMode, status, startsAt, expiresAt]
    );
    const game = gameRes.rows[0];

    // Skapa lag om det är lagspel
    let team1Id: number | null = null;
    let team2Id: number | null = null;
    if (isTeamGame) {
      const t1Res = await client.query(
        `INSERT INTO public.game_teams (game_id, name, color) VALUES ($1, 'Lag Röd', '#EF4444') RETURNING id`,
        [game.id]
      );
      const t2Res = await client.query(
        `INSERT INTO public.game_teams (game_id, name, color) VALUES ($1, 'Lag Blå', '#3B82F6') RETURNING id`,
        [game.id]
      );
      team1Id = t1Res.rows[0].id;
      team2Id = t2Res.rows[0].id;
    }

    // Lägg till mål / brickans rutor
    for (let i = 0; i < totalTiles; i++) {
      const raw = rawItems[i];
      const label = typeof raw === 'string' ? raw : (raw?.label || `Mål ${i + 1}`);
      const emoji = typeof raw === 'object' && raw?.emoji ? raw.emoji : '🎯';
      const hint = typeof raw === 'object' && raw?.hint ? raw.hint : '';
      await client.query(
        `INSERT INTO public.game_items (game_id, tile_index, label, emoji, hint)
         VALUES ($1, $2, $3, $4, $5)`,
        [game.id, i, label, emoji, hint]
      );
    }

    const teamAssignments: Record<string, string> =
      typeof req.body.team_assignments === 'object' && req.body.team_assignments !== null
        ? req.body.team_assignments
        : {};

    // Lägg till värden som accepterad deltagare (i Lag Röd eller valt lag om lagspel)
    const hostAssignedTeam = isTeamGame
      ? (teamAssignments[String(hostId)] === 'blue' ? team2Id : team1Id)
      : null;

    await client.query(
      `INSERT INTO public.game_participants (game_id, user_id, team_id, status)
       VALUES ($1, $2, $3, 'accepted')`,
      [game.id, hostId, hostAssignedTeam]
    );

    // Bjud in vänner (respektera manuella val från lobbyn, annars fördela jämnt)
    for (let i = 0; i < participantIds.length; i++) {
      const pid = participantIds[i];
      if (pid === undefined) continue;
      const chosen = teamAssignments[String(pid)];
      const assignedTeamId = isTeamGame
        ? (chosen === 'red' ? team1Id : (chosen === 'blue' ? team2Id : (i % 2 === 0 ? team2Id : team1Id)))
        : null;

      await client.query(
        `INSERT INTO public.game_participants (game_id, user_id, team_id, status)
         VALUES ($1, $2, $3, 'invited')
         ON CONFLICT (game_id, user_id) DO NOTHING`,
        [game.id, pid, assignedTeamId]
      );
    }

    await client.query('COMMIT');

    // Skicka push-notis till alla inbjudna
    const hostName = await getDisplayName(hostId);
    const modeDesc = gameMode === 'block' ? 'Revirkamp (Blockerande rutor!)' : 'Klassisk';
    for (const pid of participantIds) {
      sendPush(
        pid,
        '🎮 Ny utmaning i Phing!',
        `${hostName} bjuder in dig till "${title}" (${isTeamGame ? 'Lagspel' : 'Solo'} · ${modeDesc})!`,
        { type: 'game_invite', game_id: game.id }
      ).catch(() => {});
    }

    res.status(201).json(game);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Fel vid skapande av spel:', err);
    res.status(500).json({ error: 'Kunde inte skapa spel' });
  } finally {
    client.release();
  }
});

// Hämta spel för en användare (både inbjudningar och aktiva/avslutade)
gamesRouter.get('/user/:userId', async (req, res) => {
  const userId = parseId(req.params.userId);
  if (!userId) {
    return res.status(400).json({ error: 'Invalid userId' });
  }

  try {
    const gamesRes = await pool.query(
      `SELECT g.*, gp.status AS participant_status, gp.score, gp.has_bingo, gp.team_id,
              gt.name AS team_name, gt.color AS team_color,
              u.display_name AS host_name,
              (SELECT COUNT(*) FROM public.game_participants WHERE game_id = g.id) AS total_players
       FROM public.games g
       JOIN public.game_participants gp ON gp.game_id = g.id AND gp.user_id = $1
       LEFT JOIN public.game_teams gt ON gt.id = gp.team_id
       JOIN public.users u ON u.id = g.host_id
       WHERE g.status IN ('lobby', 'active') OR g.expires_at >= NOW() - INTERVAL '1 day'
       ORDER BY g.created_at DESC`,
      [userId]
    );

    res.json(gamesRes.rows);
  } catch (err) {
    console.error('Fel vid hämtning av användarens spel:', err);
    res.status(500).json({ error: 'Kunde inte hämta spel' });
  }
});

// Hämta detaljerad info om ett spel (inkl. brickans rutor, deltagare, lag och inskickade phings)
gamesRouter.get('/:id', async (req, res) => {
  const gameId = parseId(req.params.id);
  if (!gameId) {
    return res.status(400).json({ error: 'Invalid gameId' });
  }

  try {
    const gameRes = await pool.query(
      `SELECT g.*, u.display_name AS host_name
       FROM public.games g
       JOIN public.users u ON u.id = g.host_id
       WHERE g.id = $1`,
      [gameId]
    );

    if (gameRes.rowCount === 0) {
      return res.status(404).json({ error: 'Spelet hittades inte' });
    }

    const game = gameRes.rows[0];

    // Uppdatera status om spelet har startat eller gått ut
    const now = new Date();
    if (game.status === 'lobby' && new Date(game.starts_at) <= now) {
      game.status = 'active';
      await pool.query(`UPDATE public.games SET status = 'active' WHERE id = $1`, [gameId]);
    }
    if (game.status === 'active' && new Date(game.expires_at) <= now) {
      game.status = 'finished';
      await pool.query(`UPDATE public.games SET status = 'finished' WHERE id = $1`, [gameId]);
    }

    // Hämta lag om lagspel
    const teamsRes = await pool.query(
      `SELECT * FROM public.game_teams WHERE game_id = $1 ORDER BY id ASC`,
      [gameId]
    );

    // Hämta brickans rutor (items)
    const itemsRes = await pool.query(
      `SELECT tile_index, label, emoji, hint FROM public.game_items WHERE game_id = $1 ORDER BY tile_index ASC`,
      [gameId]
    );

    // Hämta deltagare och deras lag / poäng / live-position
    const participantsRes = await pool.query(
      `SELECT gp.user_id, gp.team_id, gp.status, gp.score, gp.has_bingo, gp.icon,
              ST_Y(gp.location) AS latitude, ST_X(gp.location) AS longitude,
              gp.accuracy_meters, gp.location_updated_at,
              u.display_name,
              gt.name AS team_name, gt.color AS team_color
       FROM public.game_participants gp
       JOIN public.users u ON u.id = gp.user_id
       LEFT JOIN public.game_teams gt ON gt.id = gp.team_id
       WHERE gp.game_id = $1
       ORDER BY gp.score DESC, gp.joined_at ASC`,
      [gameId]
    );

    // Hämta inskickade phings för spelet (inkluderar lagfärg om lagspel)
    const phingsRes = await pool.query(
      `SELECT gp.id, gp.user_id, gp.team_id, gp.tile_index, gp.photo_thumb, gp.status,
              gp.approved_count, gp.rejected_count, gp.created_at, gp.ai_score, gp.ai_reason,
              ST_Y(gp.location) AS latitude, ST_X(gp.location) AS longitude,
              u.display_name AS user_name,
              gt.name AS team_name, gt.color AS team_color
       FROM public.game_phings gp
       JOIN public.users u ON u.id = gp.user_id
       LEFT JOIN public.game_teams gt ON gt.id = gp.team_id
       WHERE gp.game_id = $1
       ORDER BY gp.created_at DESC`,
      [gameId]
    );

    res.json({
      game,
      teams: teamsRes.rows,
      items: itemsRes.rows,
      participants: participantsRes.rows,
      phings: phingsRes.rows
    });
  } catch (err) {
    console.error('Fel vid hämtning av spel:', err);
    res.status(500).json({ error: 'Kunde inte hämta speldetaljer' });
  }
});

// Acceptera eller neka inbjudan till spel
gamesRouter.post('/:id/respond', async (req, res) => {
  const gameId = parseId(req.params.id);
  const userId = parseId(req.body.user_id);
  const accept = Boolean(req.body.accept);

  if (!gameId || !userId) {
    return res.status(400).json({ error: 'gameId and user_id required' });
  }

  try {
    const status = accept ? 'accepted' : 'declined';
    await pool.query(
      `UPDATE public.game_participants
       SET status = $1
       WHERE game_id = $2 AND user_id = $3`,
      [status, gameId, userId]
    );
    res.json({ ok: true, status });
  } catch (err) {
    console.error('Fel vid svar på inbjudan:', err);
    res.status(500).json({ error: 'Kunde inte svara på inbjudan' });
  }
});

// Starta spel i förtid (endast värden)
gamesRouter.post('/:id/start', async (req, res) => {
  const gameId = parseId(req.params.id);
  const hostId = parseId(req.body.host_id);

  if (!gameId || !hostId) {
    return res.status(400).json({ error: 'gameId and host_id required' });
  }

  try {
    const gameRes = await pool.query(`SELECT * FROM public.games WHERE id = $1`, [gameId]);
    if (gameRes.rowCount === 0) return res.status(404).json({ error: 'Spel finns inte' });
    const game = gameRes.rows[0];
    if (game.host_id !== hostId) return res.status(403).json({ error: 'Endast värden kan starta spelet' });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + game.duration_minutes * 60 * 1000);

    await pool.query(
      `UPDATE public.games
       SET status = 'active', starts_at = $1, expires_at = $2
       WHERE id = $3`,
      [now, expiresAt, gameId]
    );

    // Pushnotis till alla accepterade deltagare
    const playersRes = await pool.query(
      `SELECT user_id FROM public.game_participants WHERE game_id = $1 AND status = 'accepted' AND user_id != $2`,
      [gameId, hostId]
    );
    for (const row of playersRes.rows) {
      sendPush(
        row.user_id,
        '🚀 Tävlingen har startat!',
        `Startskottet har gått för "${game.title}". Hitta föremålen först!`,
        { type: 'game_started', game_id: gameId }
      ).catch(() => {});
    }

    res.json({ ok: true, starts_at: now, expires_at: expiresAt });
  } catch (err) {
    console.error('Fel vid start av spel:', err);
    res.status(500).json({ error: 'Kunde inte starta spel' });
  }
});

// Avbryt eller lämna spel
gamesRouter.post('/:id/cancel', async (req, res) => {
  const gameId = parseId(req.params.id);
  const userId = parseId(req.body.user_id);

  if (!gameId || !userId) {
    return res.status(400).json({ error: 'gameId and user_id required' });
  }

  try {
    const gameRes = await pool.query(`SELECT * FROM public.games WHERE id = $1`, [gameId]);
    if (gameRes.rowCount === 0) return res.status(404).json({ error: 'Spel finns inte' });
    const game = gameRes.rows[0];

    if (game.host_id === userId) {
      // Värden avbryter spelet för alla
      await pool.query(
        `UPDATE public.games SET status = 'cancelled' WHERE id = $1`,
        [gameId]
      );
      return res.json({ ok: true, cancelled: true, message: 'Spelet har avbrutits' });
    } else {
      // Deltagare lämnar spelet
      await pool.query(
        `UPDATE public.game_participants SET status = 'declined' WHERE game_id = $1 AND user_id = $2`,
        [gameId, userId]
      );
      return res.json({ ok: true, left: true, message: 'Du har lämnat spelet' });
    }
  } catch (err) {
    console.error('Fel vid avbrytande av spel:', err);
    res.status(500).json({ error: 'Kunde inte avbryta spelet' });
  }
});

// Uppdatera spelarens live-position i spelet (för radarn med färgade ringar)
gamesRouter.post('/:id/location', async (req, res) => {
  const gameId = parseId(req.params.id);
  const userId = parseId(req.body.user_id);
  const lat = Number(req.body.latitude);
  const lng = Number(req.body.longitude);
  const accuracy = Number(req.body.accuracy_meters) || null;
  const icon = typeof req.body.icon === 'string' ? req.body.icon : '🐷';

  if (!gameId || !userId || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'gameId, user_id, latitude, longitude required' });
  }

  try {
    await pool.query(
      `UPDATE public.game_participants
       SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
           accuracy_meters = $3,
           icon = $4,
           location_updated_at = NOW()
       WHERE game_id = $5 AND user_id = $6`,
      [lng, lat, accuracy, icon, gameId, userId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Fel vid uppdatering av spelarposition:', err);
    res.status(500).json({ error: 'Kunde inte uppdatera position' });
  }
});

// Skicka in ett foto för en ruta på bingobrickan (Phing submission med lag- och blockeringslogik)
gamesRouter.post('/:id/phings', async (req, res) => {
  const gameId = parseId(req.params.id);
  const userId = parseId(req.body.user_id);
  const tileIndex = Number(req.body.tile_index);
  const lat = Number(req.body.latitude);
  const lng = Number(req.body.longitude);
  const accuracy = Number(req.body.accuracy_meters) || null;
  const photoThumb = req.body.photo_thumb;
  const photoData = req.body.photo_data || photoThumb;

  if (!gameId || !userId || !Number.isInteger(tileIndex) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'Saknar obligatoriska fält' });
  }
  if (!photoThumb || typeof photoThumb !== 'string') {
    return res.status(400).json({ error: 'photo_thumb krävs' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Kolla att spelet är aktivt
    const gameRes = await client.query(`SELECT * FROM public.games WHERE id = $1`, [gameId]);
    if (gameRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Spelet hittades inte' });
    }
    const game = gameRes.rows[0];
    if (game.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Spelet är inte längre aktivt' });
    }

    // Hämta spelarens lag (om lagspel)
    const partRes = await client.query(
      `SELECT team_id FROM public.game_participants WHERE game_id = $1 AND user_id = $2`,
      [gameId, userId]
    );
    const userTeamId = partRes.rows[0]?.team_id || null;

    // BLOCK-LÄGE: Kolla om rutan redan är erövrad av ett annat lag/annan spelare!
    if (game.game_mode === 'block') {
      const existingRes = await client.query(
        `SELECT gp.*, gt.name AS team_name, u.display_name AS user_name
         FROM public.game_phings gp
         LEFT JOIN public.game_teams gt ON gt.id = gp.team_id
         JOIN public.users u ON u.id = gp.user_id
         WHERE gp.game_id = $1 AND gp.tile_index = $2 AND gp.status = 'approved'`,
        [gameId, tileIndex]
      );
      if (existingRes.rowCount && existingRes.rowCount > 0) {
        const existing = existingRes.rows[0];
        const isMyTeam = game.is_team_game && existing.team_id === userTeamId;
        const isMe = !game.is_team_game && existing.user_id === userId;
        if (!isMyTeam && !isMe) {
          await client.query('ROLLBACK');
          const ownerLabel = existing.team_name || existing.user_name;
          return res.status(409).json({
            error: `Rutan är redan erövrad och blockerad av ${ownerLabel}!`,
            blocked: true,
          });
        }
      }
    }

    // Hämta målets namn och ledtråd för AI-analys
    const itemQueryRes = await client.query(
      `SELECT label, hint FROM public.game_items WHERE game_id = $1 AND tile_index = $2`,
      [gameId, tileIndex]
    );
    const targetLabel = itemQueryRes.rows[0]?.label || `Mål ${tileIndex + 1}`;
    const targetHint = itemQueryRes.rows[0]?.hint || null;

    // AI-identifiering med Google Gemini (Kräver minst 75% för godkännande)
    let aiResult;
    try {
      aiResult = await verifyPhotoWithGemini(photoData, targetLabel, targetHint);
    } catch (aiErr: any) {
      console.error('AI verification failed:', aiErr);
      await client.query('ROLLBACK');
      const msg = aiErr?.message || 'Kunde inte analysera bilden med AI.';
      return res.status(500).json({ error: `AI-fel: ${msg}` });
    }

    if (!aiResult.approved) {
      await client.query('ROLLBACK');
      return res.status(422).json({
        error: `Fotot godkändes inte (${aiResult.score}% säkerhet, krävs minst 75%). ${aiResult.reason}`,
        ai_score: aiResult.score,
        ai_reason: aiResult.reason,
        approved: false,
      });
    }

    // Spara phing
    const phingRes = await client.query(
      `INSERT INTO public.game_phings (game_id, user_id, team_id, tile_index, location, accuracy_meters, photo_thumb, photo_data, ai_score, ai_reason, status)
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8, $9, $10, $11, 'approved')
       RETURNING id, game_id, user_id, team_id, tile_index, photo_thumb, approved_count, rejected_count, created_at, ai_score, ai_reason,
                 ST_Y(location) AS latitude, ST_X(location) AS longitude`,
      [gameId, userId, userTeamId, tileIndex, lng, lat, accuracy, photoThumb, photoData, aiResult.score, aiResult.reason]
    );

    // Uppdatera deltagarens personliga poäng
    const countRes = await client.query(
      `SELECT COUNT(DISTINCT tile_index) FROM public.game_phings WHERE game_id = $1 AND user_id = $2 AND status = 'approved'`,
      [gameId, userId]
    );
    const userScore = parseInt(countRes.rows[0].count, 10);
    const totalTiles = game.rows * game.cols;

    await client.query(
      `UPDATE public.game_participants
       SET score = $1
       WHERE game_id = $2 AND user_id = $3`,
      [userScore, gameId, userId]
    );

    let hasWon = false;
    let winningTeamName = '';

    // LAGSPEL: Uppdatera lagets poäng och kolla vinst
    if (game.is_team_game && userTeamId) {
      const teamScoreRes = await client.query(
        `SELECT COUNT(DISTINCT tile_index) FROM public.game_phings WHERE game_id = $1 AND team_id = $2 AND status = 'approved'`,
        [gameId, userTeamId]
      );
      const teamScore = parseInt(teamScoreRes.rows[0].count, 10);
      await client.query(
        `UPDATE public.game_teams SET score = $1 WHERE id = $2`,
        [teamScore, userTeamId]
      );

      // BLOCK-LÄGE: "Winner takes it all" - kolla om det är matematiskt omöjligt för andra att komma ikapp!
      if (game.game_mode === 'block') {
        const allTeamsRes = await client.query(
          `SELECT id, name, score FROM public.game_teams WHERE game_id = $1 ORDER BY score DESC`,
          [gameId]
        );
        const teams = allTeamsRes.rows;
        const topTeam = teams[0];
        const runnerUpTeam = teams[1] || { score: 0 };

        // Räkna totalt erövrade rutor i spelet
        const totalClaimedRes = await client.query(
          `SELECT COUNT(DISTINCT tile_index) FROM public.game_phings WHERE game_id = $1 AND status = 'approved'`,
          [gameId]
        );
        const totalClaimed = parseInt(totalClaimedRes.rows[0].count, 10);
        const remainingTiles = totalTiles - totalClaimed;

        // Om ledande laget har fler poäng än vad nästa lag kan få även om de tar ALLA kvarvarande rutor:
        // topTeam.score > runnerUp.score + remainingTiles
        if (topTeam && topTeam.score > (runnerUpTeam.score + remainingTiles)) {
          hasWon = true;
          winningTeamName = topTeam.name;
          await client.query(
            `UPDATE public.games SET status = 'finished', winner_team_id = $1 WHERE id = $2`,
            [topTeam.id, gameId]
          );
          await client.query(
            `UPDATE public.game_teams SET has_won = TRUE WHERE id = $1`,
            [topTeam.id]
          );
        }
      } else {
        // Klassiskt lagspel: först till alla rutor vinner
        if (teamScore >= totalTiles) {
          hasWon = true;
          const teamRes = await client.query(`SELECT name FROM public.game_teams WHERE id = $1`, [userTeamId]);
          winningTeamName = teamRes.rows[0]?.name || 'Laget';
          await client.query(
            `UPDATE public.games SET status = 'finished', winner_team_id = $1 WHERE id = $2`,
            [userTeamId, gameId]
          );
          await client.query(
            `UPDATE public.game_teams SET has_won = TRUE WHERE id = $1`,
            [userTeamId]
          );
        }
      }
    } else {
      // INDIVIDUELLT SPEL
      if (game.game_mode === 'block') {
        const allPlayersRes = await client.query(
          `SELECT user_id, score FROM public.game_participants WHERE game_id = $1 ORDER BY score DESC`,
          [gameId]
        );
        const top = allPlayersRes.rows[0];
        const runnerUp = allPlayersRes.rows[1] || { score: 0 };
        const totalClaimedRes = await client.query(
          `SELECT COUNT(DISTINCT tile_index) FROM public.game_phings WHERE game_id = $1 AND status = 'approved'`,
          [gameId]
        );
        const remainingTiles = totalTiles - parseInt(totalClaimedRes.rows[0].count, 10);
        if (top && top.score > (runnerUp.score + remainingTiles)) {
          hasWon = true;
          await client.query(
            `UPDATE public.games SET status = 'finished', winner_id = $1 WHERE id = $2`,
            [top.user_id, gameId]
          );
        }
      } else if (userScore >= totalTiles && !game.winner_id) {
        hasWon = true;
        await client.query(
          `UPDATE public.games SET winner_id = $1, status = 'finished' WHERE id = $2`,
          [userId, gameId]
        );
      }
    }

    await client.query('COMMIT');

    const phingData = phingRes.rows[0];
    const userName = await getDisplayName(userId);
    let teamName: string | undefined;
    let teamColor: string | undefined;
    if (userTeamId) {
      const tRes = await pool.query(`SELECT name, color FROM public.game_teams WHERE id = $1`, [userTeamId]);
      teamName = tRes.rows[0]?.name;
      teamColor = tRes.rows[0]?.color;
    }
    const phing = {
      ...phingData,
      user_name: userName,
      team_name: teamName,
      team_color: teamColor,
    };

    // Hämta målets namn
    const itemRes = await pool.query(
      `SELECT label FROM public.game_items WHERE game_id = $1 AND tile_index = $2`,
      [gameId, tileIndex]
    );
    const itemLabel = itemRes.rows[0]?.label || `Ruta ${tileIndex + 1}`;

    // Pusha till övriga deltagare
    const playersRes = await pool.query(
      `SELECT user_id FROM public.game_participants WHERE game_id = $1 AND user_id != $2 AND status = 'accepted'`,
      [gameId, userId]
    );
    for (const player of playersRes.rows) {
      sendPush(
        player.user_id,
        hasWon ? '🏆 THE WINNER TAKES IT ALL!' : (game.game_mode === 'block' ? '🔒 Ruta erövrad!' : '🎯 Ny Phing!'),
        hasWon
          ? `${winningTeamName || userName} har tagit en ointaglig ledning och vinner matchen!`
          : `${userName} erövrade "${itemLabel}"!`,
        { type: 'game_phing', game_id: gameId, phing_id: phing.id }
      ).catch(() => {});
    }

    res.status(201).json({
      phing,
      userScore,
      hasWon,
      winningTeamName,
      ai_score: aiResult.score,
      ai_reason: aiResult.reason,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Fel vid inskickning av phing:', err);
    res.status(500).json({ error: 'Kunde inte spara foto' });
  } finally {
    client.release();
  }
});

// Rösta / granska en phing (Deltagarnas vetorätt)
gamesRouter.post('/:id/phings/:phingId/vote', async (req, res) => {
  const gameId = parseId(req.params.id);
  const phingId = parseId(req.params.phingId);
  const voterId = parseId(req.body.voter_id);
  const vote = req.body.vote === 'reject' ? 'reject' : 'approve';

  if (!gameId || !phingId || !voterId) {
    return res.status(400).json({ error: 'Saknar obligatoriska fält' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Spara eller uppdatera rösten
    await client.query(
      `INSERT INTO public.game_votes (phing_id, voter_id, vote)
       VALUES ($1, $2, $3)
       ON CONFLICT (phing_id, voter_id) DO UPDATE SET vote = EXCLUDED.vote, created_at = NOW()`,
      [phingId, voterId, vote]
    );

    // Räkna röster
    const votesRes = await client.query(
      `SELECT
         COUNT(*) FILTER (WHERE vote = 'approve') AS approved_count,
         COUNT(*) FILTER (WHERE vote = 'reject') AS rejected_count
       FROM public.game_votes
       WHERE phing_id = $1`,
      [phingId]
    );
    const approvedCount = parseInt(votesRes.rows[0].approved_count, 10);
    const rejectedCount = parseInt(votesRes.rows[0].rejected_count, 10);

    // Om minst 2 protesterar och fler än godkännanden sätts status till rejected
    const newStatus = (rejectedCount >= 2 && rejectedCount > approvedCount) ? 'rejected' : 'approved';

    await client.query(
      `UPDATE public.game_phings
       SET approved_count = $1, rejected_count = $2, status = $3
       WHERE id = $4`,
      [approvedCount, rejectedCount, newStatus, phingId]
    );

    await client.query('COMMIT');
    res.json({ ok: true, approved_count: approvedCount, rejected_count: rejectedCount, status: newStatus });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Fel vid röstning på phing:', err);
    res.status(500).json({ error: 'Kunde inte registrera röst' });
  } finally {
    client.release();
  }
});
