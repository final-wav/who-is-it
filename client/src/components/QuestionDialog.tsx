import React, { useState } from 'react';
import { Deck } from '../../../worker/types';
import { HelpCircle, MessageSquare, Send, X, ArrowRight } from 'lucide-react';

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
  const [tab, setTab] = useState<'quick' | 'custom'>('quick');

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-800 text-retro-blue rounded border border-slate-700">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-white text-sm sm:text-base">
              Frage an dein Gegenüber stellen
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setTab('quick')}
            className={`btn-tactile flex-1 py-1.5 text-xs font-mono font-bold rounded uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
              tab === 'quick'
                ? 'bg-retro-blue text-white shadow-tactile'
                : 'bg-slate-900 text-stone-400 hover:text-stone-200 border border-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> Merkmal-Schnellauswahl
          </button>
          <button
            onClick={() => setTab('custom')}
            className={`btn-tactile flex-1 py-1.5 text-xs font-mono font-bold rounded uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
              tab === 'custom'
                ? 'bg-retro-blue text-white shadow-tactile'
                : 'bg-slate-900 text-stone-400 hover:text-stone-200 border border-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Eigene Frage
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {tab === 'quick' ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-stone-400 mb-1 font-sans">
                Wähle eine typische Frage per Klick aus:
              </p>
              {commonQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(q)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-retro-blue hover:bg-slate-800/80 transition text-xs sm:text-sm text-stone-200 hover:text-white flex items-center justify-between group"
                >
                  <span className="font-medium">{q.text}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-retro-blue opacity-0 group-hover:opacity-100 transition" />
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="flex flex-col gap-3">
              <p className="text-xs text-stone-400">
                Die Frage muss mit <strong>Ja</strong> oder <strong>Nein</strong> beantwortbar sein:
              </p>
              <textarea
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="z.B. Hat deine Person sichtbare Zähne? / Trägt sie Schmuck?"
                rows={3}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-retro-blue resize-none font-sans"
                autoFocus
              />
              <button
                type="submit"
                disabled={!customQuestion.trim()}
                className="btn-tactile w-full py-2.5 bg-retro-blue hover:bg-retro-blue-dark disabled:opacity-40 text-white font-display font-bold rounded-lg shadow-tactile transition flex items-center justify-center gap-1.5 text-xs sm:text-sm uppercase tracking-wider"
              >
                <Send className="w-3.5 h-3.5" /> Frage abschicken
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
