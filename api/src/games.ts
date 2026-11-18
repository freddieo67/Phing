import { Router } from 'express';
import { pool } from './db';
import { getDisplayName, sendPush } from './push';

export const gamesRouter = Router();

function parseId(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Skapa ett nytt spel / utmaning
gamesRouter.post('/', async (req, res) => {
  const hostId = parseId(req.body.host_id);
  const title = String(req.body.title || 'Fotojakt').trim();
  const gridSize = ['3x3', '3x4', '3x5'].includes(req.body.grid_size) ? req.body.grid_size : '3x3';
  const rows = gridSize === '3x5' ? 5 : (gridSize === '3x4' ? 4 : 3);
  const cols = 3;
  const totalTiles = rows * cols;
  const durationMinutes = Number(req.body.duration_minutes) || 30;
  const startsAt = req.body.starts_at ? new Date(req.body.starts_at) : new Date();
  const participantIds: number[] = Array.isArray(req.body.participant_ids)
    ? req.body.participant_ids.map(parseId).filter((id): id is number => id !== null && id !== hostId)
    : [];

  const items: string[] = Array.isArray(req.body.items) && req.body.items.length === totalTiles
    ? req.body.items
    : Array.from({ length: totalTiles }, (_, i) => `Mål ${i + 1}`);

  if (!hostId) {
    return res.status(400).json({ error: 'host_id is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const status = startsAt <= new Date() ? 'active' : 'lobby';
    const expiresAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

    const gameRes = await client.query(
      `INSERT INTO public.games (host_id, title, grid_size, rows, cols, duration_minutes, status, starts_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, host_id, title, grid_size, rows, cols, duration_minutes, status, starts_at, expires_at, created_at`,
      [hostId, title, gridSize, rows, cols, durationMinutes, status, startsAt, expiresAt]
    );
    const game = gameRes.rows[0];

    // Lägg till mål / brickans rutor
    for (let i = 0; i < totalTiles; i++) {
      const label = items[i] || `Mål ${i + 1}`;
      await client.query(
        `INSERT INTO public.game_items (game_id, tile_index, label)
         VALUES ($1, $2, $3)`,
        [game.id, i, label]
      );
    }

    // Lägg till värden som accepterad deltagare
    await client.query(
      `INSERT INTO public.game_participants (game_id, user_id, status)
       VALUES ($1, $2, 'accepted')`,
      [game.id, hostId]
    );

    // Bjud in vänner
    for (const pid of participantIds) {
      await client.query(
        `INSERT INTO public.game_participants (game_id, user_id, status)
         VALUES ($1, $2, 'invited')
         ON CONFLICT (game_id, user_id) DO NOTHING`,
        [game.id, pid]
      );
    }

    await client.query('COMMIT');

    // Skicka push-notis till alla inbjudna
    const hostName = await getDisplayName(hostId);
    for (const pid of participantIds) {
      sendPush(
        pid,
        '🎮 Ny utmaning i Phing!',
        `${hostName} bjuder in dig till "${title}" (${gridSize}, ${durationMinutes} min)!`,
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
      `SELECT g.*, gp.status AS participant_status, gp.score, gp.has_bingo,
              u.display_name AS host_name,
              (SELECT COUNT(*) FROM public.game_participants WHERE game_id = g.id) AS total_players
       FROM public.games g
       JOIN public.game_participants gp ON gp.game_id = g.id AND gp.user_id = $1
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

// Hämta detaljerad info om ett spel (inkl. brickans rutor, deltagare och inskickade phings)
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

    // Hämta brickans rutor (items)
    const itemsRes = await pool.query(
      `SELECT tile_index, label, emoji FROM public.game_items WHERE game_id = $1 ORDER BY tile_index ASC`,
      [gameId]
    );

    // Hämta deltagare och deras poäng
    const participantsRes = await pool.query(
      `SELECT gp.user_id, gp.status, gp.score, gp.has_bingo, u.display_name
       FROM public.game_participants gp
       JOIN public.users u ON u.id = gp.user_id
       WHERE gp.game_id = $1
       ORDER BY gp.score DESC, gp.joined_at ASC`,
      [gameId]
    );

    // Hämta inskickade phings för spelet
    const phingsRes = await pool.query(
      `SELECT gp.id, gp.user_id, gp.tile_index, gp.photo_thumb, gp.status,
              gp.approved_count, gp.rejected_count, gp.created_at,
              ST_Y(gp.location) AS latitude, ST_X(gp.location) AS longitude,
              u.display_name AS user_name
       FROM public.game_phings gp
       JOIN public.users u ON u.id = gp.user_id
       WHERE gp.game_id = $1
       ORDER BY gp.created_at DESC`,
      [gameId]
    );

    res.json({
      game,
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

// Skicka in ett foto för en ruta på bingobrickan (Phing submission)
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
      return res.status(400).json({ error: 'Spelet är inte aktivt' });
    }

    // Spara phing
    const phingRes = await client.query(
      `INSERT INTO public.game_phings (game_id, user_id, tile_index, location, accuracy_meters, photo_thumb, photo_data)
       VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8)
       ON CONFLICT (game_id, user_id, tile_index) DO UPDATE
       SET location = EXCLUDED.location, accuracy_meters = EXCLUDED.accuracy_meters,
           photo_thumb = EXCLUDED.photo_thumb, photo_data = EXCLUDED.photo_data, created_at = NOW()
       RETURNING id, game_id, user_id, tile_index, photo_thumb, approved_count, rejected_count, created_at,
                 ST_Y(location) AS latitude, ST_X(location) AS longitude`,
      [gameId, userId, tileIndex, lng, lat, accuracy, photoThumb, photoData]
    );

    // Uppdatera deltagarens poäng
    const countRes = await client.query(
      `SELECT COUNT(*) FROM public.game_phings WHERE game_id = $1 AND user_id = $2 AND status = 'approved'`,
      [gameId, userId]
    );
    const score = parseInt(countRes.rows[0].count, 10);
    const totalTiles = game.rows * game.cols;
    const hasBingo = score >= totalTiles;

    await client.query(
      `UPDATE public.game_participants
       SET score = $1, has_bingo = $2
       WHERE game_id = $3 AND user_id = $4`,
      [score, hasBingo, gameId, userId]
    );

    // Om deltagaren fick BINGO och ingen vinnare finns än
    if (hasBingo && !game.winner_id) {
      await client.query(
        `UPDATE public.games SET winner_id = $1, status = 'finished' WHERE id = $2`,
        [userId, gameId]
      );
    }

    await client.query('COMMIT');

    const phing = phingRes.rows[0];
    const userName = await getDisplayName(userId);

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
        hasBingo ? '🏆 BINGO!' : '🎯 Ny Phing på kartan!',
        hasBingo
          ? `${userName} fick BINGO i "${game.title}"!`
          : `${userName} fotograferade "${itemLabel}"!`,
        { type: 'game_phing', game_id: gameId, phing_id: phing.id }
      ).catch(() => {});
    }

    res.status(201).json({ phing, score, hasBingo });
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

    // Om majoritet protesterar (t.ex. minst 2 protester och fler än godkännanden) sätts status till rejected
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
