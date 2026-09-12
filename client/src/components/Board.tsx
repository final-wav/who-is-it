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
    <div className="w-full flex flex-col items-center font-display">
      {/* The Modern Molded Stadium Tray with Rich Red/Blue Gradients */}
      <div
        className={`w-full max-w-5xl rounded-3xl p-3 sm:p-4 transition-all duration-300 shadow-2xl border-2 ${
          isRedTray
            ? 'bg-gradient-to-b from-red-600 via-red-700 to-rose-950 border-red-500/40 shadow-red-950/60'
            : 'bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-950 border-blue-500/40 shadow-blue-950/60'
        }`}
      >
        {/* Tray Header Bar */}
        <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/15 text-white">
          <div className="flex items-center gap-3">
            <span className="font-black text-lg sm:text-xl tracking-wide uppercase drop-shadow-sm">
              {isRedTray ? 'Rotes Spielbrett' : 'Blaues Spielbrett'}
            </span>
            <span className="bg-black/30 backdrop-blur-xs px-3 py-0.5 rounded-full text-xs font-black border border-white/10">
              {activeCount} / {characters.length} stehen
            </span>
          </div>

          {eliminatedIds.length > 0 && (
            <button
              onClick={handleResetAll}
              className="btn-board px-3 py-1 bg-black/25 hover:bg-black/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition text-white border border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Alle aufstellen
            </button>
          )}
        </div>

        {/* Elimination Prompt Bar */}
        {phase === 'ELIMINATION_TIME' && isMyTurn && (
          <div className="mb-3 p-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 rounded-2xl shadow-lg flex items-center justify-between gap-2 animate-in fade-in duration-150">
            <span className="font-black text-sm sm:text-base">
              Antwort erhalten: Karten umklappen!
            </span>
            <button
              onClick={onEndElimination}
              className="btn-board px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black rounded-xl shadow-md text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" /> Zug beenden
            </button>
          </div>
        )}

        {/* Inset Molded 4x6 Grid with 24 Vibrant Yellow Flip Tiles */}
        <div
          className={`perspective-board grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl ${
            isRedTray ? 'bg-red-950/70 shadow-inner' : 'bg-blue-950/70 shadow-inner'
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
