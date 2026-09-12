import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClientMessage,
  Deck,
  RoomSettings,
  SanitizedRoomState,
  ServerMessage,
} from '../../../worker/types';

import { getBackendWsUrl } from '../utils/api';

interface UseGameSocketProps {
  roomId: string | null;
  playerName: string;
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

export function useGameSocket({ roomId, playerName }: UseGameSocketProps) {
  const [state, setState] = useState<SanitizedRoomState | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const { playerId, token } = getOrCreateCredentials();

  const send = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const connect = useCallback(() => {
    if (!roomId) return;

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

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

      // Start ping heartbeat
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
      // Try to reconnect if still in room
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (roomId) connect();
      }, 2000);
    };

    ws.onerror = (e) => {
      console.warn('WebSocket error:', e);
      setConnected(false);
    };
  }, [roomId, playerName, playerId, token, send]);

  useEffect(() => {
    if (roomId) {
      connect();
    } else {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setState(null);
      setConnected(false);
    }

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [roomId, connect]);

  // Action methods
  const startGame = useCallback((deckId?: string, customDeck?: Deck) => {
    send({ type: 'START_GAME', payload: { deckId, customDeck } });
  }, [send]);

  const askQuestion = useCallback((question: string, attributeFilter?: Record<string, any>) => {
    send({ type: 'ASK_QUESTION', payload: { question, attributeFilter } });
  }, [send]);

  const answerQuestion = useCallback((answer: boolean) => {
    send({ type: 'ANSWER_QUESTION', payload: { answer } });
  }, [send]);

  const endElimination = useCallback(() => {
    send({ type: 'END_ELIMINATION' });
  }, [send]);

  const guessCharacter = useCallback((characterId: string) => {
    send({ type: 'GUESS_CHARACTER', payload: { characterId } });
  }, [send]);

  const toggleCard = useCallback((characterId: string, eliminated: boolean) => {
    send({ type: 'TOGGLE_CARD', payload: { characterId, eliminated } });
  }, [send]);

  const requestRematch = useCallback(() => {
    send({ type: 'REMATCH_REQUEST' });
  }, [send]);

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
