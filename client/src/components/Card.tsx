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
        guess-tile relative cursor-pointer select-none rounded-lg p-1 sm:p-1.5 flex flex-col items-center justify-between
        border-2 transition-all duration-150
        ${
          isEliminated
            ? 'guess-tile-down bg-amber-500/30 border-amber-700/40 shadow-tile-down'
            : 'guess-tile-up bg-amber-400 border-amber-600 shadow-tile-3d hover:-translate-y-1'
        }
        ${
          isGuessMode && !isEliminated
            ? 'ring-4 ring-red-500 scale-105 animate-pulse'
            : ''
        }
      `}
      style={{ aspectRatio: '3/4', minHeight: '120px' }}
      title={isGuessMode ? `${character.name} wählen` : `${character.name} umklappen`}
    >
      {/* White Plastic/Paper Card Insert */}
      <div className="w-full flex-1 bg-white rounded-md flex flex-col overflow-hidden border border-amber-500/50 shadow-inner">
        {/* Character Portrait */}
        <div className="w-full flex-1 relative bg-slate-100 overflow-hidden">
          <CharacterAvatar character={character} />
          {isEliminated && (
            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
              <span className="w-8 h-1 bg-red-600 rounded-full rotate-45 transform" />
            </div>
          )}
        </div>

        {/* Character Name Bar */}
        <div className="w-full bg-white px-1 py-1 text-center border-t border-slate-200">
          <span className="block font-display font-extrabold text-xs sm:text-sm text-slate-950 truncate leading-none">
            {character.name}
          </span>
        </div>
      </div>

      {/* Yellow Plastic Bottom Hinge */}
      <div className="w-8 h-1 bg-amber-600/70 rounded-full mt-1" />
    </div>
  );
};
