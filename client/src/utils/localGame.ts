import classicDeckRaw from '../../../decks/classic.json';
import { Character, Deck, SanitizedRoomState } from '../../../worker/types';

const classicDeck = classicDeckRaw as unknown as Deck;

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeRoomCode(): string {
  let s = '';
  for (let i = 0; i < 4; i++) {
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return s;
}

export function createLocalFallbackState(
  roomId: string,
  playerId: string,
  playerName: string,
  phase?: 'LOBBY' | 'QUESTION_TIME',
  slot: 1 | 2 = 1
): SanitizedRoomState {
  const effectivePhase = phase || (roomId.toUpperCase() === 'SOLO' ? 'QUESTION_TIME' : 'LOBBY');
  const characters = classicDeck.characters;
  const mySecretIndex = Math.floor(Math.random() * characters.length);
  const mySecret = characters[mySecretIndex];

  return {
    roomId: roomId.toUpperCase(),
    phase: effectivePhase,
    turnNumber: 1,
    currentTurnPlayerId: slot === 1 ? playerId : 'host_slot_1',
    players: slot === 1
      ? [
          {
            id: playerId,
            name: playerName.trim() || 'Spieler 1',
            connected: true,
            slot: 1,
            cardCountEliminated: 0,
          },
          {
            id: 'opponent_slot_2',
            name: 'Mitspieler',
            connected: false,
            slot: 2,
            cardCountEliminated: 0,
          },
        ]
      : [
          {
            id: 'host_slot_1',
            name: 'Host (Spieler 1)',
            connected: false,
            slot: 1,
            cardCountEliminated: 0,
          },
          {
            id: playerId,
            name: playerName.trim() || 'Spieler 2',
            connected: true,
            slot: 2,
            cardCountEliminated: 0,
          },
        ],
    spectatorCount: 0,
    selectedDeck: classicDeck,
    myPlayerId: playerId,
    mySecretCharacter: mySecret,
    myEliminatedIds: [],
    mySlot: slot,
    history: [],
    settings: {
      instantLossOnWrongGuess: false,
      autoCheckAnswer: false,
    },
  };
}
