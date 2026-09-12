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
  Target,
  LogOut,
  Camera,
  Play,
  ArrowRight,
} from 'lucide-react';

export function App() {
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('who_is_it_player_name') || 'Spieler ' + Math.floor(Math.random() * 90 + 10);
  });
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinInputCode, setJoinInputCode] = useState<string>('');

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

  // Audio triggers
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
  const opponent = state?.players.find(p => p.id !== playerId);
  const mySlot = state?.mySlot || 1;

  // 1. WELCOME SCREEN
  if (!roomId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-3 bg-slate-900">
        <div className="w-full max-w-sm bg-slate-900 border-4 border-slate-800 rounded-2xl p-5 shadow-tray text-center">
          {/* Classic Board Game Title */}
          <h1 className="text-4xl font-display font-black text-white tracking-tight uppercase mb-1">
            <span className="text-red-600">Wer</span> <span className="text-stone-300">ist</span> <span className="text-blue-600">es?</span>
          </h1>
          <p className="text-xs text-stone-400 mb-5">
            Das klassische 1v1 Rate-Duell.
          </p>

          <div className="text-left mb-3">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Spielername..."
              className="w-full px-3 py-2 bg-slate-950 border-2 border-slate-700 rounded-lg text-white font-bold text-sm focus:outline-none focus:border-amber-400"
              maxLength={20}
            />
          </div>

          <button
            onClick={handleCreateRoom}
            className="btn-toy w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-display font-black rounded-lg shadow-btn-tactile transition mb-3 text-sm uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Play className="w-4 h-4 fill-current" /> Raum erstellen
          </button>

          <form onSubmit={handleJoinRoom} className="flex gap-1.5 mb-4">
            <input
              type="text"
              value={joinInputCode}
              onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              className="flex-1 px-3 py-2 bg-slate-950 border-2 border-slate-700 rounded-lg text-white font-mono font-bold tracking-widest text-center uppercase text-sm focus:outline-none focus:border-blue-500"
              maxLength={6}
            />
            <button
              type="submit"
              disabled={!joinInputCode.trim()}
              className="btn-toy px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-lg uppercase text-xs"
            >
              Beitreten
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => setIsDeckCreatorOpen(true)}
              className="btn-toy w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" /> Eigene Fotos & Namen hochladen
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
      <div className="min-h-screen flex flex-col bg-slate-900">
        <header className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
          <span className="font-display font-black text-sm uppercase">
            <span className="text-red-500">Wer</span> ist <span className="text-blue-500">es?</span>
          </span>

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

        <main className="flex-1 flex items-center justify-center p-2">
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-stone-100">
      {/* Game Header */}
      <header className="sticky top-0 z-30 px-3 py-2 bg-slate-900 border-b-2 border-slate-800 flex items-center justify-between gap-2 shadow-sm">
        {/* Left: Deck & Room */}
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-sm uppercase">
            <span className="text-red-500">Wer</span> <span className="text-stone-300">ist</span> <span className="text-blue-500">es?</span>
          </span>
          <span className="text-xs bg-slate-950 text-stone-300 font-mono px-1.5 py-0.5 rounded border border-slate-800">
            {roomId}
          </span>
          <span className="text-xs text-stone-400 hidden sm:inline">
            Runde {state?.turnNumber || 1}
          </span>
        </div>

        {/* Center: Turn Status */}
        <div>
          {isMyTurn ? (
            <span className="px-3 py-1 bg-green-600 text-white font-display font-black text-xs uppercase tracking-wider rounded shadow">
              DU BIST AM ZUG
            </span>
          ) : (
            <span className="px-3 py-1 bg-slate-800 text-stone-300 font-bold text-xs rounded">
              {opponent?.name || 'Gegner'} am Zug...
            </span>
          )}
        </div>

        {/* Right: Sound & Leave */}
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
                  setIsQuestionOpen(prev => !prev);
                }}
                className={`btn-toy px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                  isQuestionOpen ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" /> Frage stellen
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  setIsQuestionOpen(false);
                  setIsGuessMode(prev => !prev);
                }}
                className={`btn-toy px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                  isGuessMode ? 'bg-red-600 text-white' : 'bg-slate-800 text-red-400'
                }`}
              >
                <Target className="w-3.5 h-3.5" /> {isGuessMode ? 'Lösungs-Modus AN' : 'Lösen (Tipp)'}
              </button>
            </div>
          </div>
        )}

        {/* Inline Question Shelf (Non-blocking so player can see all cards) */}
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

        {/* Inline Answer Banner (When opponent asks me a question) */}
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
            <span className="text-stone-400 block text-[10px] uppercase">Gegner: {opponent?.name || 'Spieler 2'}</span>
            <span className="font-mono font-bold text-white">
              {opponent?.cardCountEliminated || 0} / {state?.selectedDeck.characters.length || 24} umgeklappt
            </span>
          </div>
        </div>
      </footer>

      {/* Guess Modal for Confirmation */}
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

      <DeckCreatorModal
        isOpen={isDeckCreatorOpen}
        onClose={() => setIsDeckCreatorOpen(false)}
        onSelectCustomDeck={(deck) => setCustomDeck(deck)}
      />
    </div>
  );
}
