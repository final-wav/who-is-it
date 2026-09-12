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
    <div className="w-full max-w-5xl mx-auto mb-3 bg-amber-400 border-4 border-amber-600 rounded-xl p-3 shadow-tray animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[200px]">
          <span className="text-[11px] font-black uppercase text-amber-950 block">
            Frage von {askerName}:
          </span>
          <span className="text-base sm:text-lg font-display font-black text-slate-950 block leading-tight">
            „{questionText}“
          </span>
          {mySecretCharacter && (
            <span className="text-[11px] font-bold text-amber-900 block mt-0.5">
              (Deine geheime Karte ist <strong>{mySecretCharacter.name}</strong>)
            </span>
          )}
        </div>

        {/* Big tactile JA / NEIN buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAnswer(true)}
            className="btn-toy px-5 py-2 bg-green-600 hover:bg-green-500 text-white font-display font-black rounded-lg shadow-btn-tactile text-sm sm:text-base flex items-center gap-1.5 uppercase"
          >
            <Check className="w-5 h-5 stroke-[3]" /> JA
          </button>
          <button
            onClick={() => onAnswer(false)}
            className="btn-toy px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-display font-black rounded-lg shadow-btn-tactile text-sm sm:text-base flex items-center gap-1.5 uppercase"
          >
            <X className="w-5 h-5 stroke-[3]" /> NEIN
          </button>
        </div>
      </div>
    </div>
  );
};
