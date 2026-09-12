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
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center gap-3">
      {/* Privacy Guard Box */}
      <div
        onClick={() => setIsRevealed(prev => !prev)}
        className="cursor-pointer relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex flex-col items-center justify-center transition transform hover:scale-105 select-none"
        title="Klicken zum Verdecken / Enthüllen gegen Schulterblicke"
      >
        {isRevealed ? (
          <>
            <CharacterAvatar character={secretCharacter} className="w-full h-full object-cover" />
            <div className="absolute top-1 right-1 bg-slate-900/80 p-1 rounded-full text-slate-300">
              <EyeOff className="w-3 h-3" />
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex flex-col items-center justify-center p-2 text-center">
            <Shield className="w-5 h-5 text-indigo-400 mb-1" />
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-tighter">
              Klick zum Anzeigen
            </span>
          </div>
        )}
      </div>

      {/* Info Label */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold uppercase tracking-wider">
          <span>Deine Geheimkarte</span>
        </div>
        <div className="text-base sm:text-lg font-black text-white truncate max-w-[140px] sm:max-w-[180px]">
          {isRevealed ? secretCharacter.name : '••••••••'}
        </div>
        <p className="text-[11px] text-slate-400 max-w-[180px] leading-tight mt-0.5">
          {isRevealed
            ? 'Dies ist deine Figur, die der Gegner erraten muss.'
            : 'Vor neugierigen Blicken geschützt.'}
        </p>
      </div>

      <button
        onClick={() => setIsRevealed(prev => !prev)}
        className="ml-auto p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center justify-center"
        title={isRevealed ? 'Verbergen' : 'Anzeigen'}
      >
        {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-sky-400" />}
      </button>
    </div>
  );
};
