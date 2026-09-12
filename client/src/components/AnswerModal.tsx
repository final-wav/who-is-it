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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-amber-400 border-4 border-amber-500 rounded-3xl p-5 shadow-2xl text-center">
        <span className="text-xs font-black uppercase text-amber-950 block tracking-wider">
          Frage von {askerName}:
        </span>
        <span className="text-xl sm:text-2xl font-display font-black text-slate-950 block leading-tight mt-1 mb-2">
          „{questionText}“
        </span>
        {mySecretCharacter && (
          <div className="bg-amber-300/80 rounded-xl p-2 mb-4 text-xs font-bold text-amber-950">
            Deine geheime Person ist <strong>{mySecretCharacter.name}</strong>
          </div>
        )}

        {/* Big tactile JA / NEIN buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onAnswer(true)}
            className="btn-board py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-black rounded-2xl shadow-md text-base sm:text-lg flex items-center justify-center gap-1.5 uppercase tracking-wide"
          >
            <Check className="w-6 h-6 stroke-[3]" /> JA
          </button>
          <button
            onClick={() => onAnswer(false)}
            className="btn-board py-3 bg-red-600 hover:bg-red-500 text-white font-display font-black rounded-2xl shadow-md text-base sm:text-lg flex items-center justify-center gap-1.5 uppercase tracking-wide"
          >
            <X className="w-6 h-6 stroke-[3]" /> NEIN
          </button>
        </div>
      </div>
    </div>
  );
};
