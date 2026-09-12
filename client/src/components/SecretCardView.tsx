import React, { useState } from 'react';
import { Character } from '../../../worker/types';
import { CharacterAvatar } from './CharacterAvatar';
import { Eye, EyeOff } from 'lucide-react';

interface SecretCardViewProps {
  secretCharacter: Character | null;
}

export const SecretCardView: React.FC<SecretCardViewProps> = ({ secretCharacter }) => {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  if (!secretCharacter) return null;

  return (
    <div className="flex items-center gap-2.5 bg-slate-900 border-2 border-slate-700 rounded-lg p-1.5 sm:p-2 text-white shadow-sm">
      {/* Mini Card Slot */}
      <div
        onClick={() => setIsRevealed(prev => !prev)}
        className="w-11 h-14 sm:w-12 sm:h-16 bg-amber-400 border-2 border-amber-600 rounded p-0.5 cursor-pointer select-none flex flex-col overflow-hidden shadow"
        title="Verdecken / Aufdecken"
      >
        {isRevealed ? (
          <div className="w-full h-full bg-white rounded overflow-hidden">
            <CharacterAvatar character={secretCharacter} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-full bg-slate-800 rounded flex items-center justify-center text-stone-400">
            <EyeOff className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
          Deine Geheimkarte
        </span>
        <span className="text-sm sm:text-base font-display font-black leading-tight text-white">
          {isRevealed ? secretCharacter.name : '••••••••'}
        </span>
      </div>

      <button
        onClick={() => setIsRevealed(prev => !prev)}
        className="btn-toy ml-1 p-1 bg-slate-800 hover:bg-slate-700 text-stone-300 rounded border border-slate-700"
        title={isRevealed ? 'Verbergen' : 'Aufdecken'}
      >
        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
      </button>
    </div>
  );
};
