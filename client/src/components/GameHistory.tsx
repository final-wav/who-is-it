import React, { useState } from 'react';
import { TurnHistoryItem } from '../../../worker/types';
import { History, ChevronDown, ChevronUp, Check, X, HelpCircle, Sparkles } from 'lucide-react';

interface GameHistoryProps {
  history: TurnHistoryItem[];
  myPlayerId: string;
}

export const GameHistory: React.FC<GameHistoryProps> = ({ history, myPlayerId }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  if (!history || history.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center text-xs text-slate-400">
        Noch keine Fragen gestellt.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg transition-all">
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full px-4 py-3 bg-slate-800/60 hover:bg-slate-800 flex items-center justify-between transition text-xs sm:text-sm font-bold text-white"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-sky-400" />
          <span>Bisheriger Spielverlauf ({history.length})</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {/* History List */}
      {isOpen && (
        <div className="p-3 max-h-60 overflow-y-auto flex flex-col gap-2">
          {history.map((item) => {
            const isMe = item.askerPlayerId === myPlayerId;
            return (
              <div
                key={item.id}
                className={`p-2.5 rounded-xl border text-xs sm:text-sm flex items-start justify-between gap-3 ${
                  isMe
                    ? 'bg-sky-950/40 border-sky-800/60 text-sky-100'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-0.5">
                    <span>{isMe ? 'Du' : item.askerName}</span>
                    <span>• Runde {item.turnNumber}</span>
                  </div>

                  {item.type === 'QUESTION' ? (
                    <p className="font-medium text-white">„{item.questionText}“</p>
                  ) : (
                    <div className="flex items-center gap-1 font-bold text-amber-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      Lösungsversuch: {item.guessedCharacterName}
                    </div>
                  )}
                </div>

                {/* Answer Badge */}
                {item.type === 'QUESTION' ? (
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-xs uppercase tracking-wider flex-shrink-0 ${
                      item.answer
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                        : 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                    }`}
                  >
                    {item.answer ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> JA
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5 stroke-[3]" /> NEIN
                      </>
                    )}
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-xs uppercase tracking-wider flex-shrink-0 ${
                      item.isCorrect
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                        : 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                    }`}
                  >
                    {item.isCorrect ? 'Richtig!' : 'Falsch!'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
