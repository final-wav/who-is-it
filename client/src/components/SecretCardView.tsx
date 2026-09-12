import React, { useState } from 'react';
import { Character } from '../../../worker/types';
import { CharacterAvatar } from './CharacterAvatar';
import { Eye, EyeOff, Shield } from 'lucide-react';

interface SecretCardViewProps {
  secretCharacter: Character | null;
}

export const SecretCardView: React.FC<SecretCardViewProps> = ({ secretCharacter }) => {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  if (!secretCharacter) {
    return null;
  }

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-2 sm:p-2.5 shadow-lg flex items-center gap-3">
      {/* Privacy Guard Tile */}
      <div
        onClick={() => setIsRevealed(prev => !prev)}
        className="cursor-pointer relative w-14 h-18 sm:w-16 sm:h-20 rounded-lg overflow-hidden border-2 border-slate-700 bg-slate-950 flex flex-col items-center justify-center transition hover:border-slate-500 select-none flex-shrink-0"
        title="Tippen zum Verdecken / Aufdecken"
      >
        {isRevealed ? (
          <>
            <CharacterAvatar character={secretCharacter} className="w-full h-full object-cover" />
            <div className="absolute top-1 right-1 bg-slate-900/90 p-0.5 rounded text-stone-300">
              <EyeOff className="w-3 h-3" />
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-1.5 text-center">
            <Shield className="w-4 h-4 text-stone-400 mb-1" />
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter leading-tight">
              Verdeckt
            </span>
          </div>
        )}
      </div>

      {/* Info Label */}
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono">
          Deine Geheimkarte
        </span>
        <div className="text-sm sm:text-base font-display font-black text-white truncate max-w-[130px] sm:max-w-[170px]">
          {isRevealed ? secretCharacter.name : '••••••••'}
        </div>
        <p className="text-[10px] text-stone-400 leading-tight">
          {isRevealed
            ? 'Deine Figur, die das Gegenüber erraten muss.'
            : 'Vor Blicken geschützt.'}
        </p>
      </div>

      <button
        onClick={() => setIsRevealed(prev => !prev)}
        className="ml-auto p-1.5 bg-slate-800 hover:bg-slate-700 text-stone-300 rounded border border-slate-700 transition"
        title={isRevealed ? 'Verbergen' : 'Aufdecken'}
      >
        {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-retro-blue" />}
      </button>
    </div>
  );
};
