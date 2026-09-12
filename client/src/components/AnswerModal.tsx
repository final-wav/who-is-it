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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border-2 border-sky-500/80 w-full max-w-md rounded-2xl shadow-2xl p-5 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Top badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/40 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
          <HelpCircle className="w-3.5 h-3.5" /> Frage von {askerName}
        </div>

        {/* Question Text */}
        <div className="my-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
          <p className="text-lg sm:text-xl font-extrabold text-white leading-snug">
            „{questionText}“
          </p>
        </div>

        {/* Secret card reminder */}
        {mySecretCharacter && (
          <div className="mb-5 p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center gap-3 text-left">
            <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
              <CharacterAvatar character={mySecretCharacter} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Deine geheime Figur:</p>
              <p className="text-sm font-bold text-white">{mySecretCharacter.name}</p>
            </div>
          </div>
        )}

        {/* Large Answer Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
          <button
            onClick={() => onAnswer(true)}
            className="py-4 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/30 transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-base sm:text-lg"
          >
            <Check className="w-6 h-6 stroke-[3]" /> JA
          </button>

          <button
            onClick={() => onAnswer(false)}
            className="py-4 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black rounded-xl shadow-lg shadow-rose-600/30 transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-base sm:text-lg"
          >
            <X className="w-6 h-6 stroke-[3]" /> NEIN
          </button>
        </div>
      </div>
    </div>
  );
};
