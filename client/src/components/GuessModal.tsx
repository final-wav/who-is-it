import React from 'react';
import { Character, RoomSettings } from '../../../worker/types';
import { CharacterAvatar } from './CharacterAvatar';
import { AlertTriangle, Target, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border-4 border-amber-400 w-full max-w-md rounded-3xl shadow-2xl p-5 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 rounded-xl text-xs font-black uppercase tracking-wider">
            <Target className="w-3.5 h-3.5" /> Wer ist es? Lösen
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white mt-2 mb-3">
          Ist deine gesuchte Person {character.name}?
        </h3>

        {/* Selected Portrait */}
        <div className="w-24 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-amber-400 bg-amber-50 dark:bg-slate-800 mb-3 shadow-md">
          <CharacterAvatar character={character} />
        </div>

        {/* Warning Callout */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl flex items-start gap-2.5 text-left mb-5 text-xs text-amber-950 dark:text-amber-200 font-sans">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            {settings.instantLossOnWrongGuess ? (
              <>
                <strong>Spielregel:</strong> Ein falscher Tipp beendet das Spiel sofort mit einer <strong>Niederlage</strong>!
              </>
            ) : (
              <>
                Ein falscher Tipp beendet deinen aktuellen Spielzug ohne Ergebnis.
              </>
            )}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="btn-board py-2.5 px-3 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 font-bold rounded-xl border border-stone-300 dark:border-slate-700 text-xs sm:text-sm uppercase tracking-wider"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onConfirmGuess(character.id)}
            className="btn-board py-2.5 px-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-xl shadow-md text-xs sm:text-sm uppercase tracking-wider"
          >
            Ja, ich löse!
          </button>
        </div>
      </div>
    </div>
  );
};
