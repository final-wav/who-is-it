import React, { useState } from 'react';
import { Deck } from '../../../worker/types';
import { X, Send } from 'lucide-react';

interface QuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAsk: (question: string, attributeFilter?: Record<string, any>) => void;
  deck: Deck;
}

export const QuestionDialog: React.FC<QuestionDialogProps> = ({
  isOpen,
  onClose,
  onAsk,
  deck,
}) => {
  const [customQuestion, setCustomQuestion] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  if (!isOpen) return null;

  const handleQuickQuestion = (q: { text: string; key?: string; val?: any; hasAny?: boolean }) => {
    const filter = q.key ? { [q.key]: q.val !== undefined ? q.val : q.hasAny } : undefined;
    onAsk(q.text, filter);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    onAsk(customQuestion.trim());
    setCustomQuestion('');
    onClose();
  };

  const commonQuestions = deck.commonQuestions || [
    { text: 'Hat deine Person eine Brille?' },
    { text: 'Ist die Person weiblich?' },
    { text: 'Ist die Person männlich?' },
    { text: 'Hat die Person einen Bart oder Schnurrbart?' },
    { text: 'Trägt die Person eine Kopfbedeckung?' },
    { text: 'Hat die Person blonde Haare?' },
    { text: 'Hat die Person dunkle Haare?' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mb-3 bg-slate-900 border-4 border-slate-800 rounded-xl p-3 shadow-tray animate-in fade-in duration-100">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <span className="text-xs font-display font-black text-white uppercase tracking-wider">
          Frage auswählen
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="text-xs font-bold text-amber-400 hover:underline"
          >
            {showCustom ? 'Vorgefertigte Fragen' : 'Eigene Frage tippen'}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!showCustom ? (
        <div className="flex flex-wrap gap-1.5">
          {commonQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(q)}
              className="btn-toy text-left px-2.5 py-1.5 rounded bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-xs font-bold text-stone-200 border border-slate-700 transition"
            >
              {q.text}
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Ja/Nein-Frage eingeben..."
            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
            autoFocus
          />
          <button
            type="submit"
            disabled={!customQuestion.trim()}
            className="btn-toy px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" /> Fragen
          </button>
        </form>
      )}
    </div>
  );
};
