import React, { useState } from 'react';
import { TurnHistoryItem } from '../../../worker/types';
import { History, ChevronDown, ChevronUp, Check, X, Target } from 'lucide-react';

interface GameHistoryProps {
  history: TurnHistoryItem[];
  myPlayerId: string;
}

export const GameHistory: React.FC<GameHistoryProps> = ({ history, myPlayerId }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  if (!history || history.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-2.5 text-center text-xs font-bold text-stone-500 shadow-2xs">
        Noch keine Fragen gestellt.
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-stone-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full px-3.5 py-2.5 bg-stone-50 hover:bg-stone-100 flex items-center justify-between transition text-xs font-black text-slate-800 uppercase tracking-wider"
      >
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-blue-600" />
          <span>Spielverlauf ({history.length})</span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-stone-500" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-500" />}
      </button>

      {/* History List */}
      {isOpen && (
        <div className="p-2.5 max-h-56 overflow-y-auto flex flex-col gap-1.5 bg-stone-50/50">
          {history.map((item) => {
            const isMe = item.askerPlayerId === myPlayerId;
            return (
              <div
                key={item.id}
                className={`p-2 rounded-xl border text-xs flex items-start justify-between gap-2.5 ${
                  isMe
                    ? 'bg-white border-blue-200 text-slate-900 shadow-2xs'
                    : 'bg-white border-stone-200 text-slate-800 shadow-2xs'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-500 mb-0.5">
                    <span className="font-black text-blue-600">{isMe ? 'Du' : item.askerName}</span>
                    <span>• Runde {item.turnNumber}</span>
                  </div>

                  {item.type === 'QUESTION' ? (
                    <p className="font-bold text-slate-900 leading-tight">„{item.questionText}“</p>
                  ) : (
                    <div className="flex items-center gap-1 font-black text-red-600">
                      <Target className="w-3.5 h-3.5" />
                      Lösungsversuch: {item.guessedCharacterName}
                    </div>
                  )}
                </div>

                {/* Answer Badge */}
                {item.type === 'QUESTION' ? (
                  <div
                    className={`flex items-center gap-0.5 px-2 py-0.5 rounded font-mono font-black text-[11px] uppercase tracking-wider flex-shrink-0 ${
                      item.answer
                        ? 'bg-emerald-950 border border-retro-green text-retro-green'
                        : 'bg-rose-950 border border-retro-red text-retro-red'
                    }`}
                  >
                    {item.answer ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" /> JA
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 stroke-[3]" /> NEIN
                      </>
                    )}
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-0.5 px-2 py-0.5 rounded font-mono font-black text-[11px] uppercase tracking-wider flex-shrink-0 ${
                      item.isCorrect
                        ? 'bg-emerald-950 border border-retro-green text-retro-green'
                        : 'bg-rose-950 border border-retro-red text-retro-red'
                    }`}
                  >
                    {item.isCorrect ? 'Richtig' : 'Falsch'}
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
