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
  onLeave?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  roomState,
  roomId,
  playerName,
  onStartGame,
  onLeave,
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

  const isMeHost = roomState?.mySlot === 1;
  const isMeGuest = roomState?.mySlot === 2;

  const p1Name = p1?.connected ? p1.name : (isMeHost ? playerName : 'Warten auf Host...');
  const p1Ready = Boolean(p1?.connected || isMeHost);

  const p2Name = p2?.connected ? p2.name : (isMeGuest ? playerName : 'Warten auf Mitspieler...');
  const p2Ready = Boolean(p2?.connected || isMeGuest);

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
      <div className="relative bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 text-center shadow-xl overflow-hidden">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase">
          <span className="text-red-600">Wer </span>
          <span className="text-stone-400">ist </span>
          <span className="text-blue-600">es?</span>
        </h1>
        <p className="text-xs font-bold text-stone-500 dark:text-slate-400 mt-1 font-sans">
          Das klassische 1v1 Duell — Rot gegen Blau
        </p>

        {/* Room Code Badge & Invite Link */}
        <div className="mt-4 flex items-center justify-between gap-3 bg-stone-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-stone-200 dark:border-slate-700 max-w-sm mx-auto shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-stone-500 dark:text-slate-400 uppercase">Code:</span>
            <span className="text-2xl font-black text-amber-500 tracking-widest font-mono">{roomId}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="btn-board px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-stone-100 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-xs font-black rounded-xl flex items-center gap-1.5 border border-stone-300 dark:border-slate-600 shadow-2xs transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-500" />}
            {copied ? 'Kopiert!' : 'Link kopieren'}
          </button>
        </div>
      </div>

      {/* Players List: Rot vs Blau */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
        {/* Slot 1: Rotes Brett (Host) */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-700 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider block text-red-100 font-sans">
              Rotes Brett (Host) {isMeHost && '(Du)'}
            </span>
            <span className="text-lg font-black truncate block max-w-[150px]">
              {p1Name}
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-black border ${
              p1Ready ? 'bg-black/20 text-white border-white/20' : 'bg-black/10 text-red-200 border-red-400/30'
            }`}
          >
            {p1Ready ? 'Bereit' : 'Warten'}
          </span>
        </div>

        {/* Slot 2: Blaues Brett (Mitspieler) */}
        <div
          className={`rounded-2xl p-4 transition flex items-center justify-between border-2 ${
            p2Ready
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-700 text-white shadow-md'
              : 'bg-stone-100 dark:bg-slate-900/60 border-stone-300 dark:border-slate-800 text-stone-500 dark:text-slate-400 border-dashed'
          }`}
        >
          <div>
            <span
              className={`text-[11px] font-black uppercase tracking-wider block font-sans ${
                p2Ready ? 'text-blue-100' : 'text-blue-800 dark:text-blue-400'
              }`}
            >
              Blaues Brett (Mitspieler) {isMeGuest && '(Du)'}
            </span>
            <span
              className={`text-lg font-black truncate block max-w-[150px] ${
                p2Ready ? 'text-white' : 'text-slate-900 dark:text-slate-300'
              }`}
            >
              {p2Name}
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-black ${
              p2Ready
                ? 'bg-black/20 text-white border border-white/20'
                : 'bg-white dark:bg-slate-800 text-stone-500 dark:text-slate-400 border border-stone-200 dark:border-slate-700'
            }`}
          >
            {p2Ready ? 'Bereit' : 'Offen'}
          </span>
        </div>
      </div>

      {/* Deck Selector */}
      <div className="bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <span className="text-xs font-black text-stone-600 dark:text-slate-400 uppercase tracking-wider block mb-2 font-sans">
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
                  : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:border-stone-300 dark:hover:border-slate-600'
              }`}
            >
              <User className="w-5 h-5 mx-auto mb-1 opacity-80" />
              <span className="text-xs block font-black truncate">{deck.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Start Button & Leave */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleStart}
          disabled={isMeGuest || (!bothConnected && !isMeHost)}
          className="btn-board w-full py-3.5 rounded-2xl font-black text-base uppercase tracking-wider transition flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white shadow-lg shadow-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Swords className="w-5 h-5" />
          {bothConnected
            ? isMeGuest
              ? 'Bereit! Warten auf Host zum Starten...'
              : 'Duell starten'
            : isMeGuest
            ? 'Warten auf Host...'
            : 'Warten auf Mitspieler... (oder Solo starten)'}
        </button>

        {onLeave && (
          <button
            onClick={onLeave}
            className="btn-board w-full py-2 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition border border-stone-300 dark:border-slate-700 text-center"
          >
            Raum verlassen
          </button>
        )}
      </div>
    </div>
  );
};
