import React from 'react';
import { Character } from '../../../worker/types';
import { CharacterAvatar } from './CharacterAvatar';
import { EyeOff, Target } from 'lucide-react';

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
        board-card relative cursor-pointer select-none rounded-lg border-2 p-1.5 flex flex-col items-center justify-between
        shadow-tile transition-all duration-200
        ${
          isEliminated
            ? 'board-card-down bg-slate-900 border-slate-800 text-stone-500'
            : 'board-card-up bg-slate-800/95 border-slate-700/90 text-stone-100 hover:border-retro-blue hover:-translate-y-1'
        }
        ${
          isGuessMode && !isEliminated
            ? 'ring-2 ring-retro-amber border-retro-amber bg-amber-950/20 scale-[1.03]'
            : ''
        }
      `}
      style={{ aspectRatio: '3/4', minHeight: '125px' }}
      title={isGuessMode ? `${character.name} als Verdacht wählen` : `${character.name} umklappen/aufstellen`}
    >
      {/* Top Name Header */}
      <div className="w-full flex items-center justify-between px-1 py-0.5 mb-1 bg-slate-900/90 rounded border border-slate-800">
        <span className="font-bold text-[11px] sm:text-xs tracking-tight truncate text-stone-200 font-sans">
          {character.name}
        </span>
        {isEliminated ? (
          <EyeOff className="w-3 h-3 text-stone-500 flex-shrink-0" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-retro-blue flex-shrink-0" />
        )}
      </div>

      {/* Avatar Portrait Box */}
      <div className="w-full flex-1 relative rounded overflow-hidden border border-slate-700/80 bg-slate-950">
        <CharacterAvatar character={character} />

        {/* Eliminated Overlay */}
        {isEliminated && (
          <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              Weg
            </span>
          </div>
        )}

        {/* Guess Mode Target Badge */}
        {isGuessMode && !isEliminated && (
          <div className="absolute inset-0 bg-amber-500/15 border-2 border-retro-amber rounded flex items-center justify-center">
            <span className="bg-retro-amber text-slate-950 text-[11px] font-extrabold px-2 py-0.5 rounded shadow flex items-center gap-1 uppercase tracking-wide">
              <Target className="w-3 h-3" /> Tippen
            </span>
          </div>
        )}
      </div>

      {/* Physical Plastic Board Hinge at bottom */}
      <div className="w-full mt-1 pt-0.5 flex items-center justify-center">
        <div className={`h-1 rounded-full transition-all duration-200 ${isEliminated ? 'w-5 bg-slate-700' : 'w-10 bg-slate-600'}`} />
      </div>
    </div>
  );
};
