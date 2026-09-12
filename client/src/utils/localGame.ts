import classicDeckRaw from '../../../decks/classic.json';
import { Character, Deck, SanitizedRoomState } from '../../../worker/types';

const classicDeck = classicDeckRaw as unknown as Deck;

export function createLocalFallbackState(
  roomId: string,
  playerId: string,
  playerName: string,
  phase: 'LOBBY' | 'QUESTION_TIME' = 'QUESTION_TIME'
): SanitizedRoomState {
  const characters = classicDeck.characters;
  const mySecretIndex = Math.floor(Math.random() * characters.length);
  const mySecret = characters[mySecretIndex];

  return {
    roomId: roomId.toUpperCase(),
    phase,
    turnNumber: 1,
    currentTurnPlayerId: playerId,
    players: [
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
    ],
    spectatorCount: 0,
    selectedDeck: classicDeck,
    myPlayerId: playerId,
    mySecretCharacter: mySecret,
    myEliminatedIds: [],
    mySlot: 1,
    history: [],
    settings: {
      instantLossOnWrongGuess: false,
      autoCheckAnswer: false,
    },
  };
}
