-- Databasschema för Position-API:t. Kan köras flera gånger (idempotent).
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS public.users (
  id            SERIAL PRIMARY KEY,
  phone_number  VARCHAR(32) NOT NULL UNIQUE,
  display_name  VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.position_requests (
  id              SERIAL PRIMARY KEY,
  sender_id       INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id     INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_phone  VARCHAR(32),
  location        GEOMETRY(Point, 4326),
  accuracy_meters DOUBLE PRECISION,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shared_at       TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_position_requests_receiver_phone ON public.position_requests (receiver_phone);
CREATE INDEX IF NOT EXISTS idx_position_requests_expires_at ON public.position_requests (expires_at);
CREATE INDEX IF NOT EXISTS idx_position_requests_receiver_id ON public.position_requests (receiver_id, expires_at);

-- Förfrågningar: "requester vill se targets position".
-- När target tackar ja delar båda sina positioner med varandra.
CREATE TABLE IF NOT EXISTS public.location_requests (
  id              SERIAL PRIMARY KEY,
  requester_id    INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_id       INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | accepted | declined
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,                   -- sista tid att svara
  responded_at    TIMESTAMPTZ,
  reciprocated_at TIMESTAMPTZ                             -- när frågaren delade tillbaka
);

CREATE INDEX IF NOT EXISTS idx_location_requests_target ON public.location_requests (target_id, status);
CREATE INDEX IF NOT EXISTS idx_location_requests_requester ON public.location_requests (requester_id, created_at);

-- Delningar som skett som svar på en förfrågan pekar på den
ALTER TABLE public.position_requests
  ADD COLUMN IF NOT EXISTS request_id INTEGER REFERENCES public.location_requests(id) ON DELETE SET NULL;

-- Extra kolumner för push-notiser, meddelanden och kartikoner
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

ALTER TABLE public.position_requests
  ADD COLUMN IF NOT EXISTS message TEXT;

ALTER TABLE public.position_requests
  ADD COLUMN IF NOT EXISTS icon VARCHAR(16) DEFAULT '🐷';

ALTER TABLE public.position_requests
  ADD COLUMN IF NOT EXISTS photo_thumb TEXT;

ALTER TABLE public.position_requests
  ADD COLUMN IF NOT EXISTS photo_data TEXT;

ALTER TABLE public.position_requests
  ADD COLUMN IF NOT EXISTS is_meeting_point BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.signal_cooldowns (
  sender_id   INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  last_sent   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (sender_id, receiver_id)
);

-- Testanvändare (appen använder hårdkodat sender_id = 1 under testning)
INSERT INTO public.users (id, phone_number, display_name)
VALUES (1, '+46700000001', 'Testanvändare')
ON CONFLICT (id) DO NOTHING;
SELECT setval('public.users_id_seq', GREATEST((SELECT MAX(id) FROM public.users), 1));

-- Spel & Tävlingar (Phing Game Engine)
CREATE TABLE IF NOT EXISTS public.games (
  id               SERIAL PRIMARY KEY,
  host_id          INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title            VARCHAR(100) NOT NULL,
  grid_size        VARCHAR(10) NOT NULL DEFAULT '3x3', -- '3x3' (9 rutor), '3x4' (12 rutor), '3x5' (15 rutor)
  rows             INTEGER NOT NULL DEFAULT 3,         -- 3, 4 eller 5
  cols             INTEGER NOT NULL DEFAULT 3,         -- alltid 3 rutor per rad
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_team_game     BOOLEAN NOT NULL DEFAULT FALSE,     -- lagspel eller individuellt
  game_mode        VARCHAR(20) NOT NULL DEFAULT 'classic', -- 'classic' (fyll egen bricka) eller 'block' (erövra/blockera rutor)
  status           VARCHAR(20) NOT NULL DEFAULT 'lobby', -- 'lobby', 'active', 'finished', 'cancelled'
  starts_at        TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  winner_id        INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  winner_team_id   INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_games_host_id ON public.games(host_id);

CREATE TABLE IF NOT EXISTS public.game_teams (
  id         SERIAL PRIMARY KEY,
  game_id    INTEGER NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name       VARCHAR(50) NOT NULL,
  color      VARCHAR(20) NOT NULL DEFAULT '#EF4444',
  score      INTEGER NOT NULL DEFAULT 0,
  has_won    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_game_teams_game ON public.game_teams(game_id);

CREATE TABLE IF NOT EXISTS public.game_items (
  id         SERIAL PRIMARY KEY,
  game_id    INTEGER NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  tile_index INTEGER NOT NULL,
  label      VARCHAR(100) NOT NULL,
  emoji      VARCHAR(16) DEFAULT '🎯',
  hint       TEXT DEFAULT '',
  UNIQUE (game_id, tile_index)
);

CREATE TABLE IF NOT EXISTS public.game_participants (
  game_id             INTEGER NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id             INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_id             INTEGER REFERENCES public.game_teams(id) ON DELETE SET NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'invited', -- 'invited', 'accepted', 'declined'
  score               INTEGER NOT NULL DEFAULT 0,
  has_bingo           BOOLEAN NOT NULL DEFAULT FALSE,
  location            GEOMETRY(Point, 4326),
  accuracy_meters     DOUBLE PRECISION,
  icon                VARCHAR(16) DEFAULT '🐷',
  location_updated_at TIMESTAMPTZ,
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (game_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_participants_user ON public.game_participants(user_id, status);
CREATE INDEX IF NOT EXISTS idx_game_participants_team ON public.game_participants(team_id);

CREATE TABLE IF NOT EXISTS public.game_phings (
  id              SERIAL PRIMARY KEY,
  game_id         INTEGER NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_id         INTEGER REFERENCES public.game_teams(id) ON DELETE SET NULL,
  tile_index      INTEGER NOT NULL,
  location        GEOMETRY(Point, 4326) NOT NULL,
  accuracy_meters DOUBLE PRECISION,
  photo_thumb     TEXT NOT NULL,
  photo_data      TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'approved', -- 'approved', 'rejected'
  approved_count  INTEGER NOT NULL DEFAULT 0,
  rejected_count  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_phings_game ON public.game_phings(game_id);
CREATE INDEX IF NOT EXISTS idx_game_phings_user ON public.game_phings(user_id);
CREATE INDEX IF NOT EXISTS idx_game_phings_team ON public.game_phings(team_id);
CREATE INDEX IF NOT EXISTS idx_game_phings_tile ON public.game_phings(game_id, tile_index);

CREATE TABLE IF NOT EXISTS public.game_votes (
  phing_id   INTEGER NOT NULL REFERENCES public.game_phings(id) ON DELETE CASCADE,
  voter_id   INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote       VARCHAR(10) NOT NULL, -- 'approve' eller 'reject'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (phing_id, voter_id)
);

ALTER TABLE public.game_participants
  ADD COLUMN IF NOT EXISTS location GEOMETRY(Point, 4326),
  ADD COLUMN IF NOT EXISTS accuracy_meters DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS icon VARCHAR(16) DEFAULT '🐷',
  ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;

ALTER TABLE public.game_phings
  ADD COLUMN IF NOT EXISTS ai_score INTEGER,
  ADD COLUMN IF NOT EXISTS ai_reason TEXT;


