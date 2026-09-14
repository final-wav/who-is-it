import {
  Character,
  Deck,
  GamePhase,
  PlayerSlot,
  RoomSettings,
  SanitizedRoomState,
  TurnHistoryItem,
} from '../worker/types';
import classicDeckRaw from '../decks/classic.json';
import animalsDeckRaw from '../decks/animals.json';

const classicDeck = classicDeckRaw as unknown as Deck;
const animalsDeck = animalsDeckRaw as unknown as Deck;

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne I/O/0/1
export function makeCode(): string {
  let s = '';
  for (let i = 0; i < 4; i++) {
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return s;
}

const uid = () => 'p_' + Math.random().toString(36).substring(2, 11);
const utoken = () => 't_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export interface ServerPlayer {
  id: string;
  token: string;
  name: string;
  slot: 1 | 2;
  connected: boolean;
  secretCharacterId?: string;
  eliminatedCardIds: string[];
  lastSeen: number;
  send: (msg: any) => void;
}

export class Room {
  code: string;
  phase: GamePhase = 'LOBBY';
  turnNumber: number = 1;
  currentTurnPlayerId: string | null = null;
  player1: ServerPlayer | null = null; // Slot 1 (Host / Rot)
  player2: ServerPlayer | null = null; // Slot 2 (Guest / Blau)
  selectedDeck: Deck = classicDeck;
  history: TurnHistoryItem[] = [];
  currentQuestion: {
    askerPlayerId: string;
    askerName: string;
    text: string;
    attributeFilter?: Record<string, any>;
  } | null = null;
  settings: RoomSettings = {
    instantLossOnWrongGuess: false,
    autoCheckAnswer: false,
  };
  gameOverData: SanitizedRoomState['gameOverData'] = null;

  onChange: () => void = () => {};

  constructor(code: string) {
    this.code = code.toUpperCase();
  }

  isFull(): boolean {
    return Boolean(this.player1 && this.player2);
  }

  get empty(): boolean {
    const p1Active = this.player1?.connected;
    const p2Active = this.player2?.connected;
    return !p1Active && !p2Active;
  }

  addPlayer(name: string, send: (msg: any) => void): ServerPlayer {
    const cleanName = name.slice(0, 24).trim() || 'Spieler';
    const id = uid();
    const token = utoken();

    if (!this.player1) {
      const p: ServerPlayer = {
        id,
        token,
        name: cleanName,
        slot: 1,
        connected: true,
        eliminatedCardIds: [],
        lastSeen: Date.now(),
        send,
      };
      this.player1 = p;
      return p;
    }

    if (!this.player2) {
      const p: ServerPlayer = {
        id,
        token,
        name: cleanName,
        slot: 2,
        connected: true,
        eliminatedCardIds: [],
        lastSeen: Date.now(),
        send,
      };
      this.player2 = p;
      return p;
    }

    // Falls beide Slots belegt, aber einer getrennt ist:
    if (!this.player2.connected) {
      this.player2.id = id;
      this.player2.token = token;
      this.player2.name = cleanName;
      this.player2.connected = true;
      this.player2.send = send;
      return this.player2;
    }

    throw new Error('Der Raum ist voll.');
  }

  reattach(playerId: string, token: string, send: (msg: any) => void): ServerPlayer | null {
    if (this.player1 && (this.player1.id === playerId || this.player1.token === token)) {
      this.player1.connected = true;
      this.player1.send = send;
      this.player1.lastSeen = Date.now();
      return this.player1;
    }
    if (this.player2 && (this.player2.id === playerId || this.player2.token === token)) {
      this.player2.connected = true;
      this.player2.send = send;
      this.player2.lastSeen = Date.now();
      return this.player2;
    }
    return null;
  }

  markDisconnected(playerId: string) {
    if (this.player1 && this.player1.id === playerId) {
      this.player1.connected = false;
      this.player1.lastSeen = Date.now();
    }
    if (this.player2 && this.player2.id === playerId) {
      this.player2.connected = false;
      this.player2.lastSeen = Date.now();
    }
    this.onChange();
  }

  start(playerId: string, deckId?: string, customDeck?: Deck): string | null {
    if (this.player1?.id !== playerId) {
      return 'Nur der Host (Rotes Brett) kann das Spiel starten.';
    }
    if (!this.player1 || !this.player2) {
      return 'Warte auf den zweiten Spieler!';
    }

    if (customDeck && customDeck.characters && customDeck.characters.length >= 2) {
      this.selectedDeck = customDeck;
    } else if (deckId === 'animals') {
      this.selectedDeck = animalsDeck;
    } else {
      this.selectedDeck = classicDeck;
    }

    const chars = this.selectedDeck.characters;
    if (chars.length < 2) return 'Deck hat zu wenige Karten.';

    const shuffled = [...chars].sort(() => Math.random() - 0.5);
    this.player1.secretCharacterId = shuffled[0].id;
    this.player2.secretCharacterId = shuffled[1].id;
    this.player1.eliminatedCardIds = [];
    this.player2.eliminatedCardIds = [];

    this.history = [];
    this.turnNumber = 1;
    this.currentQuestion = null;
    this.gameOverData = null;

    // Host fängt standardmäßig an
    this.currentTurnPlayerId = this.player1.id;
    this.phase = 'QUESTION_TIME';
    this.onChange();
    return null;
  }

  askQuestion(
    playerId: string,
    question: string,
    attributeFilter?: Record<string, any>
  ): string | null {
    if (this.phase !== 'QUESTION_TIME') return 'In dieser Phase können keine Fragen gestellt werden.';
    if (this.currentTurnPlayerId !== playerId) return 'Du bist gerade nicht am Zug!';

    const asker = this.player1?.id === playerId ? this.player1 : this.player2;
    this.currentQuestion = {
      askerPlayerId: playerId,
      askerName: asker?.name || 'Spieler',
      text: question,
      attributeFilter,
    };
    this.phase = 'ANSWER_TIME';
    this.onChange();
    return null;
  }

  answerQuestion(playerId: string, answer: boolean): string | null {
    if (this.phase !== 'ANSWER_TIME' || !this.currentQuestion) {
      return 'Es liegt aktuell keine unbeantwortete Frage vor.';
    }
    if (this.currentQuestion.askerPlayerId === playerId) {
      return 'Du kannst deine eigene Frage nicht beantworten!';
    }

    this.history.unshift({
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      turnNumber: this.turnNumber,
      askerPlayerId: this.currentQuestion.askerPlayerId,
      askerName: this.currentQuestion.askerName,
      type: 'QUESTION',
      questionText: this.currentQuestion.text,
      answer: Boolean(answer),
      timestamp: Date.now(),
    });

    this.currentQuestion = null;
    this.phase = 'ELIMINATION_TIME';
    this.onChange();
    return null;
  }

  endElimination(playerId: string): string | null {
    if (this.phase !== 'ELIMINATION_TIME') return 'Nicht in der Umklapp-Phase.';
    if (this.currentTurnPlayerId !== playerId) return 'Nicht dein Zug.';

    this.turnNumber += 1;
    this.currentTurnPlayerId =
      this.currentTurnPlayerId === this.player1?.id ? this.player2?.id || null : this.player1?.id || null;
    this.phase = 'QUESTION_TIME';
    this.onChange();
    return null;
  }

  guessCharacter(playerId: string, characterId: string): string | null {
    if (this.phase !== 'QUESTION_TIME') return 'Lösungsversuch nur zu Beginn deines Zuges.';
    if (this.currentTurnPlayerId !== playerId) return 'Du bist nicht am Zug.';

    const guesser = this.player1?.id === playerId ? this.player1 : this.player2;
    const opponent = this.player1?.id === playerId ? this.player2 : this.player1;
    if (!guesser || !opponent || !opponent.secretCharacterId) return 'Ungültige Spieler.';

    const guessedChar = this.selectedDeck.characters.find((c) => c.id === characterId);
    const isCorrect = opponent.secretCharacterId === characterId;

    this.history.unshift({
      id: `guess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      turnNumber: this.turnNumber,
      askerPlayerId: guesser.id,
      askerName: guesser.name,
      type: 'GUESS',
      guessedCharacterId: characterId,
      guessedCharacterName: guessedChar?.name || 'Unbekannt',
      isCorrect,
      timestamp: Date.now(),
    });

    if (isCorrect) {
      this.triggerGameOver(guesser.id, guesser.name, opponent.id, 'CORRECT_GUESS');
    } else {
      if (this.settings.instantLossOnWrongGuess) {
        this.triggerGameOver(opponent.id, opponent.name, guesser.id, 'WRONG_GUESS');
      } else {
        this.turnNumber += 1;
        this.currentTurnPlayerId = opponent.id;
        this.phase = 'QUESTION_TIME';
        this.onChange();
      }
    }
    return null;
  }

  toggleCard(playerId: string, characterId: string, eliminated: boolean): string | null {
    const player = this.player1?.id === playerId ? this.player1 : this.player2?.id === playerId ? this.player2 : null;
    if (!player) return 'Spieler nicht gefunden.';

    if (eliminated) {
      if (!player.eliminatedCardIds.includes(characterId)) {
        player.eliminatedCardIds.push(characterId);
      }
    } else {
      player.eliminatedCardIds = player.eliminatedCardIds.filter((id) => id !== characterId);
    }
    this.onChange();
    return null;
  }

  rematch(playerId: string): string | null {
    if (!this.player1 || !this.player2) return 'Warte auf Mitspieler.';
    this.start(this.player1.id);
    return null;
  }

  updateSettings(playerId: string, patch: Partial<RoomSettings>): string | null {
    if (this.player1?.id !== playerId) return 'Nur der Host kann Einstellungen ändern.';
    this.settings = { ...this.settings, ...patch };
    this.onChange();
    return null;
  }

  private triggerGameOver(
    winnerId: string,
    winnerName: string,
    loserId: string,
    reason: 'CORRECT_GUESS' | 'WRONG_GUESS' | 'DISCONNECT_SURRENDER'
  ) {
    this.phase = 'GAME_OVER';
    const p1Secret = this.selectedDeck.characters.find((c) => c.id === this.player1?.secretCharacterId) || null;
    const p2Secret = this.selectedDeck.characters.find((c) => c.id === this.player2?.secretCharacterId) || null;

    this.gameOverData = {
      winnerId,
      winnerName,
      loserId,
      reason,
      player1Secret: p1Secret,
      player2Secret: p2Secret,
    };
    this.onChange();
  }

  snapshotFor(targetPlayerId: string): SanitizedRoomState {
    const isP1 = this.player1?.id === targetPlayerId;
    const isP2 = this.player2?.id === targetPlayerId;
    const mySlot: 1 | 2 | null = isP1 ? 1 : isP2 ? 2 : null;

    let mySecretCharacter: Character | null = null;
    let myEliminatedIds: string[] = [];

    if (mySlot === 1 && this.player1?.secretCharacterId) {
      mySecretCharacter =
        this.selectedDeck.characters.find((c) => c.id === this.player1?.secretCharacterId) || null;
      myEliminatedIds = this.player1.eliminatedCardIds;
    } else if (mySlot === 2 && this.player2?.secretCharacterId) {
      mySecretCharacter =
        this.selectedDeck.characters.find((c) => c.id === this.player2?.secretCharacterId) || null;
      myEliminatedIds = this.player2.eliminatedCardIds;
    }

    const playersSummary = [];
    if (this.player1) {
      playersSummary.push({
        id: this.player1.id,
        name: this.player1.name,
        slot: 1 as const,
        connected: this.player1.connected,
        cardCountEliminated: this.player1.eliminatedCardIds.length,
      });
    }
    if (this.player2) {
      playersSummary.push({
        id: this.player2.id,
        name: this.player2.name,
        slot: 2 as const,
        connected: this.player2.connected,
        cardCountEliminated: this.player2.eliminatedCardIds.length,
      });
    }

    return {
      roomId: this.code,
      phase: this.phase,
      turnNumber: this.turnNumber,
      currentTurnPlayerId: this.currentTurnPlayerId,
      players: playersSummary,
      spectatorCount: 0,
      selectedDeck: this.selectedDeck,
      myPlayerId: targetPlayerId,
      mySlot,
      mySecretCharacter,
      myEliminatedIds,
      history: this.history,
      settings: this.settings,
      currentQuestion: this.currentQuestion,
      gameOverData: this.phase === 'GAME_OVER' ? this.gameOverData : null,
    };
  }
}

export class RoomManager {
  private rooms = new Map<string, Room>();

  create(): Room {
    let code: string;
    do {
      code = makeCode();
    } while (this.rooms.has(code));

    const room = new Room(code);
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  dispose(code: string) {
    this.rooms.delete(code.toUpperCase());
  }
}
