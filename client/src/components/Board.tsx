import React from 'react';
import { Character, GamePhase } from '../../../worker/types';
import { Card } from './Card';
import { RotateCcw, Check } from 'lucide-react';

interface BoardProps {
  characters: Character[];
  eliminatedIds: string[];
  onToggleCard: (characterId: string) => void;
  onGuessCharacter: (character: Character) => void;
  isGuessMode: boolean;
  phase: GamePhase;
  isMyTurn: boolean;
  onEndElimination: () => void;
  playerSlot?: 1 | 2 | null;
}

export const Board: React.FC<BoardProps> = ({
  characters,
  eliminatedIds,
  onToggleCard,
  onGuessCharacter,
  isGuessMode,
  phase,
  isMyTurn,
  onEndElimination,
  playerSlot = 1,
}) => {
  const activeCount = characters.length - eliminatedIds.length;
  const isRedTray = playerSlot !== 2;

  const handleResetAll = () => {
    eliminatedIds.forEach(id => onToggleCard(id));
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* The Physical Molded Plastic Tray */}
      <div
        className={`w-full max-w-5xl rounded-3xl border-4 p-3 sm:p-4 shadow-tray-3d transition-colors ${
          isRedTray
            ? 'bg-red-600 border-red-800 ring-4 ring-red-900/30'
            : 'bg-blue-600 border-blue-800 ring-4 ring-blue-900/30'
        }`}
      >
        {/* Tray Header Lip */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-black/20 text-white font-display">
          <div className="flex items-center gap-2.5">
            <span className="font-black text-lg sm:text-xl tracking-tight text-stroke">
              {isRedTray ? 'ROTES SPIELBRETT' : 'BLAUES SPIELBRETT'}
            </span>
            <span className="bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-xs font-black">
              {activeCount} / {characters.length} stehen
            </span>
          </div>

          {eliminatedIds.length > 0 && (
            <button
              onClick={handleResetAll}
              className="btn-board px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition text-white shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Alle aufstellen
            </button>
          )}
        </div>

        {/* Elimination Prompt Bar */}
        {phase === 'ELIMINATION_TIME' && isMyTurn && (
          <div className="mb-3 p-2.5 bg-amber-300 text-slate-950 rounded-xl shadow-md border-2 border-amber-500 flex items-center justify-between gap-2">
            <span className="font-display font-black text-sm sm:text-base">
              Antwort erhalten: Karten umklappen!
            </span>
            <button
              onClick={onEndElimination}
              className="btn-board px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white font-display font-black rounded-lg shadow-btn-green text-xs uppercase tracking-wider flex items-center gap-1"
            >
              <Check className="w-4 h-4" /> Fertig
            </button>
          </div>
        )}

        {/* 24 Yellow Tiles in Molded Inset Tray */}
        <div
          className={`perspective-board grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-2.5 p-2.5 sm:p-3.5 rounded-2xl ${
            isRedTray ? 'bg-red-700/80 shadow-inner' : 'bg-blue-700/80 shadow-inner'
          }`}
        >
          {characters.map((char) => {
            const isEliminated = eliminatedIds.includes(char.id);
            return (
              <Card
                key={char.id}
                character={char}
                isEliminated={isEliminated}
                onToggle={onToggleCard}
                onGuess={onGuessCharacter}
                isGuessMode={isGuessMode}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
