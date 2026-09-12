import React, { useState } from 'react';
import { Deck, SanitizedRoomState } from '../../../worker/types';
import {
  Users,
  Copy,
  Check,
  Play,
  Layers,
  Plus,
  User,
  PawPrint,
  Camera,
} from 'lucide-react';

interface LobbyProps {
  roomState: SanitizedRoomState | null;
  roomId: string;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onStartGame: (deckId?: string, customDeck?: Deck) => void;
  onOpenDeckCreator: () => void;
  customDeck: Deck | null;
  onToggleInstantLoss: (val: boolean) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  roomState,
  roomId,
  playerName,
  onStartGame,
  onOpenDeckCreator,
  customDeck,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedDeckType, setSelectedDeckType] = useState<'classic' | 'animals' | 'custom'>(
    customDeck ? 'custom' : 'classic'
  );

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
    if (selectedDeckType === 'custom' && customDeck) {
      onStartGame(undefined, customDeck);
    } else {
      onStartGame(selectedDeckType);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 p-3 sm:p-5">
      {/* Title & Room Code Card */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-5 sm:p-6 text-center shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 text-stone-300 rounded text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <Users className="w-3.5 h-3.5" /> 1v1 Spieltisch
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight mb-1">
          Wer ist es?
        </h1>
        <p className="text-xs text-stone-400 max-w-sm mx-auto mb-4 font-sans">
          Teile den Code oder Einladungslink mit deinem Spielpartner.
        </p>

        {/* Room Code Badge & Copy Link */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-md mx-auto">
          <div className="text-left">
            <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider">
              Raum-Code
            </span>
            <div className="text-2xl font-mono font-black text-retro-blue tracking-widest leading-none">
              {roomId}
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="btn-tactile w-full sm:w-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-stone-200 text-xs font-bold rounded border border-slate-700 transition flex items-center justify-center gap-1.5 font-mono"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-retro-green" /> Kopiert!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-400" /> Link kopieren
              </>
            )}
          </button>
        </div>
      </div>

      {/* Players Trays: Red Player & Blue Player */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Slot 1: Red Player */}
        <div className="bg-slate-900 border-2 border-retro-red/60 rounded-xl p-3.5 flex items-center justify-between shadow-tactile">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-retro-red flex-shrink-0" />
            <div>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                Spieler 1 (Rot)
              </span>
              <p className="text-sm font-bold text-white truncate max-w-[130px]">
                {p1?.name || playerName || 'Host'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-800 text-stone-300 px-2 py-0.5 rounded border border-slate-700">
            Bereit
          </span>
        </div>

        {/* Slot 2: Blue Player */}
        <div
          className={`rounded-xl p-3.5 flex items-center justify-between border-2 transition ${
            p2?.connected
              ? 'bg-slate-900 border-retro-blue/60 shadow-tactile'
              : 'bg-slate-950/60 border-dashed border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                p2?.connected ? 'bg-retro-blue' : 'bg-stone-600 animate-pulse'
              }`}
            />
            <div>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                Spieler 2 (Blau)
              </span>
              <p className="text-sm font-bold text-white truncate max-w-[130px]">
                {p2?.connected ? p2.name : 'Wartet auf Beitritt...'}
              </p>
            </div>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              p2?.connected
                ? 'bg-slate-800 text-stone-200 border-slate-700'
                : 'bg-slate-900 text-stone-500 border-slate-800'
            }`}
          >
            {p2?.connected ? 'Beigetreten' : 'Offen'}
          </span>
        </div>
      </div>

      {/* Deck Selector Card */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-stone-400" /> Kartenpaket wählen
          </h3>
          <button
            onClick={onOpenDeckCreator}
            className="text-xs font-bold text-stone-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 text-retro-amber" /> Eigene Fotos & Namen
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Classic */}
          <div
            onClick={() => setSelectedDeckType('classic')}
            className={`cursor-pointer p-3 rounded-lg border-2 transition ${
              selectedDeckType === 'classic'
                ? 'bg-slate-800 border-retro-blue'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center mb-1.5 text-retro-blue border border-slate-700">
              <User className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white font-display">Klassisch (24)</div>
            <p className="text-[11px] text-stone-400 mt-0.5">Originale Gesichter</p>
          </div>

          {/* Animals */}
          <div
            onClick={() => setSelectedDeckType('animals')}
            className={`cursor-pointer p-3 rounded-lg border-2 transition ${
              selectedDeckType === 'animals'
                ? 'bg-slate-800 border-retro-blue'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center mb-1.5 text-retro-amber border border-slate-700">
              <PawPrint className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white font-display">Tiere (24)</div>
            <p className="text-[11px] text-stone-400 mt-0.5">Tierreich & Merkmale</p>
          </div>

          {/* Custom */}
          <div
            onClick={() => {
              if (customDeck) setSelectedDeckType('custom');
              else onOpenDeckCreator();
            }}
            className={`cursor-pointer p-3 rounded-lg border-2 transition ${
              selectedDeckType === 'custom'
                ? 'bg-slate-800 border-retro-amber'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center mb-1.5 text-retro-amber border border-slate-700">
              <Camera className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white font-display truncate">
              {customDeck ? customDeck.name : 'Eigenes Foto-Deck'}
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5 truncate">
              {customDeck ? 'Bereit zum Spielen' : '+ Jetzt erstellen'}
            </p>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-1">
        <button
          onClick={handleStart}
          disabled={!bothConnected}
          className={`btn-tactile w-full py-3.5 px-5 rounded-lg font-display font-black text-sm uppercase tracking-wider shadow-tactile transition flex items-center justify-center gap-2 ${
            bothConnected
              ? 'bg-retro-green hover:bg-retro-green-dark text-white'
              : 'bg-slate-800 text-stone-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          {bothConnected ? 'Partie starten' : 'Warte auf 2. Person am Tisch...'}
        </button>
      </div>
    </div>
  );
};
