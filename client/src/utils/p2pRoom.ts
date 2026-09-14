import { Peer, DataConnection } from 'peerjs';
import classicDeckRaw from '../../../decks/classic.json';
import animalsDeckRaw from '../../../decks/animals.json';
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
} from '../../../worker/types';

const classicDeck = classicDeckRaw as unknown as Deck;
const animalsDeck = animalsDeckRaw as unknown as Deck;

export interface P2PRoomManagerOptions {
  roomId: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  token: string;
  onStateChange: (state: SanitizedRoomState) => void;
  onError: (msg: string) => void;
  onConnected: (connected: boolean) => void;
}

export class P2PRoomManager {
  private roomId: string;
  private playerId: string;
  private playerName: string;
  private isHost: boolean;
  private token: string;
  private onStateChange: (state: SanitizedRoomState) => void;
  private onError: (msg: string) => void;
  private onConnected: (connected: boolean) => void;

  private bc: BroadcastChannel | null = null;
  private peer: Peer | null = null;
  private guestConn: DataConnection | null = null; // Used by Host
  private hostConn: DataConnection | null = null;  // Used by Guest

  // Host Authoritative State
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
    instantLossOnWrongGuess: false,
    autoCheckAnswer: false,
  };
  private gameOverData: SanitizedRoomState['gameOverData'] = null;

  private isDestroyed: boolean = false;
  private reconnectTimer: number | null = null;

  constructor(options: P2PRoomManagerOptions) {
    this.roomId = options.roomId.toUpperCase();
    this.playerId = options.playerId;
    this.playerName = options.playerName;
    this.isHost = options.isHost;
    this.token = options.token;
    this.onStateChange = options.onStateChange;
    this.onError = options.onError;
    this.onConnected = options.onConnected;

    this.init();
  }

  private getHostPeerId(): string {
    return `who-is-it-2026-${this.roomId.toLowerCase()}-host`;
  }

  private init() {
    // 1. Setup BroadcastChannel (Instant local cross-tab sync)
    try {
      this.bc = new BroadcastChannel(`who-is-it-bc-${this.roomId}`);
      this.bc.onmessage = (event) => {
        if (this.isDestroyed) return;
        this.handleChannelMessage(event.data);
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    // 2. Setup PeerJS (Global WebRTC P2P between different devices)
    if (this.isHost) {
      this.initHost();
    } else {
      this.initGuest();
    }

    window.addEventListener('beforeunload', this.handleUnload);
  }

  private handleUnload = () => {
    this.destroy();
  };

  // ==========================================
  // HOST IMPLEMENTATION
  // ==========================================
  private initHost() {
    this.player1 = {
      id: this.playerId,
      name: this.playerName.trim() || 'Spieler 1',
      token: this.token,
      connected: true,
      slot: 1,
      eliminatedCardIds: [],
      lastSeen: Date.now(),
    };
    this.currentTurnPlayerId = this.playerId;

    this.broadcastHostState();
    this.onConnected(true);

    const hostPeerId = this.getHostPeerId();
    try {
      this.peer = new Peer(hostPeerId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });

      this.peer.on('open', () => {
        console.log('[P2P Host] Registered Peer ID:', hostPeerId);
        this.onConnected(true);
      });

      this.peer.on('connection', (conn) => {
        console.log('[P2P Host] Guest connected via WebRTC');
        this.guestConn = conn;

        conn.on('open', () => {
          this.broadcastHostState();
        });

        conn.on('data', (data) => {
          try {
            const msg = (typeof data === 'string' ? JSON.parse(data) : data) as ClientMessage;
            this.handleHostClientMessage(msg);
          } catch (err) {
            console.error('[P2P Host] Error processing guest data:', err);
          }
        });

        conn.on('close', () => {
          console.log('[P2P Host] Guest WebRTC connection closed');
          if (this.player2) {
            this.player2.connected = false;
            this.broadcastHostState();
          }
        });
      });

      this.peer.on('error', (err: any) => {
        console.warn('[P2P Host] PeerJS error:', err?.type || err);
        if (err?.type === 'unavailable-id') {
          setTimeout(() => {
            if (!this.isDestroyed) this.initHost();
          }, 2000);
        }
      });
    } catch (e) {
      console.error('[P2P Host] Failed to initialize PeerJS:', e);
    }
  }

  // ==========================================
  // GUEST IMPLEMENTATION
  // ==========================================
  private initGuest() {
    this.onConnected(false);

    // Send JOIN over BroadcastChannel immediately
    this.sendToHost({
      type: 'JOIN',
      payload: {
        roomId: this.roomId,
        playerName: this.playerName,
        playerId: this.playerId,
        token: this.token,
      },
    });

    this.connectGuestToHostPeer();

    this.reconnectTimer = window.setInterval(() => {
      if (this.isDestroyed) return;
      if (!this.hostConn || !this.hostConn.open) {
        this.sendToHost({
          type: 'JOIN',
          payload: {
            roomId: this.roomId,
            playerName: this.playerName,
            playerId: this.playerId,
            token: this.token,
          },
        });
        this.connectGuestToHostPeer();
      }
    }, 2500);
  }

  private connectGuestToHostPeer() {
    if (this.hostConn && this.hostConn.open) return;

    try {
      if (!this.peer || this.peer.destroyed) {
        this.peer = new Peer({
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        });
      }

      this.peer.on('open', () => {
        const hostPeerId = this.getHostPeerId();
        const conn = this.peer!.connect(hostPeerId, { reliable: true });
        this.hostConn = conn;

        conn.on('open', () => {
          console.log('[P2P Guest] Connected to Host via WebRTC!');
          this.onConnected(true);
          conn.send({
            type: 'JOIN',
            payload: {
              roomId: this.roomId,
              playerName: this.playerName,
              playerId: this.playerId,
              token: this.token,
            },
          });
        });

        conn.on('data', (data) => {
          try {
            const msg = (typeof data === 'string' ? JSON.parse(data) : data) as ServerMessage;
            this.handleGuestServerMessage(msg);
          } catch (err) {
            console.error('[P2P Guest] Error parsing server message:', err);
          }
        });

        conn.on('close', () => {
          console.log('[P2P Guest] WebRTC connection to host closed');
          this.onConnected(false);
        });
      });

      this.peer.on('error', (err) => {
        console.warn('[P2P Guest] PeerJS error:', err?.type || err);
      });
    } catch (e) {
      console.error('[P2P Guest] Peer connection error:', e);
    }
  }

  // ==========================================
  // DISPATCHING & HANDLING MESSAGES
  // ==========================================
  public send(msg: ClientMessage) {
    if (this.isHost) {
      this.handleHostClientMessage(msg);
    } else {
      this.sendToHost(msg);
    }
  }

  private sendToHost(msg: ClientMessage) {
    if (this.hostConn && this.hostConn.open) {
      try {
        this.hostConn.send(msg);
      } catch (e) {
        console.warn('Failed to send to host via WebRTC', e);
      }
    }

    if (this.bc) {
      try {
        this.bc.postMessage({ kind: 'TO_HOST', msg });
      } catch (e) {
        // ignore
      }
    }
  }

  private sendToGuest(msg: ServerMessage) {
    if (this.guestConn && this.guestConn.open) {
      try {
        this.guestConn.send(msg);
      } catch (e) {
        console.warn('Failed to send to guest via WebRTC', e);
      }
    }

    if (this.bc) {
      try {
        this.bc.postMessage({ kind: 'TO_GUEST', msg });
      } catch (e) {
        // ignore
      }
    }
  }

  private handleChannelMessage(data: any) {
    if (!data || typeof data !== 'object') return;

    if (this.isHost && data.kind === 'TO_HOST') {
      this.handleHostClientMessage(data.msg as ClientMessage);
    } else if (!this.isHost && data.kind === 'TO_GUEST') {
      this.handleGuestServerMessage(data.msg as ServerMessage);
    }
  }

  private handleGuestServerMessage(msg: ServerMessage) {
    if (msg.type === 'ROOM_STATE') {
      this.onConnected(true);
      this.onStateChange(msg.payload);
    } else if (msg.type === 'ERROR') {
      this.onError(msg.payload.message);
    }
  }

  // ==========================================
  // HOST GAME LOGIC (Matches Cloudflare Worker)
  // ==========================================
  private handleHostClientMessage(rawMsg: any) {
    const type =
      rawMsg.type ||
      (rawMsg.t === 'create' || rawMsg.t === 'join'
        ? 'JOIN'
        : rawMsg.t === 'start'
        ? 'START_GAME'
        : rawMsg.t === 'ask'
        ? 'ASK_QUESTION'
        : rawMsg.t === 'answer'
        ? 'ANSWER_QUESTION'
        : rawMsg.t === 'endElimination'
        ? 'END_ELIMINATION'
        : rawMsg.t === 'guess'
        ? 'GUESS_CHARACTER'
        : rawMsg.t === 'toggleCard'
        ? 'TOGGLE_CARD'
        : rawMsg.t === 'rematch'
        ? 'REMATCH_REQUEST'
        : rawMsg.t);

    const msg = {
      ...rawMsg,
      type,
      payload: rawMsg.payload || rawMsg,
    };

    switch (msg.type) {
      case 'PING':
        this.sendToGuest({ type: 'PONG' });
        break;

      case 'JOIN': {
        const playerName = msg.payload.playerName || msg.payload.name || 'Spieler';
        const playerId = msg.payload.playerId || msg.playerId;
        const token = msg.payload.token || msg.token;

        if (this.player1 && (this.player1.id === playerId || this.player1.token === token)) {
          this.player1.connected = true;
          this.player1.name = playerName || this.player1.name;
          this.player1.lastSeen = Date.now();
        } else if (this.player2 && (this.player2.id === playerId || this.player2.token === token)) {
          this.player2.connected = true;
          this.player2.name = playerName || this.player2.name;
          this.player2.lastSeen = Date.now();
        } else {
          this.player2 = {
            id: playerId,
            name: playerName.trim() || 'Spieler 2',
            token,
            connected: true,
            slot: 2,
            eliminatedCardIds: [],
            lastSeen: Date.now(),
          };
        }

        this.broadcastHostState();
        break;
      }

      case 'START_GAME': {
        if (!this.player1) return;

        if (msg.payload.customDeck && msg.payload.customDeck.characters.length >= 2) {
          this.selectedDeck = msg.payload.customDeck;
        } else if (msg.payload.deckId === 'animals') {
          this.selectedDeck = animalsDeck;
        } else {
          this.selectedDeck = classicDeck;
        }

        this.startNewMatch();
        this.broadcastHostState();
        break;
      }

      case 'ASK_QUESTION': {
        if (this.phase !== 'QUESTION_TIME') return;

        const askerSlot = this.currentTurnPlayerId === this.player1?.id ? 1 : 2;
        const asker = askerSlot === 1 ? this.player1 : this.player2;

        this.currentQuestion = {
          askerPlayerId: this.currentTurnPlayerId || '',
          askerName: asker?.name || 'Gegner',
          text: msg.payload.question,
          attributeFilter: msg.payload.attributeFilter,
        };

        this.phase = 'ANSWER_TIME';
        this.broadcastHostState();
        break;
      }

      case 'ANSWER_QUESTION': {
        if (this.phase !== 'ANSWER_TIME' || !this.currentQuestion) return;

        const answerBool = Boolean(msg.payload.answer);

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
        this.phase = 'ELIMINATION_TIME';
        this.broadcastHostState();
        break;
      }

      case 'END_ELIMINATION': {
        if (this.phase !== 'ELIMINATION_TIME') return;

        this.turnNumber += 1;
        if (this.currentTurnPlayerId === this.player1?.id) {
          this.currentTurnPlayerId = this.player2?.id || this.player1?.id || null;
        } else {
          this.currentTurnPlayerId = this.player1?.id || null;
        }

        this.phase = 'QUESTION_TIME';
        this.broadcastHostState();
        break;
      }

      case 'GUESS_CHARACTER': {
        if (this.phase !== 'QUESTION_TIME') return;

        const isP1 = this.currentTurnPlayerId === this.player1?.id;
        const guesser = isP1 ? this.player1 : this.player2;
        const opponent = isP1 ? this.player2 : this.player1;

        if (!guesser || !opponent) return;

        const guessedChar = this.selectedDeck.characters.find((c) => c.id === msg.payload.characterId);
        const isCorrect = opponent.secretCharacterId === msg.payload.characterId;

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
          this.triggerGameOver(guesser.id, guesser.name, opponent.id, 'CORRECT_GUESS');
        } else {
          if (this.settings.instantLossOnWrongGuess) {
            this.triggerGameOver(opponent.id, opponent.name, guesser.id, 'WRONG_GUESS');
          } else {
            this.turnNumber += 1;
            this.currentTurnPlayerId = opponent.id;
            this.phase = 'QUESTION_TIME';
            this.broadcastHostState();
          }
        }
        break;
      }

      case 'TOGGLE_CARD': {
        const { characterId, eliminated } = msg.payload;
        const senderId = msg.payload?.senderId || msg.senderId;
        const senderSlot = msg.payload?.slot || msg.slot;
        const targetPlayer =
          senderSlot === 2 || (this.player2 && senderId === this.player2.id)
            ? this.player2
            : this.player1;

        if (targetPlayer) {
          if (eliminated) {
            if (!targetPlayer.eliminatedCardIds.includes(characterId)) {
              targetPlayer.eliminatedCardIds = [...targetPlayer.eliminatedCardIds, characterId];
            }
          } else {
            targetPlayer.eliminatedCardIds = targetPlayer.eliminatedCardIds.filter((id) => id !== characterId);
          }
        }
        this.broadcastHostState();
        break;
      }

      case 'REMATCH_REQUEST': {
        if (this.player1) {
          this.startNewMatch();
          this.broadcastHostState();
        }
        break;
      }

      case 'UPDATE_SETTINGS': {
        this.settings = { ...this.settings, ...msg.payload };
        this.broadcastHostState();
        break;
      }
    }
  }

  private startNewMatch() {
    const chars = this.selectedDeck.characters;
    if (chars.length < 2) return;

    const shuffled = [...chars].sort(() => Math.random() - 0.5);

    if (this.player1) {
      this.player1.secretCharacterId = shuffled[0].id;
      this.player1.eliminatedCardIds = [];
    }

    if (this.player2) {
      this.player2.secretCharacterId = shuffled[1].id;
      this.player2.eliminatedCardIds = [];
    }

    this.history = [];
    this.turnNumber = 1;
    this.currentQuestion = null;
    this.gameOverData = null;
    this.currentTurnPlayerId = this.player1?.id || null;
    this.phase = 'QUESTION_TIME';
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
    this.broadcastHostState();
  }

  private broadcastHostState() {
    if (!this.player1) return;

    // 1. Sanitize state for Host (Slot 1)
    const hostState = this.sanitizeStateFor(this.player1.id);
    this.onStateChange(hostState);

    // 2. Sanitize state for Guest (Slot 2) and send
    if (this.player2) {
      const guestState = this.sanitizeStateFor(this.player2.id);
      this.sendToGuest({
        type: 'ROOM_STATE',
        payload: guestState,
      });
    }
  }

  private sanitizeStateFor(targetId: string): SanitizedRoomState {
    const isP1 = this.player1?.id === targetId;
    const mySlot: 1 | 2 = isP1 ? 1 : 2;
    const player = isP1 ? this.player1 : this.player2;

    const mySecret =
      this.selectedDeck.characters.find((c) => c.id === player?.secretCharacterId) || null;

    const playersList = [];
    if (this.player1) {
      playersList.push({
        id: this.player1.id,
        name: this.player1.name,
        slot: 1 as const,
        connected: this.player1.connected,
        cardCountEliminated: this.player1.eliminatedCardIds.length,
      });
    }
    if (this.player2) {
      playersList.push({
        id: this.player2.id,
        name: this.player2.name,
        slot: 2 as const,
        connected: this.player2.connected,
        cardCountEliminated: this.player2.eliminatedCardIds.length,
      });
    } else {
      playersList.push({
        id: 'guest_slot_2',
        name: 'Mitspieler',
        slot: 2 as const,
        connected: false,
        cardCountEliminated: 0,
      });
    }

    return {
      roomId: this.roomId,
      phase: this.phase,
      turnNumber: this.turnNumber,
      currentTurnPlayerId: this.currentTurnPlayerId,
      players: playersList,
      spectatorCount: 0,
      selectedDeck: this.selectedDeck,
      myPlayerId: targetId,
      mySlot,
      mySecretCharacter: mySecret,
      myEliminatedIds: [...(player?.eliminatedCardIds || [])],
      history: this.history,
      settings: this.settings,
      currentQuestion: this.currentQuestion,
      gameOverData: this.gameOverData,
    };
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.reconnectTimer) clearInterval(this.reconnectTimer);
    window.removeEventListener('beforeunload', this.handleUnload);

    try {
      this.bc?.close();
    } catch {}
    try {
      this.guestConn?.close();
    } catch {}
    try {
      this.hostConn?.close();
    } catch {}
    try {
      this.peer?.destroy();
    } catch {}
  }
}
