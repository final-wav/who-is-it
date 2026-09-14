import React, { useState, useEffect, useRef } from 'react';
import { useGame, actions, ensureConnected } from './net';
import { useAudio } from './hooks/useAudio';
import { Board } from './components/Board';
import { SecretCardView } from './components/SecretCardView';
import { Lobby } from './components/Lobby';
import { QuestionDialog } from './components/QuestionDialog';
import { AnswerModal } from './components/AnswerModal';
import { GuessModal } from './components/GuessModal';
import { GameOverModal } from './components/GameOverModal';
import { GameHistory } from './components/GameHistory';
import { AdminDeckEditor } from './components/AdminDeckEditor';
import { Character } from '../../worker/types';
import { useTheme } from './hooks/useTheme';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  Target,
  LogOut,
  ArrowRight,
  History,
  X,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';

export function App() {
  const isAdmin =
    new URLSearchParams(window.location.search).get('admin') === 'true' ||
    new URLSearchParams(window.location.search).get('admin') === 'decks' ||
    window.location.hash === '#admin';

  if (isAdmin) {
    return <AdminDeckEditor />;
  }

  const g = useGame();
  const state = g.state;
  const session = g.session;
  const inGame = Boolean(session && state);

  const { isDark, toggleTheme } = useTheme();

  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('who_is_it_player_name') || 'Spieler ' + Math.floor(Math.random() * 90 + 10);
  });

  const [joinMode, setJoinMode] = useState<'create' | 'join'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || params.get('lobby') ? 'join' : 'create';
  });

  const [joinInputCode, setJoinInputCode] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('room') || params.get('lobby'))?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || '';
  });

  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [guessTargetChar, setGuessTargetChar] = useState<Character | null>(null);
  const [isGuessMode, setIsGuessMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const { muted, toggleMute, playSound } = useAudio();

  const [localEliminatedIds, setLocalEliminatedIds] = useState<string[]>([]);

  useEffect(() => {
    ensureConnected();
  }, []);

  useEffect(() => {
    localStorage.setItem('who_is_it_player_name', playerName);
  }, [playerName]);

  // Sync local eliminated cards with room state if available, or reset on new game
  useEffect(() => {
    if (state?.phase === 'LOBBY' || (state?.phase === 'QUESTION_TIME' && state?.turnNumber === 1 && state?.history?.length === 0)) {
      setLocalEliminatedIds([]);
    } else if (state?.myEliminatedIds && state.myEliminatedIds.length > 0 && localEliminatedIds.length === 0) {
      setLocalEliminatedIds(state.myEliminatedIds);
    }
  }, [state?.phase, state?.turnNumber, state?.history?.length]);

  const playerId = session?.playerId || state?.myPlayerId || '';
  const lastPhaseRef = useRef(state?.phase);
  const lastTurnPlayerRef = useRef(state?.currentTurnPlayerId);
  const lastHistoryLenRef = useRef(state?.history?.length || 0);

  useEffect(() => {
    if (!state) return;

    if (
      state.currentTurnPlayerId === playerId &&
      lastTurnPlayerRef.current !== playerId &&
      state.phase === 'QUESTION_TIME'
    ) {
      playSound('turn');
    }

    if (
      state.phase === 'ANSWER_TIME' &&
      lastPhaseRef.current !== 'ANSWER_TIME' &&
      state.currentQuestion?.askerPlayerId !== playerId
    ) {
      playSound('question');
    }

    if (state.history.length > lastHistoryLenRef.current) {
      const latest = state.history[0];
      if (latest && latest.type === 'QUESTION' && latest.answer !== undefined) {
        if (latest.answer) playSound('yes');
        else playSound('no');
      }
    }

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

  const handleToggleCard = (charId: string) => {
    playSound('flip');
    setLocalEliminatedIds((prev) => {
      const isElim = prev.includes(charId);
      const next = isElim ? prev.filter((id) => id !== charId) : [...prev, charId];
      actions.toggleCard(charId, !isElim);
      return next;
    });
  };

  const handleCreateRoom = () => {
    const name = playerName.trim() || 'Spieler ' + Math.floor(Math.random() * 90 + 10);
    setPlayerName(name);
    playSound('click');
    actions.create(name);
  };

  const handleJoinRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = joinInputCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    if (code.length !== 4) return;

    const name = playerName.trim() || 'Spieler ' + Math.floor(Math.random() * 90 + 10);
    setPlayerName(name);
    playSound('click');
    actions.join(code, name);
  };

  const handleLeaveRoom = () => {
    playSound('click');
    actions.leave();
  };

  const handleQuickPlay = () => {
    playSound('click');
    const name = (playerName.trim() || 'Spieler') + ' (Solo)';
    actions.create(name);
  };

  // 1. WELCOME SCREEN: Modernes, helles/dunkles Design mit Tabs (wie Karten gegen alle)
  if (!state || !session) {
    const canSubmit =
      playerName.trim().length > 0 &&
      (joinMode === 'create' || joinInputCode.trim().length === 4);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 bg-transparent font-display relative select-none">
        {/* Top-Right Theme Toggle */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
          <button
            onClick={toggleTheme}
            className="p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white rounded-xl shadow-xs hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
            title={isDark ? 'Heller Modus' : 'Dunkler Modus'}
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-zinc-700" />}
          </button>
        </div>

        {/* Outer anchor container so vertical position of the header stays locked when tabs switch */}
        <div className="w-full max-w-sm min-h-[510px] sm:min-h-[525px] flex flex-col justify-start my-auto relative z-10">
          <div className="w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-2 border-stone-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xl text-center transition-all duration-200">
          <div className="mb-5">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase">
              <span className="text-red-600">Wer </span>
              <span className="text-stone-400 dark:text-zinc-500">ist </span>
              <span className="text-blue-600">es?</span>
            </h1>
            <p className="text-xs font-bold text-stone-500 dark:text-zinc-400 mt-1 font-sans">
              Das klassische 1v1 Duell — Rot gegen Blau
            </p>
          </div>

          {/* Mode Tabs: Erstellen / Beitreten */}
          <div className="flex bg-stone-100 dark:bg-zinc-800 p-1 rounded-xl mb-4 border border-stone-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => {
                setJoinMode('create');
                playSound('click');
                actions.clearError();
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                joinMode === 'create'
                  ? 'bg-white dark:bg-zinc-700 text-red-600 dark:text-red-400 shadow-xs'
                  : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Raum erstellen
            </button>
            <button
              type="button"
              onClick={() => {
                setJoinMode('join');
                playSound('click');
                actions.clearError();
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                joinMode === 'join'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Raum beitreten
            </button>
          </div>

          {g.error && (
            <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
              <span>{g.error}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (joinMode === 'create') {
                handleCreateRoom();
              } else {
                handleJoinRoom();
              }
            }}
            className="flex flex-col gap-3"
          >
            <div className="text-left">
              <label className="text-[11px] font-black text-stone-600 dark:text-zinc-300 uppercase tracking-wider block mb-1">
                Dein Spielername
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="z. B. Alex"
                className={`w-full px-3.5 py-2.5 bg-stone-50 dark:bg-zinc-800 border-2 border-stone-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:outline-none transition ${
                  joinMode === 'create' ? 'focus:border-red-500' : 'focus:border-blue-500'
                }`}
                maxLength={20}
              />
            </div>

            {joinMode === 'join' && (
              <div className="text-left">
                <label className="text-[11px] font-black text-stone-600 dark:text-zinc-300 uppercase tracking-wider block mb-1">
                  4-stelliger Raum-Code
                </label>
                <input
                  type="text"
                  value={joinInputCode}
                  onChange={(e) =>
                    setJoinInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))
                  }
                  placeholder="ABCD"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-zinc-800 border-2 border-stone-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white font-black tracking-widest text-center uppercase text-base focus:outline-none focus:border-blue-500 transition font-mono"
                  maxLength={4}
                  autoFocus
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`btn-board w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-md text-sm uppercase tracking-wider flex items-center justify-center gap-2 mt-1 transition ${
                joinMode === 'create'
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
              }`}
            >
              {joinMode === 'create' ? 'Raum erstellen' : 'Raum beitreten'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Play Solo Button */}
          <div className="pt-3 mt-3 border-t border-stone-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleQuickPlay}
              className="btn-board w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs"
            >
              Sofort ausprobieren (Solo-Brett)
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // 2. LOBBY VIEW
  if (state.phase === 'LOBBY') {
    return (
      <div className="min-h-screen flex flex-col bg-transparent font-display">
        <header className="px-4 py-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b-2 border-stone-200 dark:border-zinc-800 flex items-center justify-between text-slate-900 dark:text-white shadow-xs">
          <span className="font-black text-base uppercase">
            <span className="text-red-600">Wer</span> <span className="text-stone-400 dark:text-zinc-500">ist</span> <span className="text-blue-600">es?</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 text-stone-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
              title={isDark ? 'Heller Modus' : 'Dunkler Modus'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-400" />}
            </button>
            <button
              onClick={toggleMute}
              className="p-1.5 text-stone-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
              title="Ton"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
            </button>
            <button
              onClick={handleLeaveRoom}
              className="p-1.5 text-stone-500 dark:text-zinc-400 hover:text-red-600 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
              title="Verlassen"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-2">
          <Lobby
            roomState={state}
            roomId={session?.code || state.roomId}
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
            onStartGame={actions.start}
            onLeave={actions.leave}
          />
        </main>
      </div>
    );
  }

  // 3. IN-GAME BOARD VIEW (100% viewport fit, KEIN SCROLLEN)
  const isMyTurn = state.currentTurnPlayerId === playerId;
  const isAnswerTimeForMe = state.phase === 'ANSWER_TIME' && state.currentQuestion?.askerPlayerId !== playerId;
  const opponent = state.players.find((p) => p.id !== playerId);
  const mySlot = state.mySlot || 1;

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden flex flex-col bg-transparent text-slate-900 dark:text-white font-display select-none">
      {/* Game Header */}
      <header className="relative h-12 flex-shrink-0 px-3 sm:px-5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b-2 border-stone-200 dark:border-zinc-800 flex items-center justify-between shadow-xs text-slate-900 dark:text-white z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-black text-sm sm:text-base uppercase tracking-tight">
            <span className="text-red-600">Wer</span> <span className="text-stone-400 dark:text-zinc-500">ist</span> <span className="text-blue-600">es?</span>
          </span>
          <span className="text-xs bg-stone-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-black px-2 py-0.5 rounded-lg border border-stone-300 dark:border-zinc-700">
            {session?.code || state.roomId}
          </span>
          <span className="text-xs text-stone-500 dark:text-zinc-400 font-bold hidden sm:inline">
            Runde {state.turnNumber || 1}
          </span>
          {state.history.length > 0 && (
            <button
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              className="btn-board px-2.5 py-0.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-xs font-bold text-stone-700 dark:text-zinc-300 rounded-lg flex items-center gap-1 border border-stone-300 dark:border-zinc-700"
            >
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Verlauf</span> ({state.history.length})
            </button>
          )}
        </div>

        {/* Mathematisch exakt zentrierte Zug-Anzeige */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="pointer-events-auto">
            {isMyTurn ? (
              <span className="px-4 py-1.5 bg-emerald-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md whitespace-nowrap">
                Du bist am Zug
              </span>
            ) : (
              <span className="px-3.5 py-1 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 font-bold text-xs rounded-xl border border-stone-300 dark:border-zinc-700 whitespace-nowrap">
                {opponent?.name || 'Gegner'} am Zug...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-1.5 text-stone-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
            title={isDark ? 'Heller Modus' : 'Dunkler Modus'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-400" />}
          </button>
          <button
            onClick={toggleMute}
            className="p-1.5 text-stone-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
            title="Ton"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
          </button>
          <button
            onClick={handleLeaveRoom}
            className="p-1.5 text-stone-500 dark:text-zinc-400 hover:text-red-600 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
            title="Verlassen"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Board Area (100% restliche Höhe ohne Scrollen) */}
      <main className="flex-1 min-h-0 w-full max-w-5xl mx-auto px-2 py-1 sm:py-1.5 flex flex-col items-center justify-center overflow-hidden">
        <Board
          characters={state.selectedDeck.characters}
          eliminatedIds={localEliminatedIds}
          onToggleCard={handleToggleCard}
          onGuessCharacter={(char) => setGuessTargetChar(char)}
          isGuessMode={isGuessMode}
          phase={state.phase}
          isMyTurn={isMyTurn}
          onEndElimination={() => {
            playSound('click');
            actions.endElimination();
          }}
          playerSlot={mySlot}
        />
      </main>

      {/* Docked Action & Secret Card Bar at Bottom */}
      <footer className="relative h-18 sm:h-22 flex-shrink-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t-2 border-stone-200 dark:border-zinc-800 px-3 sm:px-6 flex items-center justify-between gap-3 shadow-md z-30">
        <SecretCardView secretCharacter={state.mySecretCharacter || null} />

        {/* Turn Action Buttons exakt in der Mitte zentriert */}
        {isMyTurn && state.phase === 'QUESTION_TIME' ? (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={() => {
                  playSound('click');
                  setIsGuessMode(false);
                  setIsQuestionOpen(true);
                }}
                className="btn-board px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md whitespace-nowrap"
              >
                <HelpCircle className="w-4 h-4" /> Frage stellen
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  setIsQuestionOpen(false);
                  setIsGuessMode((prev) => !prev);
                }}
                className={`btn-board px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide flex items-center gap-1.5 transition whitespace-nowrap ${
                  isGuessMode
                    ? 'bg-red-600 text-white ring-2 ring-red-400 shadow-md'
                    : 'bg-stone-100 dark:bg-zinc-800 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-zinc-700'
                }`}
              >
                <Target className="w-4 h-4" /> {isGuessMode ? 'Lösungs-Modus AN' : 'Wer ist es? (Lösen)'}
              </button>
            </div>
          </div>
        ) : (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden md:block text-xs font-bold text-stone-400 dark:text-zinc-500">
            {isMyTurn ? 'Karten umklappen oder Zug beenden' : 'Warte auf Mitspieler...'}
          </div>
        )}

        <div className="text-right text-xs leading-tight ml-auto">
          <span className="text-stone-500 dark:text-zinc-400 block text-[10px] uppercase font-bold">
            Gegner: {opponent?.name || 'Spieler 2'}
          </span>
          <span className="font-black text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
            {opponent?.cardCountEliminated || 0} / {state.selectedDeck.characters.length || 24} umgeklappt
          </span>
        </div>
      </footer>

      {/* History Modal Overlay */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-zinc-900 border-2 border-stone-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-4">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200 dark:border-zinc-800">
              <span className="font-black text-sm text-slate-900 dark:text-white uppercase">Spielverlauf</span>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 text-stone-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <GameHistory history={state.history} myPlayerId={playerId} />
          </div>
        </div>
      )}

      {/* Question Dialog Modal */}
      <QuestionDialog
        isOpen={isQuestionOpen && isMyTurn && state.phase === 'QUESTION_TIME'}
        onClose={() => setIsQuestionOpen(false)}
        onAsk={(q, filter) => {
          playSound('click');
          actions.ask(q, filter);
        }}
        deck={state.selectedDeck}
      />

      {/* Answer Modal */}
      <AnswerModal
        isOpen={isAnswerTimeForMe}
        questionText={state.currentQuestion?.text || ''}
        askerName={state.currentQuestion?.askerName || 'Gegner'}
        mySecretCharacter={state.mySecretCharacter}
        onAnswer={(ans) => {
          playSound('click');
          actions.answer(ans);
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
          actions.guess(charId);
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
          actions.rematch();
        }}
        onLeaveRoom={handleLeaveRoom}
      />
    </div>
  );
}
