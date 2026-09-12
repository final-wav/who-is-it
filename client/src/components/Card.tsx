import React from 'react';
import { Character } from '../../../worker/types';
import { CharacterAvatar } from './CharacterAvatar';

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
        guess-tile relative cursor-pointer select-none rounded-xl p-1 flex flex-col items-center justify-between
        w-full h-full min-h-0 transition-all duration-200
        ${
          isEliminated
            ? 'guess-tile-down bg-amber-500/40 border-2 border-amber-700/50 shadow-inner'
            : 'guess-tile-up bg-amber-400 border-2 border-amber-500 shadow-sm hover:-translate-y-0.5'
        }
        ${
          isGuessMode && !isEliminated
            ? 'ring-4 ring-rose-500 scale-105 animate-pulse'
            : ''
        }
      `}
      title={isGuessMode ? `${character.name} als Verdacht wählen` : `${character.name} umklappen`}
    >
      {/* White Plastic/Paper Card Insert */}
      <div className="w-full flex-1 bg-white rounded-lg flex flex-col overflow-hidden border border-amber-300 shadow-xs">
        {/* Character Portrait */}
        <div className="w-full flex-1 relative bg-sky-50 overflow-hidden flex items-center justify-center">
          <CharacterAvatar character={character} />
          {isEliminated && (
            <div className="absolute inset-0 bg-slate-800/40 flex items-center justify-center">
              <span className="w-10 h-1 bg-red-600 rounded-full rotate-45 transform shadow-xs" />
            </div>
          )}
        </div>

        {/* Character Name Bar */}
        <div className="w-full bg-white px-1 py-1 text-center border-t border-amber-200/60">
          <span className="block font-display font-black text-xs sm:text-sm text-slate-900 truncate tracking-wide">
            {character.name}
          </span>
        </div>
      </div>

      {/* Yellow Plastic Bottom Hinges (left & right lugs like the real game) */}
      <div className="w-full flex items-center justify-between px-2 pt-1">
        <span className="w-3 h-1 bg-amber-600/80 rounded-full" />
        <span className="w-3 h-1 bg-amber-600/80 rounded-full" />
      </div>
    </div>
  );
};
