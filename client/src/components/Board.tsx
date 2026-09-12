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
  const isRedTray = playerSlot !== 2; // Slot 1 = Red, Slot 2 = Blue

  const handleResetAll = () => {
    eliminatedIds.forEach(id => onToggleCard(id));
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* The Physical Molded Plastic Tray */}
      <div
        className={`w-full max-w-5xl rounded-2xl border-4 p-3 sm:p-4 shadow-tray transition-colors ${
          isRedTray
            ? 'bg-red-700 border-red-900'
            : 'bg-blue-700 border-blue-900'
        }`}
      >
        {/* Tray Top Bar */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/20 text-white font-bold text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider font-display font-black text-sm sm:text-base">
              {isRedTray ? 'Rotes Spielbrett' : 'Blaues Spielbrett'}
            </span>
            <span className="bg-black/25 px-2 py-0.5 rounded text-xs">
              {activeCount} / {characters.length} stehen
            </span>
          </div>

          {eliminatedIds.length > 0 && (
            <button
              onClick={handleResetAll}
              className="btn-toy px-2.5 py-1 bg-black/20 hover:bg-black/30 rounded text-xs flex items-center gap-1 transition text-white/90"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Alle aufstellen
            </button>
          )}
        </div>

        {/* Action Prompt during Elimination Time */}
        {phase === 'ELIMINATION_TIME' && isMyTurn && (
          <div className="mb-3 p-2.5 bg-amber-300 text-slate-950 rounded-lg shadow-sm flex items-center justify-between gap-2">
            <span className="font-extrabold text-xs sm:text-sm">
              Antwort erhalten: Karten umklappen
            </span>
            <button
              onClick={onEndElimination}
              className="btn-toy px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded text-xs uppercase tracking-wider flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Fertig
            </button>
          </div>
        )}

        {/* 24 Tiles in the Molded Tray Grooves */}
        <div
          className={`perspective-board grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-2.5 p-2 sm:p-3 rounded-xl ${
            isRedTray ? 'bg-red-800/90 shadow-inner' : 'bg-blue-800/90 shadow-inner'
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
