export interface Character {
  id: string;
  name: string;
  image?: string;
  avatarSeed?: string;
  attributes?: Record<string, any>;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  characters: Character[];
  commonQuestions?: Array<{
    text: string;
    key?: string;
    val?: any;
    hasAny?: boolean;
  }>;
  isCustom?: boolean;
}

export type GamePhase =
  | 'LOBBY'
  | 'QUESTION_TIME'
  | 'ANSWER_TIME'
  | 'ELIMINATION_TIME'
  | 'GAME_OVER';

export interface TurnHistoryItem {
  id: string;
  turnNumber: number;
  askerPlayerId: string;
  askerName: string;
  type: 'QUESTION' | 'GUESS';
  questionText?: string;
  answer?: boolean;
  guessedCharacterId?: string;
  guessedCharacterName?: string;
  isCorrect?: boolean;
  timestamp: number;
}

export interface PlayerSlot {
  id: string;
  name: string;
  token: string;
  connected: boolean;
  slot: 1 | 2;
  secretCharacterId?: string;
  eliminatedCardIds: string[];
  lastSeen: number;
}

export interface RoomSettings {
  instantLossOnWrongGuess: boolean;
  autoCheckAnswer: boolean;
}

export interface SanitizedRoomState {
  roomId: string;
  phase: GamePhase;
  turnNumber: number;
  currentTurnPlayerId: string | null;
  players: Array<{
    id: string;
    name: string;
    slot: 1 | 2;
    connected: boolean;
    cardCountEliminated: number;
  }>;
  spectatorCount: number;
  selectedDeck: Deck;
  myPlayerId: string;
  mySlot: 1 | 2 | null;
  mySecretCharacter: Character | null;
  myEliminatedIds: string[];
  history: TurnHistoryItem[];
  settings: RoomSettings;
  currentQuestion?: {
    askerPlayerId: string;
    askerName: string;
    text: string;
    attributeFilter?: Record<string, any>;
  } | null;
  gameOverData?: {
    winnerId: string | null;
    winnerName: string;
    loserId: string | null;
    reason: 'CORRECT_GUESS' | 'WRONG_GUESS' | 'DISCONNECT_SURRENDER';
    player1Secret: Character | null;
    player2Secret: Character | null;
  } | null;
}

// Client to Server Messages
export type ClientMessage =
  | { type: 'JOIN'; payload: { roomId: string; playerName: string; playerId: string; token: string } }
  | { type: 'START_GAME'; payload: { deckId?: string; customDeck?: Deck } }
  | { type: 'ASK_QUESTION'; payload: { question: string; attributeFilter?: Record<string, any> } }
  | { type: 'ANSWER_QUESTION'; payload: { answer: boolean } }
  | { type: 'END_ELIMINATION' }
  | { type: 'GUESS_CHARACTER'; payload: { characterId: string } }
  | { type: 'TOGGLE_CARD'; payload: { characterId: string; eliminated: boolean } }
  | { type: 'REMATCH_REQUEST' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<RoomSettings> }
  | { type: 'PING' };

// Server to Client Messages
export type ServerMessage =
  | { type: 'ROOM_STATE'; payload: SanitizedRoomState }
  | { type: 'PONG' }
  | { type: 'ERROR'; payload: { message: string } }
  | { type: 'NOTIFICATION'; payload: { message: string; type?: 'info' | 'success' | 'warning' } };
