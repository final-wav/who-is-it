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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
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
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3 p-2 sm:p-4 font-display">
      {/* Modern Red/Blue Split Duel Header */}
      <div className="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 text-center shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Subtle dynamic background glow from Red to Blue */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-blue-500 filter drop-shadow-sm">
            Wer ist es?
          </span>
        </h1>
        <p className="text-xs font-bold text-stone-400 mt-1 font-sans">
          Das moderne 1v1 Echtzeit-Duell
        </p>

        {/* Room Code Badge */}
        <div className="mt-4 flex items-center justify-center gap-3 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800 max-w-sm mx-auto shadow-inner">
          <span className="text-xs font-bold text-stone-400">RAUM:</span>
          <span className="text-2xl font-black text-amber-400 tracking-widest">{roomId}</span>
          <button
            onClick={handleCopyLink}
            className="btn-board px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700 transition"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            {copied ? 'Kopiert' : 'Link'}
          </button>
        </div>
      </div>

      {/* Modern 1v1 Arena: Red Player vs Blue Player */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
        {/* Slot 1: Red Player */}
        <div className="bg-gradient-to-br from-red-600 via-red-700 to-rose-800 border-2 border-red-500/40 rounded-2xl p-4 text-white shadow-lg shadow-red-950/40 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider block text-red-200 font-sans">
              Rotes Brett (Host)
            </span>
            <span className="text-lg font-black truncate block max-w-[150px]">
              {p1?.name || playerName || 'Host'}
            </span>
          </div>
          <span className="bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-black border border-white/10">
            Bereit
          </span>
        </div>

        {/* Slot 2: Blue Player */}
        <div
          className={`rounded-2xl p-4 transition flex items-center justify-between border-2 ${
            p2?.connected
              ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-sky-800 border-blue-500/40 text-white shadow-lg shadow-blue-950/40'
              : 'bg-slate-900 border-slate-800 text-stone-400 border-dashed'
          }`}
        >
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider block text-blue-200 font-sans">
              Blaues Brett (Gast)
            </span>
            <span className="text-lg font-black truncate block max-w-[150px] text-white">
              {p2?.connected ? p2.name : 'Warten auf Spieler 2...'}
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-black ${
              p2?.connected ? 'bg-black/30 text-white border border-white/10' : 'bg-slate-800 text-stone-500'
            }`}
          >
            {p2?.connected ? 'Bereit' : 'Offen'}
          </span>
        </div>
      </div>

      {/* Modern Deck Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <span className="text-xs font-black text-stone-300 uppercase tracking-wider block mb-2 font-sans">
          Kartenpaket wählen
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {availableDecks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => setSelectedDeckId(deck.id)}
              className={`btn-board p-3 rounded-xl border-2 text-center transition ${
                selectedDeckId === deck.id
                  ? 'bg-gradient-to-b from-amber-300 to-amber-400 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 -translate-y-0.5'
                  : 'bg-slate-950 border-slate-800 text-stone-300 hover:border-slate-700'
              }`}
            >
              <User className="w-5 h-5 mx-auto mb-1 opacity-80" />
              <span className="text-xs block font-black truncate">{deck.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Start Button: Vibrant Red-to-Blue Duel Gradient Button */}
      <button
        onClick={handleStart}
        disabled={!bothConnected}
        className={`btn-board w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider transition flex items-center justify-center gap-2 ${
          bothConnected
            ? 'bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:via-rose-500 hover:to-blue-500 text-white shadow-xl shadow-red-600/20 transform hover:scale-[1.01]'
            : 'bg-slate-800 text-stone-500 cursor-not-allowed border border-slate-700'
        }`}
      >
        <Swords className="w-5 h-5" />
        {bothConnected ? 'Duell starten' : 'Warte auf Mitspieler...'}
      </button>
    </div>
  );
};
