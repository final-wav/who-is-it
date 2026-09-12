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
import { AdminDeckEditor } from './components/AdminDeckEditor';
import { Character } from '../../worker/types';
import { getBackendBaseUrl } from './utils/api';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  Target,
  LogOut,
  Play,
  ArrowRight,
  History,
  X,
} from 'lucide-react';

export function App() {
  const isAdmin =
    new URLSearchParams(window.location.search).get('admin') === 'true' ||
    new URLSearchParams(window.location.search).get('admin') === 'decks' ||
    window.location.hash === '#admin';

  if (isAdmin) {
    return <AdminDeckEditor />;
  }

  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('who_is_it_player_name') || 'Spieler ' + Math.floor(Math.random() * 90 + 10);
  });
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinInputCode, setJoinInputCode] = useState<string>('');

  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [guessTargetChar, setGuessTargetChar] = useState<Character | null>(null);
  const [isGuessMode, setIsGuessMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const { muted, toggleMute, playSound } = useAudio();

  const {
    state,
    connected,
    error,
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

  useEffect(() => {
    localStorage.setItem('who_is_it_player_name', playerName);
  }, [playerName]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !roomId) {
      setRoomId(roomParam.toUpperCase());
    }
  }, [roomId]);

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
    if (!state) return;
    const isEliminated = state.myEliminatedIds.includes(charId);
    toggleCard(charId, !isEliminated);
    playSound('flip');
  };

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

  const handleQuickPlay = () => {
    playSound('click');
    const code = 'SOLO';
    setRoomId(code);
    window.history.replaceState({}, '', `?room=${code}`);
  };

  const isMyTurn = state?.currentTurnPlayerId === playerId;
  const isAnswerTimeForMe = state?.phase === 'ANSWER_TIME' && state?.currentQuestion?.askerPlayerId !== playerId;
  const opponent = state?.players.find((p) => p.id !== playerId);
  const mySlot = state?.mySlot || 1;

  // 1. WELCOME SCREEN: Helle, freundliche Spieltisch-Optik in Rot & Blau
  if (!roomId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 bg-amber-50/40 font-display relative select-none">
        <div className="w-full max-w-sm bg-white border-2 border-stone-200 rounded-3xl p-6 sm:p-7 shadow-xl text-center relative z-10">
          <div className="mb-5">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase">
              <span className="text-red-600">Wer </span>
              <span className="text-stone-400">ist </span>
              <span className="text-blue-600">es?</span>
            </h1>
            <p className="text-xs font-bold text-stone-500 mt-1 font-sans">
              Das klassische 1v1 Duell — Rot gegen Blau
            </p>
          </div>

          <div className="text-left mb-3.5">
            <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
              Dein Spielername
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Spielername..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border-2 border-stone-200 rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:border-red-500 transition"
              maxLength={20}
            />
          </div>

          {/* Red Create Room Button */}
          <button
            onClick={handleCreateRoom}
            className="btn-board w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-md text-sm uppercase tracking-wider flex items-center justify-center gap-2 mb-3"
          >
            <Play className="w-4 h-4 fill-current" /> Neues Spiel erstellen (Rot)
          </button>

          {/* Blue Join Form */}
          <form onSubmit={handleJoinRoom} className="flex gap-2 mb-4">
            <input
              type="text"
              value={joinInputCode}
              onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
              placeholder="RAUM-CODE"
              className="flex-1 px-3 py-2.5 bg-stone-50 border-2 border-stone-200 rounded-xl text-slate-900 font-black tracking-widest text-center uppercase text-sm focus:outline-none focus:border-blue-500"
              maxLength={6}
            />
            <button
              type="submit"
              disabled={!joinInputCode.trim()}
              className="btn-board px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black rounded-xl uppercase text-xs shadow-md flex items-center gap-1"
            >
              Beitreten (Blau) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Play Solo Button */}
          <div className="pt-3 border-t border-stone-200">
            <button
              onClick={handleQuickPlay}
              className="btn-board w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs"
            >
              Sofort ausprobieren (Solo-Brett)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. LOBBY VIEW
  if (state?.phase === 'LOBBY') {
    return (
      <div className="min-h-screen flex flex-col bg-amber-50/40 font-display">
        <header className="px-4 py-2.5 bg-white border-b-2 border-stone-200 flex items-center justify-between text-slate-900 shadow-xs">
          <span className="font-black text-base uppercase">
            <span className="text-red-600">Wer</span> <span className="text-stone-400">ist</span> <span className="text-blue-600">es?</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              className="p-1.5 text-stone-500 hover:text-slate-900 rounded-lg hover:bg-stone-100 transition"
              title="Ton"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
            </button>
            <button
              onClick={handleLeaveRoom}
              className="p-1.5 text-stone-500 hover:text-red-600 rounded-lg hover:bg-stone-100 transition"
              title="Verlassen"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-2">
          <Lobby
            roomState={state}
            roomId={roomId}
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
            onStartGame={startGame}
          />
        </main>
      </div>
    );
  }

  // 3. IN-GAME BOARD VIEW (100% viewport fit, KEIN SCROLLEN)
  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden flex flex-col bg-amber-50/40 text-slate-900 font-display select-none">
      {/* Game Header */}
      <header className="h-11 flex-shrink-0 px-3 sm:px-5 bg-white/95 backdrop-blur-md border-b-2 border-stone-200 flex items-center justify-between gap-2 shadow-xs text-slate-900 z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-black text-sm sm:text-base uppercase tracking-tight">
            <span className="text-red-600">Wer</span> <span className="text-stone-400">ist</span> <span className="text-blue-600">es?</span>
          </span>
          <span className="text-xs bg-stone-100 text-slate-800 font-black px-2 py-0.5 rounded-lg border border-stone-300">
            {roomId}
          </span>
          <span className="text-xs text-stone-500 font-bold hidden sm:inline">
            Runde {state?.turnNumber || 1}
          </span>
          {state && state.history.length > 0 && (
            <button
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              className="btn-board px-2.5 py-0.5 bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-700 rounded-lg flex items-center gap-1 border border-stone-300"
            >
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Verlauf</span> ({state.history.length})
            </button>
          )}
        </div>

        <div>
          {isMyTurn ? (
            <span className="px-3 py-1 bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md">
              Du bist am Zug
            </span>
          ) : (
            <span className="px-3 py-1 bg-stone-100 text-stone-600 font-bold text-xs rounded-xl border border-stone-300">
              {opponent?.name || 'Gegner'} am Zug...
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            className="p-1.5 text-stone-500 hover:text-slate-900 rounded-lg hover:bg-stone-100 transition"
            title="Ton"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
          </button>
          <button
            onClick={handleLeaveRoom}
            className="p-1.5 text-stone-500 hover:text-red-600 rounded-lg hover:bg-stone-100 transition"
            title="Verlassen"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Board Area (100% restliche Höhe ohne Scrollen) */}
      <main className="flex-1 min-h-0 w-full max-w-5xl mx-auto px-2 py-1 sm:py-1.5 flex flex-col items-center justify-center overflow-hidden">
        {state && (
          <Board
            characters={state.selectedDeck.characters}
            eliminatedIds={state.myEliminatedIds}
            onToggleCard={handleToggleCard}
            onGuessCharacter={(char) => setGuessTargetChar(char)}
            isGuessMode={isGuessMode}
            phase={state.phase}
            isMyTurn={isMyTurn}
            onEndElimination={() => {
              playSound('click');
              endElimination();
            }}
            playerSlot={mySlot}
          />
        )}
      </main>

      {/* Docked Action & Secret Card Bar at Bottom */}
      <footer className="h-14 flex-shrink-0 bg-white/95 backdrop-blur-md border-t-2 border-stone-200 px-3 sm:px-5 flex items-center justify-between gap-3 shadow-md z-30">
        <SecretCardView secretCharacter={state?.mySecretCharacter || null} />

        {/* Turn Action Buttons centered in bottom bar */}
        {isMyTurn && state?.phase === 'QUESTION_TIME' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playSound('click');
                setIsGuessMode(false);
                setIsQuestionOpen(true);
              }}
              className="btn-board px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
            >
              <HelpCircle className="w-4 h-4" /> Frage stellen
            </button>

            <button
              onClick={() => {
                playSound('click');
                setIsQuestionOpen(false);
                setIsGuessMode((prev) => !prev);
              }}
              className={`btn-board px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide flex items-center gap-1.5 transition ${
                isGuessMode
                  ? 'bg-red-600 text-white ring-2 ring-red-400 shadow-md'
                  : 'bg-stone-100 text-red-600 border border-red-300 hover:bg-red-50'
              }`}
            >
              <Target className="w-4 h-4" /> {isGuessMode ? 'Lösungs-Modus AN' : 'Wer ist es? (Lösen)'}
            </button>
          </div>
        ) : (
          <div className="hidden sm:block text-xs font-bold text-stone-400">
            {isMyTurn ? 'Karten umklappen oder Zug beenden' : 'Warte auf Mitspieler...'}
          </div>
        )}

        <div className="text-right text-xs leading-tight">
          <span className="text-stone-500 block text-[10px] uppercase font-bold">
            Gegner: {opponent?.name || 'Spieler 2'}
          </span>
          <span className="font-black text-amber-600 text-xs sm:text-sm">
            {opponent?.cardCountEliminated || 0} / {state?.selectedDeck.characters.length || 24} umgeklappt
          </span>
        </div>
      </footer>

      {/* History Modal Overlay (verdrängt das Spielbrett nicht) */}
      {isHistoryOpen && state && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-100">
          <div className="bg-white border-2 border-stone-200 rounded-3xl w-full max-w-md shadow-2xl p-4">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200">
              <span className="font-black text-sm text-slate-900 uppercase">Spielverlauf</span>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 text-stone-500 hover:text-slate-900 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <GameHistory history={state.history} myPlayerId={playerId} />
          </div>
        </div>
      )}

      {/* Question Dialog Modal */}
      {state && (
        <QuestionDialog
          isOpen={isQuestionOpen && isMyTurn && state.phase === 'QUESTION_TIME'}
          onClose={() => setIsQuestionOpen(false)}
          onAsk={(q, filter) => {
            playSound('click');
            askQuestion(q, filter);
          }}
          deck={state.selectedDeck}
        />
      )}

      {/* Answer Modal */}
      {state && (
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
      )}

      {/* Guess Modal */}
      {state && (
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
      )}

      {/* Game Over Modal */}
      {state && (
        <GameOverModal
          gameOverData={state.gameOverData}
          myPlayerId={playerId}
          onRematch={() => {
            playSound('click');
            requestRematch();
          }}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}
