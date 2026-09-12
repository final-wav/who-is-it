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
        guess-tile relative cursor-pointer select-none rounded-md p-1 flex flex-col items-center justify-between
        border-2 transition-all duration-150
        ${
          isEliminated
            ? 'guess-tile-down bg-amber-500/40 border-amber-700/50'
            : 'guess-tile-up bg-amber-400 border-amber-600 shadow-tile-up hover:-translate-y-1'
        }
        ${
          isGuessMode && !isEliminated
            ? 'ring-4 ring-red-600 border-red-700 scale-105'
            : ''
        }
      `}
      style={{ aspectRatio: '3/4', minHeight: '120px' }}
      title={isGuessMode ? `${character.name} tippen` : `${character.name} umklappen`}
    >
      {/* White Paper Card Insert */}
      <div className="w-full flex-1 bg-white rounded flex flex-col overflow-hidden border border-amber-500/60 shadow-inner">
        {/* Portrait */}
        <div className="w-full flex-1 relative bg-slate-100 overflow-hidden">
          <CharacterAvatar character={character} />
          {isEliminated && (
            <div className="absolute inset-0 bg-slate-800/60 flex items-center justify-center">
              <div className="w-6 h-0.5 bg-red-500 rotate-45" />
            </div>
          )}
        </div>

        {/* Name Bar */}
        <div className="w-full bg-white px-1 py-1 text-center border-t border-slate-200">
          <span className="block font-display font-extrabold text-xs sm:text-sm text-slate-900 truncate leading-none">
            {character.name}
          </span>
        </div>
      </div>

      {/* Physical Plastic Bottom Tab */}
      <div className="w-6 h-1 bg-amber-600 rounded-full mt-1 opacity-80" />
    </div>
  );
};
