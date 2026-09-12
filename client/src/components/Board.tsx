import React from 'react';
import { Character, GamePhase } from '../../../worker/types';
import { Card } from './Card';
import { RotateCcw, Check, ArrowDownCircle } from 'lucide-react';

interface BoardProps {
  characters: Character[];
  eliminatedIds: string[];
  onToggleCard: (characterId: string) => void;
  onGuessCharacter: (character: Character) => void;
  isGuessMode: boolean;
  phase: GamePhase;
  isMyTurn: boolean;
  onEndElimination: () => void;
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
}) => {
  const activeCount = characters.length - eliminatedIds.length;

  const handleResetAll = () => {
    eliminatedIds.forEach(id => {
      onToggleCard(id);
    });
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Action Banner for Elimination Time */}
      {phase === 'ELIMINATION_TIME' && isMyTurn && (
        <div className="w-full max-w-4xl mb-4 p-3.5 bg-slate-900 border-2 border-retro-blue rounded-xl shadow-tactile flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-retro-blue/20 text-retro-blue rounded-lg">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm md:text-base">
                Antwort erhalten: Karten umklappen
              </p>
              <p className="text-xs text-stone-300">
                Klicke auf alle Figuren, die nach dieser Antwort ausgeschlossen sind.
              </p>
            </div>
          </div>
          <button
            onClick={onEndElimination}
            className="btn-tactile px-4 py-2 bg-retro-green hover:bg-retro-green-dark text-white font-bold rounded-lg shadow-tactile flex items-center gap-1.5 text-xs sm:text-sm uppercase tracking-wide"
          >
            <Check className="w-4 h-4" /> Zug beenden
          </button>
        </div>
      )}

      {/* Board Header Bar */}
      <div className="w-full max-w-6xl mb-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs text-stone-300">
        <div className="flex items-center gap-3 font-sans">
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">Dein Spielbrett</span>
          <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono font-bold text-stone-200">
            {activeCount} / {characters.length} aktiv
          </span>
          {eliminatedIds.length > 0 && (
            <span className="text-stone-400 font-mono hidden sm:inline">
              ({eliminatedIds.length} umgeklappt)
            </span>
          )}
        </div>

        <div>
          {eliminatedIds.length > 0 && (
            <button
              onClick={handleResetAll}
              className="text-xs text-stone-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition flex items-center gap-1"
              title="Alle Karten wieder aufrichten"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Aufrichten
            </button>
          )}
        </div>
      </div>

      {/* 3D Board Grid */}
      <div className="w-full max-w-6xl perspective-1000">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3 p-3 sm:p-4 bg-[#0e1422] border-2 border-slate-800 rounded-xl shadow-2xl">
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
