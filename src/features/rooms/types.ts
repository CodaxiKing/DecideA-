export type RoomItemType = 'food' | 'movie' | 'activity' | 'custom';
export type RoomStatus = 'lobby' | 'voting' | 'closed';
export type RoomVote = 'yes' | 'maybe' | 'no';

export interface Room {
  id: string;
  code: string;
  host_id: string;
  item_type: RoomItemType;
  decision_mode: 'vote' | 'match' | 'ranking' | 'battle' | 'wheel';
  status: RoomStatus;
  max_participants: number;
  vetoes_per_person: number;
  battle_state: BattleState | null;
  expires_at: string;
  created_at: string;
  closed_at: string | null;
}

/** Estado da Batalha em grupo, mantido pelo servidor. */
export interface BattleState {
  current: string[];
  next: string[];
  index: number;
  duel: number;
  round: number;
  total: number;
}

export interface RoomParticipant {
  room_id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
  finished_at: string | null;
  left_at: string | null;
}

export interface RoomOption {
  id: string;
  room_id: string;
  ref_id: string;
  title: string;
  position: number;
}

export interface RankingRow {
  option_id: string;
  title: string;
  yes: number;
  maybe: number;
  no: number;
  score: number;
  vetoed?: boolean;
}

export interface RoomResult {
  room_id: string;
  winner_option_id: string | null;
  ranking: RankingRow[];
  unanimous: boolean;
  tied_option_ids: string[];
  voters: number;
  vetoed_option_ids: string[];
  spin_offset: number | null;
  computed_at: string;
}

export interface RoomState {
  room: Room;
  participants: RoomParticipant[];
  options: RoomOption[];
  myVotes: Record<string, RoomVote>;
  myVetoes: string[];
  result: RoomResult | null;
  me: string;
}

/** Mensagens para os erros que o servidor devolve. */
export const roomErrorMessages: Record<string, string> = {
  room_not_found: 'Não achamos uma sala com esse código.',
  room_expired: 'Essa sala já expirou.',
  room_started: 'A votação dessa sala já começou.',
  room_full: 'Essa sala está cheia.',
  rate_limited: 'Você criou muitas salas agora. Espere um pouco.',
  host_only: 'Só quem criou a sala pode fazer isso.',
  not_voting: 'A votação não está aberta.',
  already_finished: 'Você já terminou de votar.',
  invalid_options: 'A sala precisa de 2 a 20 opções.',
  no_vetoes_left: 'Você já usou todos os seus vetos.',
  invite_invalid: 'Esse convite não existe. Peça um link novo.',
  invite_expired: 'Esse convite expirou. Peça um link novo.',
  invite_used_up: 'Esse convite já foi usado por gente demais. Peça um link novo.',
  invalid_mode: 'Modo de decisão inválido.',
  account_required: 'Isso precisa de uma conta. Entre em Perfil.',
  premium_required: 'Isso é do Premium.',
  username_taken: 'Esse nome de usuário já existe.',
  invalid_username: 'Use de 3 a 20 letras minúsculas, números, ponto ou _.',
  not_friends: 'Vocês precisam ser amigos.',
  already_paired: 'Alguém aqui já tem uma dupla.',
  user_not_found: 'Não achamos essa pessoa.',
  backend_unavailable: 'As salas precisam do servidor, que não está configurado neste app.',
  auth_required: 'Não deu para identificar este aparelho. Tente de novo.',
};

export function roomErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : '';
  const key = Object.keys(roomErrorMessages).find((k) => raw.includes(k));
  if (key) return roomErrorMessages[key];
  if (/network|fetch/i.test(raw)) return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
  return 'Algo deu errado. Tente de novo.';
}

export function isRoomExpired(room: Room, now: Date = new Date()): boolean {
  return room.status !== 'closed' && new Date(room.expires_at).getTime() < now.getTime();
}

export const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

export function normalizeRoomCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}
