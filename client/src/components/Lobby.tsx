import React, { useState } from 'react';
import { Deck, SanitizedRoomState } from '../../../worker/types';
import {
  Users,
  Copy,
  Check,
  Play,
  Settings,
  Sparkles,
  Layers,
  HelpCircle,
  PlusCircle,
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
  onPlayerNameChange,
  onStartGame,
  onOpenDeckCreator,
  customDeck,
  onToggleInstantLoss,
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
  const isHost = roomState?.mySlot === 1;

  const handleStart = () => {
    if (selectedDeckType === 'custom' && customDeck) {
      onStartGame(undefined, customDeck);
    } else {
      onStartGame(selectedDeckType);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5 p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Title & Room Code Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <Users className="w-3.5 h-3.5" /> Spiel-Lobby
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
          Wer ist es?
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          Lade einen Freund ein, um gegeneinander im 1v1-Duell anzutreten.
        </p>

        {/* Room Code Badge & Copy Link */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-lg mx-auto">
          <div className="text-left">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Raum-Code
            </span>
            <div className="text-2xl font-black text-sky-400 tracking-widest">{roomId}</div>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Link kopiert!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-sky-400" /> Einladungslink kopieren
              </>
            )}
          </button>
        </div>
      </div>

      {/* Players Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-400" /> Spieler ({roomState?.players.length || 1}/2)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Player 1 */}
          <div className="p-3.5 rounded-xl border bg-slate-800/60 border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="text-xs text-slate-400 font-medium">Spieler 1 (Host)</span>
                <p className="text-sm font-bold text-white truncate max-w-[140px]">
                  {p1?.name || playerName || 'Host'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full">
              Bereit
            </span>
          </div>

          {/* Player 2 */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
              p2?.connected
                ? 'bg-slate-800/60 border-slate-700'
                : 'bg-slate-950/40 border-dashed border-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full ${
                  p2?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400/80 animate-ping'
                }`}
              />
              <div>
                <span className="text-xs text-slate-400 font-medium">Spieler 2</span>
                <p className="text-sm font-bold text-white truncate max-w-[140px]">
                  {p2?.connected ? p2.name : 'Warte auf Mitspieler...'}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                p2?.connected
                  ? 'bg-sky-500/20 text-sky-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {p2?.connected ? 'Beigetreten' : 'Wartet...'}
            </span>
          </div>
        </div>
      </div>

      {/* Deck Selector & Custom Decks Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" /> Kartenpaket (Deck) wählen
          </h3>
          <button
            onClick={onOpenDeckCreator}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Eigene Bilder & Namen hochladen
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Classic Deck */}
          <div
            onClick={() => setSelectedDeckType('classic')}
            className={`cursor-pointer p-3.5 rounded-xl border transition ${
              selectedDeckType === 'classic'
                ? 'bg-sky-950/50 border-sky-500 shadow-md shadow-sky-500/10'
                : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <span className="text-2xl mb-1 block">👤</span>
            <div className="text-sm font-bold text-white">Klassisch</div>
            <p className="text-xs text-slate-400 mt-0.5">24 klassische Gesichter</p>
          </div>

          {/* Animals Deck */}
          <div
            onClick={() => setSelectedDeckType('animals')}
            className={`cursor-pointer p-3.5 rounded-xl border transition ${
              selectedDeckType === 'animals'
                ? 'bg-sky-950/50 border-sky-500 shadow-md shadow-sky-500/10'
                : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <span className="text-2xl mb-1 block">🦁</span>
            <div className="text-sm font-bold text-white">Tiere</div>
            <p className="text-xs text-slate-400 mt-0.5">24 Tiere & Eigenschaften</p>
          </div>

          {/* Custom Deck */}
          <div
            onClick={() => {
              if (customDeck) {
                setSelectedDeckType('custom');
              } else {
                onOpenDeckCreator();
              }
            }}
            className={`cursor-pointer p-3.5 rounded-xl border transition ${
              selectedDeckType === 'custom'
                ? 'bg-purple-950/50 border-purple-500 shadow-md shadow-purple-500/10'
                : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <span className="text-2xl mb-1 block">📸</span>
            <div className="text-sm font-bold text-white truncate">
              {customDeck ? customDeck.name : 'Eigenes Deck'}
            </div>
            <p className="text-xs text-purple-300 mt-0.5 truncate">
              {customDeck ? 'Bereit zum Spielen' : '+ Jetzt erstellen'}
            </p>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-2">
        <button
          onClick={handleStart}
          disabled={!bothConnected}
          className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg shadow-2xl transition-all flex items-center justify-center gap-2.5 ${
            bothConnected
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/30 transform hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          <Play className="w-5 h-5 fill-current" />
          {bothConnected
            ? 'Match starten!'
            : 'Warte auf Mitspieler zum Starten...'}
        </button>
      </div>
    </div>
  );
};
