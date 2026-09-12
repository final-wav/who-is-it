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
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center text-xs font-mono text-stone-500">
        Noch keine Fragen gestellt.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full px-3.5 py-2.5 bg-slate-950 hover:bg-slate-900 flex items-center justify-between transition text-xs font-mono font-bold text-stone-300 uppercase tracking-wider"
      >
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-retro-blue" />
          <span>Verlauf ({history.length})</span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-stone-500" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-500" />}
      </button>

      {/* History List */}
      {isOpen && (
        <div className="p-2.5 max-h-56 overflow-y-auto flex flex-col gap-1.5 bg-slate-950/50">
          {history.map((item) => {
            const isMe = item.askerPlayerId === myPlayerId;
            return (
              <div
                key={item.id}
                className={`p-2 rounded-lg border text-xs flex items-start justify-between gap-2.5 ${
                  isMe
                    ? 'bg-slate-900 border-slate-700/80 text-stone-100'
                    : 'bg-slate-900/60 border-slate-800 text-stone-300'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-stone-400 mb-0.5">
                    <span className="font-bold">{isMe ? 'Du' : item.askerName}</span>
                    <span>• Runde {item.turnNumber}</span>
                  </div>

                  {item.type === 'QUESTION' ? (
                    <p className="font-medium text-white leading-tight">„{item.questionText}“</p>
                  ) : (
                    <div className="flex items-center gap-1 font-bold text-retro-amber">
                      <Target className="w-3 h-3" />
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
