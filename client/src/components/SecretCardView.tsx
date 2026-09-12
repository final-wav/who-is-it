import React, { useState } from 'react';
import { Character } from '../../../worker/types';
import { CharacterAvatar } from './CharacterAvatar';
import { Eye, EyeOff } from 'lucide-react';

interface SecretCardViewProps {
  secretCharacter: Character | null;
}

export const SecretCardView: React.FC<SecretCardViewProps> = ({ secretCharacter }) => {
  const [isRevealed, setIsRevealed] = useState<boolean>(true);

  if (!secretCharacter) return null;

  return (
    <div className="flex items-center gap-3 bg-white border-2 border-amber-400/80 rounded-2xl p-2 shadow-md">
      {/* Yellow Plastic Holder Stand (wie am MB Spielbrett) */}
      <div
        onClick={() => setIsRevealed(prev => !prev)}
        className="w-12 h-16 sm:w-14 sm:h-18 bg-amber-400 border-2 border-amber-500 rounded-xl p-1 cursor-pointer select-none flex flex-col overflow-hidden shadow-md hover:scale-105 transition"
        title="Klicken zum Verdecken / Aufdecken"
      >
        {isRevealed ? (
          <div className="w-full flex-1 bg-white rounded-lg overflow-hidden border border-amber-300">
            <CharacterAvatar character={secretCharacter} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full flex-1 bg-amber-200/80 rounded-lg flex items-center justify-center text-amber-800 font-display font-black text-xl">
            ?
          </div>
        )}
      </div>

      <div>
        <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider block font-display">
          Deine Geheimkarte
        </span>
        <span className="text-base sm:text-lg font-display font-black leading-tight text-slate-900 block">
          {isRevealed ? secretCharacter.name : '••••••••'}
        </span>
      </div>

      <button
        onClick={() => setIsRevealed(prev => !prev)}
        className="btn-board p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl border border-stone-300"
        title={isRevealed ? 'Gegen Spicker verbergen' : 'Karte aufdecken'}
      >
        {isRevealed ? <EyeOff className="w-4 h-4 text-stone-600" /> : <Eye className="w-4 h-4 text-amber-600" />}
      </button>
    </div>
  );
};
