import { apiGet, apiPost, apiPut } from './config';

export interface User {
  id: number;
  phone_number: string;
  display_name: string;
}

export interface Coords {
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
}

// En position som någon har delat med mig
export interface IncomingPosition {
  id: number;
  sender_id: number;
  sender_name: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  shared_at: string;
  expires_at: string;
  message?: string | null;
  icon?: string | null;
  photo_thumb?: string | null;
  has_photo?: boolean;
  is_meeting_point?: boolean;
}

// Någon vill se min position
export interface IncomingRequest {
  id: number;
  requester_id: number;
  requester_name: string;
  created_at: string;
  expires_at: string;
}

// Jag har bett någon om deras position
export interface OutgoingRequest {
  id: number;
  target_id: number;
  target_name: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  expires_at: string;
  responded_at: string | null;
  reciprocated_at: string | null;
}

// Min aktiva delning till någon annan
export interface ActiveShare {
  id: number;
  receiver_id: number;
  receiver_name: string;
  latitude?: number;
  longitude?: number;
  expires_at: string;
  message?: string | null;
  icon?: string | null;
  photo_thumb?: string | null;
  has_photo?: boolean;
  is_meeting_point?: boolean;
}

export type GridSize = '3x3' | '3x4' | '3x5';
export type GameMode = 'classic' | 'block';

export interface GameTeam {
  id: number;
  game_id: number;
  name: string;
  color: string;
  score: number;
  has_won: boolean;
}

export interface Game {
  id: number;
  host_id: number;
  host_name?: string;
  title: string;
  grid_size: GridSize;
  rows: number;
  cols: number;
  duration_minutes: number;
  is_team_game: boolean;
  game_mode: GameMode;
  status: 'lobby' | 'active' | 'finished' | 'cancelled';
  starts_at: string;
  expires_at: string;
  winner_id?: number | null;
  winner_team_id?: number | null;
  created_at: string;
  participant_status?: 'invited' | 'accepted' | 'declined';
  team_id?: number | null;
  team_name?: string;
  team_color?: string;
  score?: number;
  has_bingo?: boolean;
}

export interface GameItem {
  tile_index: number;
  label: string;
  emoji?: string;
}

export interface GameParticipant {
  user_id: number;
  display_name: string;
  team_id?: number | null;
  team_name?: string;
  team_color?: string;
  status: 'invited' | 'accepted' | 'declined';
  score: number;
  has_bingo: boolean;
}

export interface GamePhing {
  id: number;
  user_id: number;
  user_name: string;
  team_id?: number | null;
  team_name?: string;
  team_color?: string;
  tile_index: number;
  photo_thumb: string;
  photo_data?: string;
  latitude: number;
  longitude: number;
  status: 'approved' | 'rejected';
  approved_count: number;
  rejected_count: number;
  created_at: string;
}

export interface GameDetails {
  game: Game;
  teams: GameTeam[];
  items: GameItem[];
  participants: GameParticipant[];
  phings: GamePhing[];
}

export interface SharePhotoResponse {
  id: number;
  sender_id: number;
  sender_name: string;
  message?: string | null;
  shared_at: string;
  expires_at: string;
  photo_data: string;
}

export interface Inbox {
  positions: IncomingPosition[];
  requests: IncomingRequest[];
  outgoing: OutgoingRequest[];
  sharing: number[];
  active_shares?: ActiveShare[];
}

export const api = {
  register: (phone_number: string, display_name: string) =>
    apiPost<User>('/users', { phone_number, display_name }),

  getUser: (id: number) => apiGet<User>(`/users/${id}`),

  matchContacts: (phone_numbers: string[]) =>
    apiPost<{ matches: User[] }>('/contacts/match', { phone_numbers }),

  sharePosition: (body: Coords & { sender_id: number; receiver_id: number; request_id?: number | null; message?: string; duration_minutes?: number; is_background?: boolean; icon?: string; photo_thumb?: string | null; photo_data?: string | null; is_meeting_point?: boolean }) =>
    apiPost<{ id: number; expires_at: string }>('/position/share', body),

  getSharePhoto: (shareId: number) =>
    apiGet<SharePhotoResponse>(`/position/photo/${shareId}`),

  stopSharing: (sender_id: number, receiver_id?: number, is_meeting_point?: boolean) =>
    apiPost<{ ok: boolean }>(
      '/position/stop',
      receiver_id != null
        ? is_meeting_point !== undefined
          ? { sender_id, receiver_id, is_meeting_point }
          : { sender_id, receiver_id }
        : { sender_id }
    ),

  requestPosition: (requester_id: number, target_id: number) =>
    apiPost<{ id: number; status: string; expires_at: string }>('/requests', { requester_id, target_id }),

  respondToRequest: (requestId: number, body: { user_id: number; accept: boolean; message?: string; duration_minutes?: number; icon?: string } & Partial<Coords>) =>
    apiPost<{ status: string }>(`/requests/${requestId}/respond`, body),

  inbox: (userId: number) => apiGet<Inbox>(`/users/${userId}/inbox`),

  sendSignal: (sender_id: number, receiver_id: number, type: string, message?: string) =>
    apiPost<{ ok: boolean }>('/signals', { sender_id, receiver_id, type, message }),

  savePushToken: (userId: number, token: string | null) =>
    apiPut<{ ok: boolean }>(`/users/${userId}/push-token`, { token }),

  createGame: (body: {
    host_id: number;
    title: string;
    grid_size: GridSize;
    duration_minutes: number;
    is_team_game?: boolean;
    game_mode?: GameMode;
    starts_at?: string;
    items?: string[];
    participant_ids?: number[];
  }) => apiPost<Game>('/games', body),

  getUserGames: (userId: number) => apiGet<Game[]>(`/games/user/${userId}`),

  getGameDetails: (gameId: number) => apiGet<GameDetails>(`/games/${gameId}`),

  respondToGame: (gameId: number, userId: number, accept: boolean) =>
    apiPost<{ ok: boolean; status: string }>(`/games/${gameId}/respond`, { user_id: userId, accept }),

  startGame: (gameId: number, hostId: number) =>
    apiPost<{ ok: boolean; starts_at: string; expires_at: string }>(`/games/${gameId}/start`, { host_id: hostId }),

  submitGamePhing: (gameId: number, body: {
    user_id: number;
    tile_index: number;
    latitude: number;
    longitude: number;
    accuracy_meters?: number | null;
    photo_thumb: string;
    photo_data?: string;
  }) => apiPost<{ phing: GamePhing; userScore: number; hasWon: boolean; winningTeamName?: string }>('/games/' + gameId + '/phings', body),

  voteGamePhing: (gameId: number, phingId: number, voterId: number, vote: 'approve' | 'reject') =>
    apiPost<{ ok: boolean; approved_count: number; rejected_count: number; status: string }>(
      `/games/${gameId}/phings/${phingId}/vote`,
      { voter_id: voterId, vote }
    ),
};
