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
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3 p-2 sm:p-4 font-display">
      {/* Box Header: Classic MB "WER IST ES?" */}
      <div className="bg-slate-900 border-4 border-slate-800 rounded-3xl p-5 text-center shadow-tray-3d">
        <div className="inline-block transform -rotate-1 hover:rotate-0 transition">
          <span className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase">
            <span className="bg-red-600 text-white px-3 py-1 rounded-xl shadow-md mr-1 border-2 border-red-700">
              WER
            </span>
            <span className="text-amber-400 mx-1">IST</span>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-xl shadow-md ml-1 border-2 border-blue-700">
              ES?
            </span>
          </span>
        </div>

        {/* Room Code Badge */}
        <div className="mt-4 flex items-center justify-center gap-3 bg-slate-950 p-2.5 rounded-2xl border-2 border-slate-800 max-w-sm mx-auto">
          <span className="text-xs font-bold text-stone-400">RAUM-CODE:</span>
          <span className="text-2xl font-black text-amber-400 tracking-widest">{roomId}</span>
          <button
            onClick={handleCopyLink}
            className="btn-board px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 border border-slate-700"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            {copied ? 'Kopiert' : 'Link'}
          </button>
        </div>
      </div>

      {/* The Two Plastic Trays: Red (Player 1) vs Blue (Player 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Red Tray */}
        <div className="bg-red-600 border-4 border-red-800 rounded-2xl p-3.5 text-white shadow-tray-3d flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider block text-red-200">
              Rotes Brett (Host)
            </span>
            <span className="text-lg font-black truncate block max-w-[150px]">
              {p1?.name || playerName || 'Host'}
            </span>
          </div>
          <span className="bg-red-800/80 px-2.5 py-1 rounded-lg text-xs font-black">
            Bereit
          </span>
        </div>

        {/* Blue Tray */}
        <div
          className={`border-4 rounded-2xl p-3.5 transition shadow-tray-3d flex items-center justify-between ${
            p2?.connected
              ? 'bg-blue-600 border-blue-800 text-white'
              : 'bg-slate-900 border-slate-800 text-stone-400 border-dashed'
          }`}
        >
          <div>
            <span className="text-xs font-black uppercase tracking-wider block text-blue-200">
              Blaues Brett (Gast)
            </span>
            <span className="text-lg font-black truncate block max-w-[150px] text-white">
              {p2?.connected ? p2.name : 'Warten auf Spieler 2...'}
            </span>
          </div>
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-black ${
              p2?.connected ? 'bg-blue-800/80 text-white' : 'bg-slate-800 text-stone-500'
            }`}
          >
            {p2?.connected ? 'Bereit' : 'Offen'}
          </span>
        </div>
      </div>

      {/* Deck Selector in Yellow Tile Look */}
      <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl p-4 shadow-md">
        <span className="text-xs font-black text-amber-400 uppercase tracking-wider block mb-2">
          Kartenpaket wählen
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableDecks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => setSelectedDeckId(deck.id)}
              className={`btn-board p-3 rounded-xl border-2 text-center transition ${
                selectedDeckId === deck.id
                  ? 'bg-amber-400 border-amber-600 text-slate-950 font-black shadow-tile-3d -translate-y-0.5'
                  : 'bg-slate-950 border-slate-800 text-stone-300 hover:border-slate-700'
              }`}
            >
              <User className="w-5 h-5 mx-auto mb-1 opacity-80" />
              <span className="text-xs block font-black truncate">{deck.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Start Button: Big green 3D button */}
      <button
        onClick={handleStart}
        disabled={!bothConnected}
        className={`btn-board w-full py-3.5 rounded-2xl font-black text-base uppercase tracking-wider shadow-btn-green transition flex items-center justify-center gap-2 ${
          bothConnected
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : 'bg-slate-800 text-stone-500 cursor-not-allowed border border-slate-700 shadow-none'
        }`}
      >
        <Play className="w-5 h-5 fill-current" />
        {bothConnected ? 'Spiel starten' : 'Warte auf Mitspieler...'}
      </button>
    </div>
  );
};
