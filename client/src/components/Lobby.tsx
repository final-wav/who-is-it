import React, { useState } from 'react';
import { Deck, SanitizedRoomState } from '../../../worker/types';
import { getAllAvailableDecks } from '../utils/decks';
import { Copy, Check, Play, User, Swords } from 'lucide-react';

interface LobbyProps {
  roomState: SanitizedRoomState | null;
  roomId: string;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onStartGame: (deckId?: string, customDeck?: Deck) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  roomState,
  roomId,
  playerName,
  onStartGame,
}) => {
  const [copied, setCopied] = useState(false);
  const [availableDecks] = useState<Deck[]>(() => getAllAvailableDecks());
  const [selectedDeckId, setSelectedDeckId] = useState<string>(availableDecks[0]?.id || 'classic');

  const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteUrl).catch(() => fallbackCopyTextToClipboard(inviteUrl));
    } else {
      fallbackCopyTextToClipboard(inviteUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const p1 = roomState?.players.find((p) => p.slot === 1);
  const p2 = roomState?.players.find((p) => p.slot === 2);
  const bothConnected = Boolean(p1?.connected && p2?.connected);

  const handleStart = () => {
    const chosen = availableDecks.find((d) => d.id === selectedDeckId);
    if (chosen?.isCustom) {
      onStartGame(undefined, chosen);
    } else {
      onStartGame(selectedDeckId);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4 p-3 sm:p-5 font-display">
      {/* Header */}
      <div className="relative bg-white border-2 border-stone-200 rounded-3xl p-5 sm:p-6 text-center shadow-xl overflow-hidden">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase">
          <span className="text-stone-900">Wer </span>
          <span className="text-amber-500">ist </span>
          <span className="text-stone-900">es?</span>
        </h1>
        <p className="text-xs font-bold text-stone-500 mt-1 font-sans">
          Das klassische 1v1 Personen-Ratespiel
        </p>

        {/* Room Code Badge & Invite Link */}
        <div className="mt-4 flex items-center justify-between gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200 max-w-sm mx-auto shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-stone-500 uppercase">Code:</span>
            <span className="text-2xl font-black text-stone-900 tracking-widest font-mono">{roomId}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="btn-board px-3 py-1.5 bg-white hover:bg-stone-100 text-slate-900 text-xs font-black rounded-xl flex items-center gap-1.5 border border-stone-300 shadow-2xs transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-600" />}
            {copied ? 'Kopiert!' : 'Link kopieren'}
          </button>
        </div>
      </div>

      {/* Players List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
        {/* Slot 1: Host */}
        <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 text-slate-900 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider block text-stone-500 font-sans">
              Spieler 1 (Host)
            </span>
            <span className="text-lg font-black truncate block max-w-[150px]">
              {p1?.name || playerName || 'Spieler 1'}
            </span>
          </div>
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-300">
            Bereit
          </span>
        </div>

        {/* Slot 2: Guest */}
        <div
          className={`rounded-2xl p-4 transition flex items-center justify-between border-2 ${
            p2?.connected
              ? 'bg-white border-stone-200 text-slate-900 shadow-sm'
              : 'bg-stone-50 border-stone-200 text-stone-400 border-dashed'
          }`}
        >
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider block text-stone-500 font-sans">
              Spieler 2 (Mitspieler)
            </span>
            <span className="text-lg font-black truncate block max-w-[150px]">
              {p2?.connected ? p2.name : 'Warten auf Mitspieler...'}
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-black ${
              p2?.connected
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-stone-200 text-stone-500 border border-stone-300'
            }`}
          >
            {p2?.connected ? 'Bereit' : 'Offen'}
          </span>
        </div>
      </div>

      {/* Deck Selector */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 shadow-sm">
        <span className="text-xs font-black text-stone-600 uppercase tracking-wider block mb-2 font-sans">
          Kartenpaket wählen
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {availableDecks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => setSelectedDeckId(deck.id)}
              className={`btn-board p-3 rounded-xl border-2 text-center transition ${
                selectedDeckId === deck.id
                  ? 'bg-amber-400 border-amber-500 text-slate-950 font-black shadow-md -translate-y-0.5'
                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
              }`}
            >
              <User className="w-5 h-5 mx-auto mb-1 opacity-80" />
              <span className="text-xs block font-black truncate">{deck.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleStart}
          className="btn-board w-full py-3.5 rounded-2xl font-black text-base uppercase tracking-wider transition flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white shadow-lg"
        >
          <Swords className="w-5 h-5" />
          {bothConnected ? 'Duell starten' : 'Spiel starten (Sofort losspielen)'}
        </button>
      </div>
    </div>
  );
};
