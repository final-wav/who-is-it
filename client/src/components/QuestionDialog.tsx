import React, { useState } from 'react';
import { Deck } from '../../../worker/types';
import { HelpCircle, MessageSquare, Send, X } from 'lucide-react';

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
    { text: 'Trägt die Person eine Mütze oder einen Hut?' },
    { text: 'Hat die Person blonde Haare?' },
    { text: 'Hat die Person dunkle Haare?' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base sm:text-lg">
              Frage an deinen Gegner stellen
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setTab('quick')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'quick'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Vordefinierte Fragen
          </button>
          <button
            onClick={() => setTab('custom')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'custom'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Eigene Frage
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto">
          {tab === 'quick' ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-400 mb-1">
                Wähle eine typische Ja/Nein-Frage per Klick aus:
              </p>
              {commonQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(q)}
                  className="w-full text-left p-3 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-sky-500 hover:bg-sky-950/30 transition text-sm text-slate-200 hover:text-white flex items-center justify-between group"
                >
                  <span>{q.text}</span>
                  <span className="text-xs text-sky-400 opacity-0 group-hover:opacity-100 transition">
                    Fragen →
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="flex flex-col gap-3">
              <p className="text-xs text-slate-400">
                Formuliere deine eigene Frage so, dass sie eindeutig mit <strong>Ja</strong> oder <strong>Nein</strong> beantwortet werden kann:
              </p>
              <textarea
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="z.B. Hat deine Person ein Haustier? / Trägt die Person Ohrringe?"
                rows={3}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 resize-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={!customQuestion.trim()}
                className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" /> Frage abschicken
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
