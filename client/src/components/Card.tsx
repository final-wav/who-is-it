import React from 'react';
import { Character } from '../../../worker/types';
import { CharacterAvatar } from './CharacterAvatar';
import { EyeOff, Sparkles } from 'lucide-react';

interface CardProps {
  character: Character;
  isEliminated: boolean;
  onToggle: (characterId: string) => void;
  onGuess?: (character: Character) => void;
  isGuessMode?: boolean;
}

export const Card: React.FC<CardProps> = ({
  character,
  isEliminated,
  onToggle,
  onGuess,
  isGuessMode,
}) => {
  const handleClick = () => {
    if (isGuessMode && onGuess) {
      onGuess(character);
    } else {
      onToggle(character.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        board-card relative cursor-pointer select-none rounded-xl border p-2 flex flex-col items-center justify-between
        transition-all duration-300
        ${isEliminated ? 'board-card-down bg-slate-900/60 border-slate-800 text-slate-500' : 'board-card-up bg-slate-800/90 border-slate-700/80 text-white hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10'}
        ${isGuessMode ? 'ring-2 ring-amber-400/80 hover:scale-105 hover:bg-amber-950/40' : ''}
      `}
      style={{ aspectRatio: '3/4', minHeight: '130px' }}
      title={isGuessMode ? `${character.name} als Lösung wählen!` : `${character.name} umklappen/aufstellen`}
    >
      {/* Top indicator badge */}
      <div className="w-full flex items-center justify-between text-[11px] font-semibold px-1 mb-1">
        <span className="truncate max-w-[85px] tracking-wide text-slate-200">
          {character.name}
        </span>
        {isEliminated ? (
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded flex items-center gap-0.5">
            <EyeOff className="w-3 h-3 text-slate-500" />
          </span>
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        )}
      </div>

      {/* Avatar portrait */}
      <div className="w-full flex-1 relative rounded-lg overflow-hidden border border-slate-700/50 bg-slate-950/40">
        <CharacterAvatar character={character} />

        {/* Elimination overlay */}
        {isEliminated && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Weg
            </div>
          </div>
        )}

        {/* Guess Mode Glow */}
        {isGuessMode && !isEliminated && (
          <div className="absolute inset-0 bg-amber-500/20 animate-pulse border-2 border-amber-400 rounded-lg flex items-center justify-center">
            <span className="bg-amber-500 text-slate-950 text-xs font-black px-2 py-1 rounded shadow-lg flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Tippen
            </span>
          </div>
        )}
      </div>

      {/* Card stand / hinge indicator at bottom like real physical board */}
      <div className="w-full mt-1.5 pt-1 border-t border-slate-700/40 flex items-center justify-center">
        <div className={`h-1 rounded-full transition-all duration-300 ${isEliminated ? 'w-4 bg-slate-700' : 'w-10 bg-sky-500/60'}`} />
      </div>
    </div>
  );
};
