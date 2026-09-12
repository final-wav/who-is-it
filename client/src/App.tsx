import React, { useState, useEffect, useRef } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { useAudio } from './hooks/useAudio';
import { Board } from './components/Board';
import { SecretCardView } from './components/SecretCardView';
import { Lobby } from './components/Lobby';
import { QuestionDialog } from './components/QuestionDialog';
import { AnswerModal } from './components/AnswerModal';
import { GuessModal } from './components/GuessModal';
import { GameOverModal } from './components/GameOverModal';
import { GameHistory } from './components/GameHistory';
import { DeckCreatorModal } from './components/DeckCreatorModal';
import { Character, Deck } from '../../worker/types';
import { getBackendBaseUrl } from './utils/api';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  Sparkles,
  Users,
  LogOut,
  Layers,
  ArrowRight,
  Shield,
  PlusCircle,
} from 'lucide-react';

export function App() {
  // Navigation & User
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('who_is_it_player_name') || 'Detektiv ' + Math.floor(Math.random() * 100);
  });
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinInputCode, setJoinInputCode] = useState<string>('');

  // Modals & UI States
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [guessTargetChar, setGuessTargetChar] = useState<Character | null>(null);
  const [isGuessMode, setIsGuessMode] = useState(false);
  const [isDeckCreatorOpen, setIsDeckCreatorOpen] = useState(false);
  const [customDeck, setCustomDeck] = useState<Deck | null>(() => {
    const saved = localStorage.getItem('who_is_it_custom_deck');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Sound
  const { muted, toggleMute, playSound } = useAudio();

  // Socket
  const {
    state,
    connected,
    error,
    clearError,
    playerId,
    startGame,
    askQuestion,
    answerQuestion,
    endElimination,
    guessCharacter,
    toggleCard,
    requestRematch,
    updateSettings,
  } = useGameSocket({ roomId, playerName });

  // Save player name
  useEffect(() => {
    localStorage.setItem('who_is_it_player_name', playerName);
  }, [playerName]);

  // Check URL query for room code (?room=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !roomId) {
      setRoomId(roomParam.toUpperCase());
    }
  }, [roomId]);

  // Audio trigger on game events
  const lastPhaseRef = useRef(state?.phase);
  const lastTurnPlayerRef = useRef(state?.currentTurnPlayerId);
  const lastHistoryLenRef = useRef(state?.history?.length || 0);

  useEffect(() => {
    if (!state) return;

    // It's my turn
    if (
      state.currentTurnPlayerId === playerId &&
      lastTurnPlayerRef.current !== playerId &&
      state.phase === 'QUESTION_TIME'
    ) {
      playSound('turn');
    }

    // Question asked to me
    if (
      state.phase === 'ANSWER_TIME' &&
      lastPhaseRef.current !== 'ANSWER_TIME' &&
      state.currentQuestion?.askerPlayerId !== playerId
    ) {
      playSound('question');
    }

    // New history item (answer)
    if (state.history.length > lastHistoryLenRef.current) {
      const latest = state.history[0];
      if (latest && latest.type === 'QUESTION' && latest.answer !== undefined) {
        if (latest.answer) playSound('yes');
        else playSound('no');
      }
    }

    // Game over sound
    if (state.phase === 'GAME_OVER' && lastPhaseRef.current !== 'GAME_OVER' && state.gameOverData) {
      if (state.gameOverData.winnerId === playerId) {
        playSound('victory');
      } else {
        playSound('defeat');
      }
    }

    lastPhaseRef.current = state.phase;
    lastTurnPlayerRef.current = state.currentTurnPlayerId;
    lastHistoryLenRef.current = state.history.length;
  }, [state, playerId, playSound]);

  // Handle Card Flip with Sound
  const handleToggleCard = (charId: string) => {
    if (!state) return;
    const isEliminated = state.myEliminatedIds.includes(charId);
    toggleCard(charId, !isEliminated);
    playSound('flip');
  };

  // Create room
  const handleCreateRoom = async () => {
    playSound('click');
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await fetch(`${baseUrl}/api/room/create`);
      if (res.ok) {
        const data = await res.json() as { roomId: string };
        setRoomId(data.roomId);
        window.history.replaceState({}, '', `?room=${data.roomId}`);
      } else {
        const fallback = 'ROOM' + Math.floor(Math.random() * 90 + 10);
        setRoomId(fallback);
      }
    } catch (e) {
      const fallback = 'ROOM' + Math.floor(Math.random() * 90 + 10);
      setRoomId(fallback);
    }
  };

  // Join existing room
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInputCode.trim()) return;
    playSound('click');
    const code = joinInputCode.trim().toUpperCase();
    setRoomId(code);
    window.history.replaceState({}, '', `?room=${code}`);
  };

  const handleLeaveRoom = () => {
    playSound('click');
    setRoomId(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const isMyTurn = state?.currentTurnPlayerId === playerId;
  const isAnswerTimeForMe = state?.phase === 'ANSWER_TIME' && state?.currentQuestion?.askerPlayerId !== playerId;
  const opponent = state?.players.find(p => p.id !== playerId);

  // 1. WELCOME SCREEN (No room joined)
  if (!roomId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-radial from-slate-900 via-game-dark to-slate-950">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center">
          {/* Logo / Badge */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-4xl shadow-xl shadow-sky-500/20 mb-4 transform -rotate-3 hover:rotate-0 transition">
            🕵️‍♂️
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Wer ist es?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-6">
            Echtzeit-Multiplayer • 3D-Kartenbrett • Eigene Decks
          </p>

          {/* Name Input */}
          <div className="text-left mb-5">
            <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Dein Spielername
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Name eingeben..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-sky-500 transition"
              maxLength={20}
            />
          </div>

          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-sky-500/25 transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mb-4"
          >
            <PlusCircle className="w-5 h-5" /> Neuen Raum erstellen
          </button>

          {/* Join Room Form */}
          <form onSubmit={handleJoinRoom} className="flex gap-2 mb-6">
            <input
              type="text"
              value={joinInputCode}
              onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
              placeholder="Raum-Code (z.B. ABCD)"
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold tracking-widest text-center uppercase focus:outline-none focus:border-sky-500 transition text-sm"
              maxLength={6}
            />
            <button
              type="submit"
              disabled={!joinInputCode.trim()}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sky-400 font-bold rounded-xl transition flex items-center justify-center text-sm"
            >
              Beitreten <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          {/* Custom Deck Creator Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => setIsDeckCreatorOpen(true)}
              className="w-full py-2.5 px-4 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <Sparkles className="w-4 h-4 text-purple-400" /> Eigene Bilder & Namen hochladen
            </button>
          </div>
        </div>

        <DeckCreatorModal
          isOpen={isDeckCreatorOpen}
          onClose={() => setIsDeckCreatorOpen(false)}
          onSelectCustomDeck={(deck) => setCustomDeck(deck)}
        />
      </div>
    );
  }

  // 2. LOBBY VIEW
  if (state?.phase === 'LOBBY') {
    return (
      <div className="min-h-screen flex flex-col bg-game-dark">
        {/* Top Mini Bar */}
        <header className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🕵️</span>
            <span className="font-black text-white text-sm tracking-wide">Wer ist es?</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title={muted ? 'Ton einschalten' : 'Stummschalten'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
            </button>
            <button
              onClick={handleLeaveRoom}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
              title="Raum verlassen"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-3">
          <Lobby
            roomState={state}
            roomId={roomId}
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
            onStartGame={startGame}
            onOpenDeckCreator={() => setIsDeckCreatorOpen(true)}
            customDeck={customDeck}
            onToggleInstantLoss={(val) => updateSettings({ instantLossOnWrongGuess: val })}
          />
        </main>

        <DeckCreatorModal
          isOpen={isDeckCreatorOpen}
          onClose={() => setIsDeckCreatorOpen(false)}
          onSelectCustomDeck={(deck) => setCustomDeck(deck)}
        />
      </div>
    );
  }

  // 3. IN-GAME BOARD VIEW
  return (
    <div className="min-h-screen flex flex-col bg-game-dark text-slate-100">
      {/* Game Header */}
      <header className="sticky top-0 z-30 px-3 sm:px-6 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-2 shadow-lg">
        {/* Left: Deck & Room Info */}
        <div className="flex items-center gap-3">
          <span className="text-xl hidden sm:inline">🕵️</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm">
                {state?.selectedDeck.name || 'Wer ist es?'}
              </span>
              <span className="text-[11px] font-bold bg-slate-800 text-sky-400 px-2 py-0.5 rounded-full">
                {roomId}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Runde {state?.turnNumber || 1}
            </span>
          </div>
        </div>

        {/* Center: Turn Status Indicator */}
        <div className="flex items-center justify-center">
          {isMyTurn ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded-full text-xs sm:text-sm font-black animate-pulse-subtle shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" />
              <span>DU BIST AM ZUG!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded-full text-xs sm:text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{opponent?.name || 'Gegner'} ist am Zug...</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            title={muted ? 'Ton an' : 'Stumm'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
          <button
            onClick={handleLeaveRoom}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition"
            title="Raum verlassen"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Playing Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 flex flex-col gap-4 pb-32">
        {/* Turn Action Buttons Bar (if my turn & question phase) */}
        {isMyTurn && state?.phase === 'QUESTION_TIME' && (
          <div className="w-full max-w-4xl mx-auto p-3 bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-500/40 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white block sm:inline mr-2">Was möchtest du tun?</span>
              Stelle eine Ja/Nein-Frage oder tippe auf die gesuchte Person.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playSound('click');
                  setIsGuessMode(false);
                  setIsQuestionOpen(true);
                }}
                className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-sky-500/20 transition transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4" /> Frage stellen
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  setIsGuessMode((prev) => !prev);
                }}
                className={`px-4 py-2.5 font-black text-xs sm:text-sm rounded-xl transition transform hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
                  isGuessMode
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-lg shadow-amber-400/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
                }`}
              >
                <Sparkles className="w-4 h-4" /> {isGuessMode ? 'Lösungs-Modus aktiv' : 'Lösen (Tipp abgeben)'}
              </button>
            </div>
          </div>
        )}

        {/* 3D Card Board */}
        {state && (
          <Board
            characters={state.selectedDeck.characters}
            eliminatedIds={state.myEliminatedIds}
            onToggleCard={handleToggleCard}
            onGuessCharacter={(char) => {
              setGuessTargetChar(char);
            }}
            isGuessMode={isGuessMode}
            phase={state.phase}
            isMyTurn={isMyTurn}
            onEndElimination={() => {
              playSound('click');
              endElimination();
            }}
          />
        )}

        {/* History of Questions & Answers */}
        {state && (
          <div className="w-full max-w-6xl mx-auto">
            <GameHistory history={state.history} myPlayerId={playerId} />
          </div>
        )}
      </main>

      {/* Docked Bottom Bar: Secret Card & Opponent Tracker */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 p-2 sm:p-3 shadow-2xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Secret Card View */}
          <SecretCardView secretCharacter={state?.mySecretCharacter || null} />

          {/* Opponent Status Tile */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3 hidden sm:flex flex-col items-end">
            <span className="text-[11px] font-semibold text-slate-400">Gegner: {opponent?.name || 'Spieler 2'}</span>
            <span className="text-xs font-bold text-white">
              {opponent?.cardCountEliminated || 0} von {state?.selectedDeck.characters.length || 24} Karten umgeklappt
            </span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {state && (
        <>
          {/* Question Dialog */}
          <QuestionDialog
            isOpen={isQuestionOpen}
            onClose={() => setIsQuestionOpen(false)}
            onAsk={(q, filter) => {
              playSound('click');
              askQuestion(q, filter);
            }}
            deck={state.selectedDeck}
          />

          {/* Answer Modal for Opponent */}
          <AnswerModal
            isOpen={isAnswerTimeForMe}
            questionText={state.currentQuestion?.text || ''}
            askerName={state.currentQuestion?.askerName || 'Gegner'}
            mySecretCharacter={state.mySecretCharacter}
            onAnswer={(ans) => {
              playSound('click');
              answerQuestion(ans);
            }}
          />

          {/* Guess Modal */}
          <GuessModal
            isOpen={Boolean(guessTargetChar)}
            character={guessTargetChar}
            settings={state.settings}
            onClose={() => setGuessTargetChar(null)}
            onConfirmGuess={(charId) => {
              playSound('click');
              guessCharacter(charId);
              setGuessTargetChar(null);
              setIsGuessMode(false);
            }}
          />

          {/* Game Over Modal */}
          <GameOverModal
            gameOverData={state.gameOverData}
            myPlayerId={playerId}
            onRematch={() => {
              playSound('click');
              requestRematch();
            }}
            onLeaveRoom={handleLeaveRoom}
          />
        </>
      )}

      {/* Deck Creator Modal */}
      <DeckCreatorModal
        isOpen={isDeckCreatorOpen}
        onClose={() => setIsDeckCreatorOpen(false)}
        onSelectCustomDeck={(deck) => setCustomDeck(deck)}
      />
    </div>
  );
}
