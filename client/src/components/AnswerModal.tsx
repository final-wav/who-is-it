import React from 'react';
import { Character } from '../../../worker/types';
import { Check, X } from 'lucide-react';

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
    <div className="w-full max-w-5xl mx-auto mb-3 bg-amber-400 border-2 border-amber-500 rounded-2xl p-3 sm:p-4 shadow-lg animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[200px]">
          <span className="text-xs font-black uppercase text-amber-950 block tracking-wider">
            Frage von {askerName}:
          </span>
          <span className="text-base sm:text-lg font-display font-black text-slate-950 block leading-tight mt-0.5">
            „{questionText}“
          </span>
          {mySecretCharacter && (
            <span className="text-xs font-bold text-amber-900 block mt-1">
              (Deine geheime Person ist <strong>{mySecretCharacter.name}</strong>)
            </span>
          )}
        </div>

        {/* Big tactile JA / NEIN buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAnswer(true)}
            className="btn-board px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-black rounded-xl shadow-md text-sm sm:text-base flex items-center gap-1.5 uppercase tracking-wide"
          >
            <Check className="w-5 h-5 stroke-[3]" /> JA
          </button>
          <button
            onClick={() => onAnswer(false)}
            className="btn-board px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-display font-black rounded-xl shadow-md text-sm sm:text-base flex items-center gap-1.5 uppercase tracking-wide"
          >
            <X className="w-5 h-5 stroke-[3]" /> NEIN
          </button>
        </div>
      </div>
    </div>
  );
};
