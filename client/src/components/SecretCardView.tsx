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
    <div className="flex items-center gap-2 bg-white border-2 border-amber-400 rounded-xl px-2 py-1 shadow-sm">
      {/* Yellow Plastic Holder Stand */}
      <div
        onClick={() => setIsRevealed(prev => !prev)}
        className="w-8 h-10 bg-amber-400 border border-amber-500 rounded-lg p-0.5 cursor-pointer select-none flex flex-col overflow-hidden shadow-2xs hover:scale-105 transition flex-shrink-0"
        title="Klicken zum Verdecken / Aufdecken"
      >
        {isRevealed ? (
          <div className="w-full flex-1 bg-white rounded overflow-hidden">
            <CharacterAvatar character={secretCharacter} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full flex-1 bg-amber-200 rounded flex items-center justify-center text-amber-800 font-display font-black text-sm">
            ?
          </div>
        )}
      </div>

      <div className="leading-tight">
        <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">
          Geheimkarte
        </span>
        <span className="text-xs sm:text-sm font-display font-black text-slate-900 block truncate max-w-[100px]">
          {isRevealed ? secretCharacter.name : '••••••••'}
        </span>
      </div>

      <button
        onClick={() => setIsRevealed(prev => !prev)}
        className="btn-board p-1 text-stone-500 hover:text-slate-900 rounded-lg"
        title={isRevealed ? 'Gegen Spicker verbergen' : 'Karte aufdecken'}
      >
        {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-stone-500" /> : <Eye className="w-3.5 h-3.5 text-amber-600" />}
      </button>
    </div>
  );
};
