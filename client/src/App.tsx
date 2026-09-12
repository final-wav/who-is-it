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
import { Character, Deck } from '../../worker/types';
import { getBackendBaseUrl } from './utils/api';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  Target,
  LogOut,
  Play,
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

  const isMyTurn = state?.currentTurnPlayerId === playerId;
  const isAnswerTimeForMe = state?.phase === 'ANSWER_TIME' && state?.currentQuestion?.askerPlayerId !== playerId;
  const opponent = state?.players.find((p) => p.id !== playerId);
  const mySlot = state?.mySlot || 1;

  // 1. WELCOME SCREEN: Authentic Red & Blue MB Toy Box Look
  if (!roomId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-3 bg-slate-950 font-display">
        <div className="w-full max-w-sm bg-slate-900 border-4 border-slate-800 rounded-3xl p-6 shadow-tray-3d text-center">
          {/* Authentic Toy Logo */}
          <div className="mb-4">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase">
              <span className="bg-red-600 text-white px-2.5 py-1 rounded-xl shadow border-2 border-red-700 inline-block transform -rotate-2 mr-1">
                WER
              </span>
              <span className="text-amber-400 mx-1">IST</span>
              <span className="bg-blue-600 text-white px-2.5 py-1 rounded-xl shadow border-2 border-blue-700 inline-block transform rotate-2 ml-1">
                ES?
              </span>
            </h1>
            <p className="text-xs font-bold text-stone-400 mt-2">
              Das originale 1v1 Rate-Duell
            </p>
          </div>

          <div className="text-left mb-3">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Dein Spielername..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-amber-400"
              maxLength={20}
            />
          </div>

          {/* Red Create Room Button */}
          <button
            onClick={handleCreateRoom}
            className="btn-board w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-btn-red transition mb-3 text-sm uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Play className="w-4 h-4 fill-current" /> Raum erstellen
          </button>

          {/* Blue Join Form */}
          <form onSubmit={handleJoinRoom} className="flex gap-2">
            <input
              type="text"
              value={joinInputCode}
              onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
              placeholder="RAUM-CODE"
              className="flex-1 px-3 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-white font-black tracking-widest text-center uppercase text-sm focus:outline-none focus:border-blue-500"
              maxLength={6}
            />
            <button
              type="submit"
              disabled={!joinInputCode.trim()}
              className="btn-board px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black rounded-xl uppercase text-xs shadow-btn-blue"
            >
              Beitreten
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. LOBBY VIEW
  if (state?.phase === 'LOBBY') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 font-display">
        <header className="px-4 py-2.5 bg-slate-900 border-b-2 border-slate-800 flex items-center justify-between text-white">
          <span className="font-black text-base uppercase">
            <span className="text-red-500">Wer</span> <span className="text-stone-300">ist</span> <span className="text-blue-500">es?</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Ton"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>
            <button
              onClick={handleLeaveRoom}
              className="p-1.5 text-stone-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
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

  // 3. IN-GAME BOARD VIEW
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-stone-100 font-display">
      {/* Game Header */}
      <header className="sticky top-0 z-30 px-3 sm:px-6 py-2 bg-slate-900 border-b-2 border-slate-800 flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-black text-sm sm:text-base uppercase">
            <span className="text-red-500">Wer</span> <span className="text-stone-300">ist</span> <span className="text-blue-500">es?</span>
          </span>
          <span className="text-xs bg-slate-950 text-amber-400 font-black px-2 py-0.5 rounded-lg border border-slate-800">
            {roomId}
          </span>
          <span className="text-xs text-stone-400 font-bold hidden sm:inline">
            Runde {state?.turnNumber || 1}
          </span>
        </div>

        <div>
          {isMyTurn ? (
            <span className="px-3 py-1 bg-green-600 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-btn-green animate-pulse">
              DU BIST AM ZUG
            </span>
          ) : (
            <span className="px-3 py-1 bg-slate-800 text-stone-300 font-bold text-xs rounded-lg">
              {opponent?.name || 'Gegner'} am Zug...
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-slate-800"
            title="Ton"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            onClick={handleLeaveRoom}
            className="p-1.5 text-stone-400 hover:text-red-400 rounded hover:bg-slate-800"
            title="Verlassen"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-2 sm:p-3 flex flex-col gap-2 pb-24">
        {/* Turn Action Bar */}
        {isMyTurn && state?.phase === 'QUESTION_TIME' && (
          <div className="w-full flex items-center justify-between p-2 bg-slate-900 border-2 border-slate-800 rounded-xl gap-2">
            <span className="text-xs font-bold text-stone-300">
              Aktion wählen:
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playSound('click');
                  setIsGuessMode(false);
                  setIsQuestionOpen((prev) => !prev);
                }}
                className={`btn-board px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                  isQuestionOpen ? 'bg-amber-400 text-slate-950 shadow-btn-yellow' : 'bg-green-600 text-white shadow-btn-green'
                }`}
              >
                <HelpCircle className="w-4 h-4" /> Frage stellen
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  setIsQuestionOpen(false);
                  setIsGuessMode((prev) => !prev);
                }}
                className={`btn-board px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                  isGuessMode ? 'bg-red-600 text-white ring-2 ring-red-400 shadow-btn-red' : 'bg-slate-800 text-red-400 border border-red-900/60'
                }`}
              >
                <Target className="w-4 h-4" /> {isGuessMode ? 'Lösungs-Modus AN' : 'Lösen (Wer ist es?)'}
              </button>
            </div>
          </div>
        )}

        {/* Inline Question Shelf */}
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

        {/* Inline Answer Banner */}
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

        {/* The 24-Tile Plastic Tray (Red for Slot 1, Blue for Slot 2) */}
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

        {/* Turn History */}
        {state && (
          <div className="w-full mt-2">
            <GameHistory history={state.history} myPlayerId={playerId} />
          </div>
        )}
      </main>

      {/* Docked Secret Card Bar at Bottom */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t-2 border-slate-800 p-2">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <SecretCardView secretCharacter={state?.mySecretCharacter || null} />

          <div className="text-right text-xs">
            <span className="text-stone-400 block text-[10px] uppercase font-bold">Gegner: {opponent?.name || 'Spieler 2'}</span>
            <span className="font-black text-amber-400 text-sm">
              {opponent?.cardCountEliminated || 0} / {state?.selectedDeck.characters.length || 24} umgeklappt
            </span>
          </div>
        </div>
      </footer>

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
