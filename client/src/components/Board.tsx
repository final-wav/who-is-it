import React from 'react';
import { Character, GamePhase } from '../../../worker/types';
import { Card } from './Card';
import { RotateCcw, CheckCircle2, HelpCircle } from 'lucide-react';

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
        <div className="w-full max-w-4xl mb-4 p-3.5 bg-gradient-to-r from-sky-950/80 via-indigo-950/80 to-purple-950/80 border border-sky-500/50 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-pulse-subtle">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">👇</span>
            <div>
              <p className="font-bold text-sky-200 text-sm md:text-base">
                Antwort erhalten! Jetzt Karten umklappen
              </p>
              <p className="text-xs text-slate-300">
                Klicke auf alle Karten, die ausgeschlossen sind. Wenn du fertig bist, beende deinen Zug.
              </p>
            </div>
          </div>
          <button
            onClick={onEndElimination}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 text-sm"
          >
            <CheckCircle2 className="w-4 h-4" /> Fertig / Zug beenden
          </button>
        </div>
      )}

      {/* Board Header Bar */}
      <div className="w-full max-w-6xl mb-3 px-3 py-2 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl flex items-center justify-between text-xs md:text-sm text-slate-300">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white">Dein Spielbrett</span>
          <span className="bg-sky-950 text-sky-400 border border-sky-800/60 px-2 py-0.5 rounded-full font-bold">
            {activeCount} von {characters.length} aktiv
          </span>
          {eliminatedIds.length > 0 && (
            <span className="text-slate-400 hidden sm:inline">
              ({eliminatedIds.length} umgeklappt)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {eliminatedIds.length > 0 && (
            <button
              onClick={handleResetAll}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition flex items-center gap-1.5"
              title="Alle Karten wieder aufrecht stellen"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Alle aufstellen
            </button>
          )}
        </div>
      </div>

      {/* 3D Board Grid (Desktop: 6 columns, Tablet: 4 columns, Mobile: 3 columns) */}
      <div className="w-full max-w-6xl perspective-1000">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3 p-3 sm:p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-md">
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
