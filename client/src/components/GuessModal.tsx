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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border-2 border-retro-amber w-full max-w-md rounded-xl shadow-2xl p-5 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-retro-amber rounded text-xs font-mono font-bold uppercase tracking-wider">
            <Target className="w-3.5 h-3.5" /> Verdacht äußern
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-lg sm:text-xl font-display font-bold text-white mt-2 mb-3">
          Ist deine gesuchte Person {character.name}?
        </h3>

        {/* Selected Portrait */}
        <div className="w-20 h-24 mx-auto rounded-lg overflow-hidden border-2 border-slate-700 bg-slate-950 mb-3 shadow-tile">
          <CharacterAvatar character={character} />
        </div>

        {/* Warning Callout */}
        <div className="p-3 bg-slate-950 border border-amber-900/60 rounded-lg flex items-start gap-2.5 text-left mb-5 text-xs text-amber-200/90 font-sans">
          <AlertTriangle className="w-4 h-4 text-retro-amber flex-shrink-0 mt-0.5" />
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
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onClose}
            className="btn-tactile py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-stone-300 font-bold rounded-lg border border-slate-700 text-xs sm:text-sm uppercase tracking-wider font-mono"
          >
            Zurück
          </button>
          <button
            onClick={() => onConfirmGuess(character.id)}
            className="btn-tactile py-2.5 px-3 bg-retro-amber hover:bg-retro-amber-dark text-slate-950 font-display font-black rounded-lg shadow-tactile text-xs sm:text-sm uppercase tracking-wider"
          >
            Verdacht bestätigen
          </button>
        </div>
      </div>
    </div>
  );
};
