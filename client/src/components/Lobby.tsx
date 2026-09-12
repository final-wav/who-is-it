import React, { useState } from 'react';
import { Deck, SanitizedRoomState } from '../../../worker/types';
import { getAllAvailableDecks } from '../utils/decks';
import { Copy, Check, Play, User } from 'lucide-react';

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
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3 p-2 sm:p-4">
      {/* Box Header: Classic Red & Blue Split */}
      <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl p-4 sm:p-5 text-center shadow-tray">
        <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight uppercase">
          <span className="text-red-600">Wer</span> <span className="text-stone-400">ist</span> <span className="text-blue-600">es?</span>
        </h1>

        {/* Room Code Bar */}
        <div className="mt-3 flex items-center justify-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <span className="text-xs font-mono font-bold text-stone-400">RAUM-CODE:</span>
          <span className="text-xl font-mono font-black text-amber-400 tracking-widest">{roomId}</span>
          <button
            onClick={handleCopyLink}
            className="btn-toy ml-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-stone-200 text-xs font-bold rounded flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Kopiert' : 'Link'}
          </button>
        </div>
      </div>

      {/* The Two Trays: Red (Host) vs Blue (Guest) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Red Tray */}
        <div className="bg-red-700 border-4 border-red-900 rounded-xl p-3 text-white shadow-tray flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider block text-red-200">
              Rotes Brett (Host)
            </span>
            <span className="font-display font-black text-base truncate block max-w-[150px]">
              {p1?.name || playerName || 'Host'}
            </span>
          </div>
          <span className="bg-red-900/60 px-2 py-0.5 rounded text-xs font-bold">
            Bereit
          </span>
        </div>

        {/* Blue Tray */}
        <div
          className={`border-4 rounded-xl p-3 transition shadow-tray flex items-center justify-between ${
            p2?.connected
              ? 'bg-blue-700 border-blue-900 text-white'
              : 'bg-slate-900 border-dashed border-slate-800 text-stone-400'
          }`}
        >
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider block text-blue-200">
              Blaues Brett (Gast)
            </span>
            <span className="font-display font-black text-base truncate block max-w-[150px] text-white">
              {p2?.connected ? p2.name : 'Warten auf Spieler 2...'}
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold ${
              p2?.connected ? 'bg-blue-900/60 text-white' : 'bg-slate-800 text-stone-500'
            }`}
          >
            {p2?.connected ? 'Bereit' : 'Offen'}
          </span>
        </div>
      </div>

      {/* Clean Deck Chooser: Only lists available decks, NO upload/creator buttons */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-3.5 shadow-md">
        <span className="text-xs font-bold text-stone-300 uppercase tracking-wide block mb-2">
          Kartenpaket wählen
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableDecks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => setSelectedDeckId(deck.id)}
              className={`p-2.5 rounded-lg border-2 text-center transition ${
                selectedDeckId === deck.id
                  ? 'bg-amber-400 border-amber-600 text-slate-950 font-black shadow'
                  : 'bg-slate-950 border-slate-800 text-stone-300 hover:border-slate-700'
              }`}
            >
              <User className="w-4 h-4 mx-auto mb-1 opacity-70" />
              <span className="text-xs block font-bold truncate">{deck.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Start Match Button */}
      <button
        onClick={handleStart}
        disabled={!bothConnected}
        className={`btn-toy w-full py-3 rounded-xl font-display font-black text-sm uppercase tracking-wider shadow-tray transition flex items-center justify-center gap-2 ${
          bothConnected
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : 'bg-slate-800 text-stone-500 cursor-not-allowed border border-slate-700'
        }`}
      >
        <Play className="w-4 h-4 fill-current" />
        {bothConnected ? 'Spiel starten' : 'Warte auf Mitspieler...'}
      </button>
    </div>
  );
};
