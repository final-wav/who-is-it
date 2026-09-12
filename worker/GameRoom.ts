import {
  Character,
  ClientMessage,
  Deck,
  GamePhase,
  PlayerSlot,
  RoomSettings,
  SanitizedRoomState,
  ServerMessage,
  TurnHistoryItem,
} from './types';
import classicDeckRaw from '../decks/classic.json';
import animalsDeckRaw from '../decks/animals.json';

const classicDeck = classicDeckRaw as unknown as Deck;
const animalsDeck = animalsDeckRaw as unknown as Deck;

export class GameRoom implements DurableObject {
  private state: DurableObjectState;
  private sockets: Map<WebSocket, { playerId: string; slot: 1 | 2 | null }> = new Map();
  
  // Game Room State
  private roomId: string = '';
  private phase: GamePhase = 'LOBBY';
  private turnNumber: number = 1;
  private currentTurnPlayerId: string | null = null;
  private player1: PlayerSlot | null = null;
  private player2: PlayerSlot | null = null;
  private selectedDeck: Deck = classicDeck;
  private history: TurnHistoryItem[] = [];
  private currentQuestion: {
    askerPlayerId: string;
    askerName: string;
    text: string;
    attributeFilter?: Record<string, any>;
  } | null = null;
  private settings: RoomSettings = {
    instantLossOnWrongGuess: true,
    autoCheckAnswer: false,
  };
  private gameOverData: SanitizedRoomState['gameOverData'] = null;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Extract roomId from query or pathname
    const queryRoomId = url.searchParams.get('roomId');
    if (queryRoomId && !this.roomId) {
      this.roomId = queryRoomId.toUpperCase();
    }

    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      await this.handleWebSocketSession(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    if (url.pathname.endsWith('/state')) {
      return new Response(JSON.stringify({
        roomId: this.roomId,
        phase: this.phase,
        players: [this.player1?.name, this.player2?.name].filter(Boolean),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('GameRoom DO Active', { status: 200 });
  }

  private async handleWebSocketSession(ws: WebSocket) {
    ws.accept();
    this.sockets.set(ws, { playerId: '', slot: null });

    ws.addEventListener('message', async (event: MessageEvent) => {
      try {
        const raw = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data as ArrayBuffer);
        const message = JSON.parse(raw) as ClientMessage;
        await this.handleClientMessage(ws, message);
      } catch (err: any) {
        this.sendToSocket(ws, {
          type: 'ERROR',
          payload: { message: `Fehlerhafte Nachricht: ${err?.message || 'Ungültig'}` },
        });
      }
    });

    ws.addEventListener('close', () => {
      this.handleSocketDisconnect(ws);
    });

    ws.addEventListener('error', () => {
      this.handleSocketDisconnect(ws);
    });
  }

  private async handleClientMessage(ws: WebSocket, msg: ClientMessage) {
    switch (msg.type) {
      case 'PING': {
        this.sendToSocket(ws, { type: 'PONG' });
        break;
      }

      case 'JOIN': {
        const { roomId, playerName, playerId, token } = msg.payload;
        if (!this.roomId) {
          this.roomId = roomId.toUpperCase();
        }

        let slot: 1 | 2 | null = null;

        // Check if player is reconnecting to slot 1
        if (this.player1 && (this.player1.id === playerId || this.player1.token === token)) {
          this.player1.connected = true;
          this.player1.name = playerName || this.player1.name;
          this.player1.lastSeen = Date.now();
          slot = 1;
        }
        // Check if player is reconnecting to slot 2
        else if (this.player2 && (this.player2.id === playerId || this.player2.token === token)) {
          this.player2.connected = true;
          this.player2.name = playerName || this.player2.name;
          this.player2.lastSeen = Date.now();
          slot = 2;
        }
        // Slot 1 is free
        else if (!this.player1) {
          this.player1 = {
            id: playerId,
            name: playerName || 'Spieler 1',
            token,
            connected: true,
            slot: 1,
            eliminatedCardIds: [],
            lastSeen: Date.now(),
          };
          slot = 1;
        }
        // Slot 2 is free
        else if (!this.player2) {
          this.player2 = {
            id: playerId,
            name: playerName || 'Spieler 2',
            token,
            connected: true,
            slot: 2,
            eliminatedCardIds: [],
            lastSeen: Date.now(),
          };
          slot = 2;
        }

        this.sockets.set(ws, { playerId, slot });
        this.broadcastState();
        break;
      }

      case 'START_GAME': {
        const meta = this.sockets.get(ws);
        if (!meta || !meta.slot) {
          this.sendToSocket(ws, { type: 'ERROR', payload: { message: 'Nur aktive Spieler können das Spiel starten.' } });
          return;
        }

        if (!this.player1 || !this.player2) {
          this.sendToSocket(ws, { type: 'ERROR', payload: { message: 'Warte auf den zweiten Spieler!' } });
          return;
        }

        // Apply deck if supplied
        if (msg.payload.customDeck && msg.payload.customDeck.characters.length >= 2) {
          this.selectedDeck = msg.payload.customDeck;
        } else if (msg.payload.deckId === 'animals') {
          this.selectedDeck = animalsDeck;
        } else {
          this.selectedDeck = classicDeck;
        }

        this.startNewMatch();
        this.broadcastState();
        break;
      }

      case 'ASK_QUESTION': {
        const meta = this.sockets.get(ws);
        if (!meta || meta.playerId !== this.currentTurnPlayerId) {
          this.sendToSocket(ws, { type: 'ERROR', payload: { message: 'Du bist gerade nicht an der Reihe!' } });
          return;
        }

        if (this.phase !== 'QUESTION_TIME') {
          this.sendToSocket(ws, { type: 'ERROR', payload: { message: 'In dieser Phase können keine Fragen gestellt werden.' } });
          return;
        }

        const asker = meta.slot === 1 ? this.player1 : this.player2;
        this.currentQuestion = {
          askerPlayerId: meta.playerId,
          askerName: asker?.name || 'Gegner',
          text: msg.payload.question,
          attributeFilter: msg.payload.attributeFilter,
        };

        this.phase = 'ANSWER_TIME';
        this.broadcastState();
        break;
      }

      case 'ANSWER_QUESTION': {
        const meta = this.sockets.get(ws);
        if (!meta || !meta.slot) return;

        // Only the opponent of currentTurnPlayerId can answer
        if (meta.playerId === this.currentTurnPlayerId) {
          this.sendToSocket(ws, { type: 'ERROR', payload: { message: 'Du kannst deine eigene Frage nicht beantworten!' } });
          return;
        }

        if (this.phase !== 'ANSWER_TIME' || !this.currentQuestion) {
          this.sendToSocket(ws, { type: 'ERROR', payload: { message: 'Es liegt aktuell keine unbeantwortete Frage vor.' } });
          return;
        }

        const answerBool = Boolean(msg.payload.answer);

        // Add to history
        this.history.unshift({
          id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          turnNumber: this.turnNumber,
          askerPlayerId: this.currentQuestion.askerPlayerId,
          askerName: this.currentQuestion.askerName,
          type: 'QUESTION',
          questionText: this.currentQuestion.text,
          answer: answerBool,
          timestamp: Date.now(),
        });

        this.currentQuestion = null;
        // The asking player can now knock down cards
        this.phase = 'ELIMINATION_TIME';
        this.broadcastState();
        break;
      }

      case 'END_ELIMINATION': {
        const meta = this.sockets.get(ws);
        if (!meta || meta.playerId !== this.currentTurnPlayerId) return;

        if (this.phase !== 'ELIMINATION_TIME') return;

        // Switch turn to opponent
        this.turnNumber += 1;
        this.currentTurnPlayerId = meta.slot === 1 ? this.player2?.id || null : this.player1?.id || null;
        this.phase = 'QUESTION_TIME';
        this.broadcastState();
        break;
      }

      case 'GUESS_CHARACTER': {
        const meta = this.sockets.get(ws);
        if (!meta || meta.playerId !== this.currentTurnPlayerId) {
          this.sendToSocket(ws, { type: 'ERROR', payload: { message: 'Du bist nicht an der Reihe für einen Lösungsversuch.' } });
          return;
        }

        if (this.phase !== 'QUESTION_TIME') {
          this.sendToSocket(ws, { type: 'ERROR', payload: { message: 'Ein Lösungsversuch ist nur zu Beginn deines Zuges möglich.' } });
          return;
        }

        const guesser = meta.slot === 1 ? this.player1 : this.player2;
        const opponent = meta.slot === 1 ? this.player2 : this.player1;
        if (!guesser || !opponent || !opponent.secretCharacterId) return;

        const guessedChar = this.selectedDeck.characters.find(c => c.id === msg.payload.characterId);
        const isCorrect = opponent.secretCharacterId === msg.payload.characterId;

        // Record history
        this.history.unshift({
          id: `guess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          turnNumber: this.turnNumber,
          askerPlayerId: guesser.id,
          askerName: guesser.name,
          type: 'GUESS',
          guessedCharacterId: msg.payload.characterId,
          guessedCharacterName: guessedChar?.name || 'Unbekannt',
          isCorrect,
          timestamp: Date.now(),
        });

        if (isCorrect) {
          // GUESSER WINS!
          this.triggerGameOver(guesser.id, guesser.name, opponent.id, 'CORRECT_GUESS');
        } else {
          // WRONG GUESS!
          if (this.settings.instantLossOnWrongGuess) {
            // Guesser loses immediately, opponent wins!
            this.triggerGameOver(opponent.id, opponent.name, guesser.id, 'WRONG_GUESS');
          } else {
            // Switch turn to opponent
            this.turnNumber += 1;
            this.currentTurnPlayerId = opponent.id;
            this.phase = 'QUESTION_TIME';
            this.broadcastState();
          }
        }
        break;
      }

      case 'TOGGLE_CARD': {
        const meta = this.sockets.get(ws);
        if (!meta || !meta.slot) return;

        const player = meta.slot === 1 ? this.player1 : this.player2;
        if (!player) return;

        const { characterId, eliminated } = msg.payload;
        if (eliminated) {
          if (!player.eliminatedCardIds.includes(characterId)) {
            player.eliminatedCardIds.push(characterId);
          }
        } else {
          player.eliminatedCardIds = player.eliminatedCardIds.filter(id => id !== characterId);
        }

        this.broadcastState();
        break;
      }

      case 'REMATCH_REQUEST': {
        const meta = this.sockets.get(ws);
        if (!meta || !meta.slot) return;

        if (this.player1 && this.player2) {
          this.startNewMatch();
          this.broadcastState();
        }
        break;
      }

      case 'UPDATE_SETTINGS': {
        const meta = this.sockets.get(ws);
        if (meta?.slot === 1) {
          this.settings = { ...this.settings, ...msg.payload };
          this.broadcastState();
        }
        break;
      }
    }
  }

  private startNewMatch() {
    if (!this.player1 || !this.player2) return;

    const chars = this.selectedDeck.characters;
    if (chars.length < 2) return;

    // Shuffle and pick 2 distinct secret characters
    const shuffled = [...chars].sort(() => Math.random() - 0.5);
    this.player1.secretCharacterId = shuffled[0].id;
    this.player2.secretCharacterId = shuffled[1].id;

    this.player1.eliminatedCardIds = [];
    this.player2.eliminatedCardIds = [];

    this.history = [];
    this.turnNumber = 1;
    this.currentQuestion = null;
    this.gameOverData = null;

    // Randomize first player or alternate
    this.currentTurnPlayerId = Math.random() > 0.5 ? this.player1.id : this.player2.id;
    this.phase = 'QUESTION_TIME';
  }

  private triggerGameOver(
    winnerId: string,
    winnerName: string,
    loserId: string,
    reason: 'CORRECT_GUESS' | 'WRONG_GUESS' | 'DISCONNECT_SURRENDER'
  ) {
    this.phase = 'GAME_OVER';
    const p1Secret = this.selectedDeck.characters.find(c => c.id === this.player1?.secretCharacterId) || null;
    const p2Secret = this.selectedDeck.characters.find(c => c.id === this.player2?.secretCharacterId) || null;

    this.gameOverData = {
      winnerId,
      winnerName,
      loserId,
      reason,
      player1Secret: p1Secret,
      player2Secret: p2Secret,
    };
    this.broadcastState();
  }

  private handleSocketDisconnect(ws: WebSocket) {
    const meta = this.sockets.get(ws);
    this.sockets.delete(ws);

    if (meta?.playerId) {
      if (this.player1 && this.player1.id === meta.playerId) {
        this.player1.connected = false;
        this.player1.lastSeen = Date.now();
      } else if (this.player2 && this.player2.id === meta.playerId) {
        this.player2.connected = false;
        this.player2.lastSeen = Date.now();
      }
      this.broadcastState();
    }
  }

  // CRITICAL SECURITY REQUIREMENT:
  // Never leak the opponent's secret card to the client before GAME_OVER!
  private sanitizeStateForPlayer(targetPlayerId: string): SanitizedRoomState {
    const isPlayer1 = this.player1?.id === targetPlayerId;
    const isPlayer2 = this.player2?.id === targetPlayerId;
    const mySlot: 1 | 2 | null = isPlayer1 ? 1 : isPlayer2 ? 2 : null;

    let mySecretCharacter: Character | null = null;
    let myEliminatedIds: string[] = [];

    if (mySlot === 1 && this.player1?.secretCharacterId) {
      mySecretCharacter = this.selectedDeck.characters.find(c => c.id === this.player1?.secretCharacterId) || null;
      myEliminatedIds = this.player1.eliminatedCardIds;
    } else if (mySlot === 2 && this.player2?.secretCharacterId) {
      mySecretCharacter = this.selectedDeck.characters.find(c => c.id === this.player2?.secretCharacterId) || null;
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
      roomId: this.roomId,
      phase: this.phase,
      turnNumber: this.turnNumber,
      currentTurnPlayerId: this.currentTurnPlayerId,
      players: playersSummary,
      spectatorCount: Math.max(0, this.sockets.size - (this.player1 ? 1 : 0) - (this.player2 ? 1 : 0)),
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

  private broadcastState() {
    for (const [socket, meta] of this.sockets.entries()) {
      if (socket.readyState === WebSocket.OPEN) {
        const sanitized = this.sanitizeStateForPlayer(meta.playerId);
        this.sendToSocket(socket, {
          type: 'ROOM_STATE',
          payload: sanitized,
        });
      }
    }
  }

  private sendToSocket(socket: WebSocket, message: ServerMessage) {
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(message));
      } catch (e) {
        console.error('Failed to send WebSocket message:', e);
      }
    }
  }
}
