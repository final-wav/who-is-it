import React from 'react';
import { Character } from '../../../worker/types';
import { Check, X, HelpCircle } from 'lucide-react';
import { CharacterAvatar } from './CharacterAvatar';

interface AnswerModalProps {
  isOpen: boolean;
  questionText: string;
  askerName: string;
  mySecretCharacter: Character | null;
  onAnswer: (answer: boolean) => void;
}

export const AnswerModal: React.FC<AnswerModalProps> = ({
  isOpen,
  questionText,
  askerName,
  mySecretCharacter,
  onAnswer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-md rounded-xl shadow-2xl p-5 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-150">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-stone-300 rounded text-xs font-mono font-bold uppercase tracking-wider mb-3">
          <HelpCircle className="w-3 h-3 text-retro-blue" /> Frage von {askerName}
        </div>

        {/* Question Text */}
        <div className="my-2 p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
          <p className="text-base sm:text-lg font-display font-bold text-white leading-snug">
            „{questionText}“
          </p>
        </div>

        {/* Secret Card Reminder */}
        {mySecretCharacter && (
          <div className="mb-4 p-2 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center gap-2.5 text-left">
            <div className="w-10 h-12 rounded overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-900">
              <CharacterAvatar character={mySecretCharacter} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-stone-400 block uppercase">Deine Figur:</span>
              <span className="text-xs sm:text-sm font-bold text-white">{mySecretCharacter.name}</span>
            </div>
          </div>
        )}

        {/* Tactile Big Answer Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            onClick={() => onAnswer(true)}
            className="btn-tactile py-3 px-4 bg-retro-green hover:bg-retro-green-dark text-white font-display font-black rounded-lg shadow-tactile flex items-center justify-center gap-2 text-base sm:text-lg uppercase tracking-wider"
          >
            <Check className="w-5 h-5 stroke-[3]" /> JA
          </button>

          <button
            onClick={() => onAnswer(false)}
            className="btn-tactile py-3 px-4 bg-retro-red hover:bg-retro-red-dark text-white font-display font-black rounded-lg shadow-tactile flex items-center justify-center gap-2 text-base sm:text-lg uppercase tracking-wider"
          >
            <X className="w-5 h-5 stroke-[3]" /> NEIN
          </button>
        </div>
      </div>
    </div>
  );
};
