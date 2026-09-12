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
    <div className="flex items-center gap-3 bg-slate-900 border-2 border-slate-700 rounded-xl p-2 text-white shadow-md">
      {/* Yellow Plastic Holder Slot */}
      <div
        onClick={() => setIsRevealed(prev => !prev)}
        className="w-12 h-16 sm:w-14 sm:h-18 bg-amber-400 border-2 border-amber-600 rounded-lg p-1 cursor-pointer select-none flex flex-col overflow-hidden shadow-tile-3d hover:scale-105 transition"
        title="Klicken zum Verdecken / Aufdecken"
      >
        {isRevealed ? (
          <div className="w-full flex-1 bg-white rounded overflow-hidden">
            <CharacterAvatar character={secretCharacter} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full flex-1 bg-slate-800 rounded flex items-center justify-center text-amber-400 font-display font-black text-lg">
            ?
          </div>
        )}
      </div>

      <div>
        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block font-display">
          Deine Geheimkarte
        </span>
        <span className="text-base sm:text-lg font-display font-black leading-tight text-white block">
          {isRevealed ? secretCharacter.name : '••••••••'}
        </span>
      </div>

      <button
        onClick={() => setIsRevealed(prev => !prev)}
        className="btn-board p-1.5 bg-slate-800 hover:bg-slate-700 text-stone-300 rounded-lg border border-slate-700"
        title={isRevealed ? 'Verbergen' : 'Aufdecken'}
      >
        {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-amber-400" />}
      </button>
    </div>
  );
};
