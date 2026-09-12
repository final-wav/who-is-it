import React from 'react';
import { Character, RoomSettings } from '../../../worker/types';
import { CharacterAvatar } from './CharacterAvatar';
import { AlertTriangle, Sparkles, X } from 'lucide-react';

interface GuessModalProps {
  isOpen: boolean;
  character: Character | null;
  settings: RoomSettings;
  onClose: () => void;
  onConfirmGuess: (characterId: string) => void;
}

export const GuessModal: React.FC<GuessModalProps> = ({
  isOpen,
  character,
  settings,
  onClose,
  onConfirmGuess,
}) => {
  if (!isOpen || !character) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border-2 border-amber-500/80 w-full max-w-md rounded-2xl shadow-2xl p-5 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Finaler Lösungsversuch
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mt-2 mb-4">
          Ist deine geheime Person {character.name}?
        </h3>

        {/* Selected character portrait preview */}
        <div className="w-24 h-28 mx-auto rounded-xl overflow-hidden border-2 border-amber-400/60 shadow-xl mb-4">
          <CharacterAvatar character={character} />
        </div>

        {/* Warning rule */}
        <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl flex items-start gap-2.5 text-left mb-6 text-xs sm:text-sm text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            {settings.instantLossOnWrongGuess ? (
              <>
                <strong>Achtung:</strong> Wenn dieser Tipp falsch ist, <strong>verlierst du das Spiel sofort!</strong>
              </>
            ) : (
              <>
                Wenn dieser Tipp falsch ist, verlierst du deinen aktuellen Zug.
              </>
            )}
          </span>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition text-sm"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onConfirmGuess(character.id)}
            className="py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:scale-105 active:scale-95 text-sm"
          >
            Ja, lösen!
          </button>
        </div>
      </div>
    </div>
  );
};
