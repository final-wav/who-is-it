import { useSyncExternalStore } from 'react';
import type { Character, Deck, SanitizedRoomState } from '../../worker/types';
import { P2PRoomManager } from './utils/p2pRoom';

/** Persistente Sitzung (überlebt Reload -> Reconnect in denselben Raum). */
export interface Session {
  code: string;
  playerId: string;
  token: string;
  slot?: 1 | 2;
}

const SKEY = 'who-is-it-session';

function getRoomCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const code = (params.get('room') || params.get('lobby'))?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return code || null;
}

function loadSession(): Session | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(SKEY) || 'null');
    if (!s?.code) return null;
    const urlCode = getRoomCodeFromUrl();
    if (urlCode && urlCode !== s.code) return null;
    return s;
  } catch {
    return null;
  }
}

function saveSession(s: Session | null) {
  if (s) sessionStorage.setItem(SKEY, JSON.stringify(s));
  else sessionStorage.removeItem(SKEY);
}

export interface Store {
  connected: boolean;
  state: SanitizedRoomState | null;
  session: Session | null;
  error: string | null;
}

let store: Store = { connected: false, state: null, session: loadSession(), error: null };
const listeners = new Set<() => void>();

function set(patch: Partial<Store>) {
  store = { ...store, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

let ws: WebSocket | null = null;
let reconnectTimer: any = null;
let p2pManager: P2PRoomManager | null = null;

function wsUrl() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws`;
}

export function ensureConnected() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  // On GitHub Pages or static hosts where no local server runs, skip failing WebSocket immediately to P2P
  const isStaticGhPages = window.location.hostname.endsWith('github.io');

  if (!isStaticGhPages) {
    try {
      ws = new WebSocket(wsUrl());

      ws.onopen = () => {
        set({ connected: true });
        const s = store.session;
        if (s) {
          rawSend({ t: 'rejoin', code: s.code, playerId: s.playerId, token: s.token });
        }
      };

      ws.onclose = () => {
        set({ connected: false });
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(ensureConnected, 1500);
      };

      ws.onerror = () => {
        set({ connected: false });
      };

      ws.onmessage = (e) => {
        try {
          const m = JSON.parse(e.data);
          if (m.t === 'joined' || m.type === 'joined') {
            const session: Session = {
              code: m.code,
              playerId: m.playerId,
              token: m.token,
              slot: m.slot,
            };
            saveSession(session);
            set({ session, error: null });
            window.history.replaceState(null, '', `?room=${m.code}`);
          } else if (m.t === 'state' || m.type === 'ROOM_STATE') {
            const state = m.state || m.payload;
            set({ state, error: null });
          } else if (m.t === 'error' || m.type === 'ERROR') {
            const message = m.message || m.payload?.message || 'Ein Fehler ist aufgetreten.';
            if (!store.state) {
              saveSession(null);
              set({ session: null });
              window.history.replaceState(null, '', window.location.pathname);
            }
            set({ error: message });
          }
        } catch (err) {
          console.error('[net] Message parse error:', err);
        }
      };
      return;
    } catch {
      // fallback to P2P
    }
  }

  // Fallback: if in a session without a WebSocket server, activate P2PRoomManager
  initP2PFallback();
}

function initP2PFallback() {
  const s = store.session;
  if (!s || p2pManager) return;

  const playerName = localStorage.getItem('who_is_it_player_name') || 'Spieler';
  const isHost = s.slot === 1;

  p2pManager = new P2PRoomManager({
    roomId: s.code,
    playerId: s.playerId,
    playerName,
    isHost,
    token: s.token,
    onStateChange: (state) => {
      set({ state, connected: true, error: null });
    },
    onError: (errMsg) => {
      set({ error: errMsg });
    },
    onConnected: (connected) => {
      set({ connected });
    },
  });
}

function rawSend(msg: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  } else if (p2pManager) {
    // Map compact messages to P2P format if needed
    p2pManager.send(msg);
  }
}

export function send(msg: any) {
  ensureConnected();
  if (ws && ws.readyState === WebSocket.OPEN) {
    rawSend(msg);
  } else if (p2pManager) {
    p2pManager.send(msg);
  } else {
    // Queue send briefly while connecting
    const iv = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        rawSend(msg);
        clearInterval(iv);
      } else if (p2pManager) {
        p2pManager.send(msg);
        clearInterval(iv);
      }
    }, 40);
    setTimeout(() => {
      clearInterval(iv);
    }, 800);
  }
}

// Generates per-tab session credentials so tabs never collide
function createSessionCredentials() {
  const playerId = 'p_' + Math.random().toString(36).substring(2, 11);
  const token = 't_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return { playerId, token };
}

export const actions = {
  create: (name: string) => {
    ensureConnected();
    const cleanName = name.trim() || 'Spieler 1';
    localStorage.setItem('who_is_it_player_name', cleanName);

    // If WebSocket is connected, send create
    if (ws && ws.readyState === WebSocket.OPEN) {
      send({ t: 'create', name: cleanName });
    } else {
      // Direct P2P/Local mode
      const { playerId, token } = createSessionCredentials();
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];

      const session: Session = { code, playerId, token, slot: 1 };
      saveSession(session);
      set({ session, error: null });
      window.history.replaceState(null, '', `?room=${code}`);

      if (p2pManager) p2pManager.destroy();
      p2pManager = new P2PRoomManager({
        roomId: code,
        playerId,
        playerName: cleanName,
        isHost: true,
        token,
        onStateChange: (state) => set({ state, connected: true, error: null }),
        onError: (errMsg) => set({ error: errMsg }),
        onConnected: (connected) => set({ connected }),
      });
    }
  },

  join: (code: string, name: string) => {
    ensureConnected();
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const cleanName = name.trim() || 'Spieler 2';
    localStorage.setItem('who_is_it_player_name', cleanName);

    if (ws && ws.readyState === WebSocket.OPEN) {
      send({ t: 'join', code: cleanCode, name: cleanName });
    } else {
      // Direct P2P/Local mode for guest
      const { playerId, token } = createSessionCredentials();
      const session: Session = { code: cleanCode, playerId, token, slot: 2 };
      saveSession(session);
      set({ session, error: null });
      window.history.replaceState(null, '', `?room=${cleanCode}`);

      if (p2pManager) p2pManager.destroy();
      p2pManager = new P2PRoomManager({
        roomId: cleanCode,
        playerId,
        playerName: cleanName,
        isHost: false,
        token,
        onStateChange: (state) => set({ state, connected: true, error: null }),
        onError: (errMsg) => set({ error: errMsg }),
        onConnected: (connected) => set({ connected }),
      });
    }
  },

  start: (deckId?: string, customDeck?: Deck) => {
    send({ t: 'start', deckId, customDeck, type: 'START_GAME', payload: { deckId, customDeck } });
  },

  ask: (question: string, attributeFilter?: Record<string, any>) => {
    send({
      t: 'ask',
      question,
      attributeFilter,
      type: 'ASK_QUESTION',
      payload: { question, attributeFilter },
    });
  },

  answer: (answer: boolean) => {
    send({
      t: 'answer',
      answer,
      type: 'ANSWER_QUESTION',
      payload: { answer },
    });
  },

  endElimination: () => {
    send({
      t: 'endElimination',
      type: 'END_ELIMINATION',
    });
  },

  guess: (characterId: string) => {
    send({
      t: 'guess',
      characterId,
      type: 'GUESS_CHARACTER',
      payload: { characterId },
    });
  },

  toggleCard: (characterId: string, eliminated: boolean) => {
    if (store.state) {
      const current = new Set(store.state.myEliminatedIds || []);
      if (eliminated) {
        current.add(characterId);
      } else {
        current.delete(characterId);
      }
      set({
        state: {
          ...store.state,
          myEliminatedIds: Array.from(current),
        },
      });
    }

    send({
      t: 'toggleCard',
      characterId,
      eliminated,
      senderId: store.session?.playerId,
      slot: store.session?.slot,
      type: 'TOGGLE_CARD',
      payload: {
        characterId,
        eliminated,
        senderId: store.session?.playerId,
        slot: store.session?.slot,
      },
    });
  },

  rematch: () => {
    send({
      t: 'rematch',
      type: 'REMATCH_REQUEST',
    });
  },

  leave: () => {
    send({ t: 'leave' });
    if (p2pManager) {
      p2pManager.destroy();
      p2pManager = null;
    }
    saveSession(null);
    set({ session: null, state: null, error: null });
    window.history.replaceState(null, '', window.location.pathname);
  },

  clearError: () => set({ error: null }),
};

export function useGame(): Store {
  return useSyncExternalStore(subscribe, () => store);
}
