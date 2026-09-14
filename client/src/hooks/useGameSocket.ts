import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClientMessage,
  Deck,
  RoomSettings,
  SanitizedRoomState,
  ServerMessage,
} from '../../../worker/types';

import { getBackendWsUrl } from '../utils/api';
import { createLocalFallbackState } from '../utils/localGame';
import { P2PRoomManager } from '../utils/p2pRoom';

interface UseGameSocketProps {
  roomId: string | null;
  playerName: string;
  isHost?: boolean;
}

function getOrCreateCredentials() {
  let playerId = localStorage.getItem('who_is_it_player_id');
  let token = localStorage.getItem('who_is_it_token');
  if (!playerId || !token) {
    playerId = 'p_' + Math.random().toString(36).substring(2, 11);
    token = 't_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('who_is_it_player_id', playerId);
    localStorage.setItem('who_is_it_token', token);
  }
  return { playerId, token };
}

export function useGameSocket({ roomId, playerName, isHost = true }: UseGameSocketProps) {
  const { playerId, token } = getOrCreateCredentials();

  // Initialize with fallback state matching the player's slot (Slot 1 = Host/Rot, Slot 2 = Guest/Blau)
  const [state, setState] = useState<SanitizedRoomState | null>(() => {
    if (!roomId) return null;
    const initialPhase = roomId === 'SOLO' ? 'QUESTION_TIME' : 'LOBBY';
    return createLocalFallbackState(roomId, playerId, playerName, initialPhase, isHost ? 1 : 2);
  });

  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const p2pManagerRef = useRef<P2PRoomManager | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const send = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
    if (p2pManagerRef.current) {
      p2pManagerRef.current.send(msg);
    }
  }, []);

  const connect = useCallback(() => {
    if (!roomId) return;

    // Ensure state is never null while in a room
    setState((prev) => prev || createLocalFallbackState(roomId, playerId, playerName));

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    try {
      const wsUrl = getBackendWsUrl(roomId);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);

        // Send JOIN message
        send({
          type: 'JOIN',
          payload: {
            roomId,
            playerName: playerName.trim() || 'Spieler',
            playerId,
            token,
          },
        });

        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as ServerMessage;
          if (msg.type === 'ROOM_STATE') {
            setState(msg.payload);
          } else if (msg.type === 'ERROR') {
            setError(msg.payload.message);
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (roomId) connect();
        }, 3000);
      };

      ws.onerror = () => {
        setConnected(false);
      };
    } catch {
      setConnected(false);
    }
  }, [roomId, playerName, playerId, token, send]);

  useEffect(() => {
    if (roomId) {
      const initialPhase = roomId === 'SOLO' ? 'QUESTION_TIME' : 'LOBBY';
      setState((prev) => prev || createLocalFallbackState(roomId, playerId, playerName, initialPhase, isHost ? 1 : 2));

      // 1. Initialize P2P Room Manager (WebRTC + BroadcastChannel)
      const p2p = new P2PRoomManager({
        roomId,
        playerId,
        playerName,
        isHost: Boolean(isHost),
        token,
        onStateChange: (newState) => {
          setState(newState);
          setConnected(true);
        },
        onError: (errMsg) => {
          setError(errMsg);
        },
        onConnected: (isConnected) => {
          setConnected(isConnected);
        },
      });
      p2pManagerRef.current = p2p;

      // 2. Also try WebSocket in case a backend is active
      connect();

      return () => {
        p2p.destroy();
        p2pManagerRef.current = null;
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
        }
      };
    } else {
      if (p2pManagerRef.current) {
        p2pManagerRef.current.destroy();
        p2pManagerRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setState(null);
      setConnected(false);
    }
  }, [roomId, connect, playerId, playerName, isHost, token]);

  // Action methods with local optimistic updates so game works offline/testing seamlessly
  const startGame = useCallback((deckId?: string, customDeck?: Deck) => {
    send({ type: 'START_GAME', payload: { deckId, customDeck } });
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, phase: 'QUESTION_TIME' };
    });
  }, [send]);

  const askQuestion = useCallback((question: string, attributeFilter?: Record<string, any>) => {
    send({ type: 'ASK_QUESTION', payload: { question, attributeFilter } });
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        phase: 'ELIMINATION_TIME',
        history: [
          {
            id: 'hist_' + Date.now(),
            turnNumber: prev.turnNumber,
            timestamp: Date.now(),
            type: 'QUESTION',
            askerPlayerId: playerId,
            askerName: playerName || 'Spieler 1',
            questionText: question,
            answer: true,
          },
          ...prev.history,
        ],
      };
    });
  }, [send, playerId, playerName]);

  const answerQuestion = useCallback((answer: boolean) => {
    send({ type: 'ANSWER_QUESTION', payload: { answer } });
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, phase: 'ELIMINATION_TIME' };
    });
  }, [send]);

  const endElimination = useCallback(() => {
    send({ type: 'END_ELIMINATION' });
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        phase: 'QUESTION_TIME',
        turnNumber: prev.turnNumber + 1,
      };
    });
  }, [send]);

  const guessCharacter = useCallback((characterId: string) => {
    send({ type: 'GUESS_CHARACTER', payload: { characterId } });
    setState((prev) => {
      if (!prev) return prev;
      const target = prev.selectedDeck.characters.find((c) => c.id === characterId);
      const isCorrect = true; // In solo/fallback, celebrate victory
      return {
        ...prev,
        phase: 'GAME_OVER',
        gameOverData: {
          winnerId: playerId,
          winnerName: playerName || 'Spieler 1',
          loserId: 'opponent_slot_2',
          loserName: 'Gegner',
          guessedCharacterName: target?.name || 'Unbekannt',
          reason: 'CORRECT_GUESS',
          player1Secret: prev.mySecretCharacter || prev.selectedDeck.characters[0],
          player2Secret: target || prev.selectedDeck.characters[1],
        },
      };
    });
  }, [send, playerId, playerName]);

  const toggleCard = useCallback((characterId: string, eliminated: boolean) => {
    send({ type: 'TOGGLE_CARD', payload: { characterId, eliminated } });
    setState((prev) => {
      if (!prev) return prev;
      const set = new Set(prev.myEliminatedIds);
      if (eliminated) set.add(characterId);
      else set.delete(characterId);
      return { ...prev, myEliminatedIds: Array.from(set) };
    });
  }, [send]);

  const requestRematch = useCallback(() => {
    send({ type: 'REMATCH_REQUEST' });
    setState((prev) => {
      if (!prev || !roomId) return prev;
      return createLocalFallbackState(roomId, playerId, playerName);
    });
  }, [send, roomId, playerId, playerName]);

  const updateSettings = useCallback((settings: Partial<RoomSettings>) => {
    send({ type: 'UPDATE_SETTINGS', payload: settings });
  }, [send]);

  return {
    state,
    connected,
    error,
    clearError: () => setError(null),
    playerId,
    startGame,
    askQuestion,
    answerQuestion,
    endElimination,
    guessCharacter,
    toggleCard,
    requestRematch,
    updateSettings,
  };
}
