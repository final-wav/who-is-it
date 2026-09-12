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
  ArrowRight,
  Plus,
  Camera,
  Grid,
  Clock,
} from 'lucide-react';

export function App() {
  // Navigation & User
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('who_is_it_player_name') || 'Detektiv ' + Math.floor(Math.random() * 90 + 10);
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

  // Keyboard shortcut: M to toggle mute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMute]);

  // Audio trigger on game events
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0e17]">
        <div className="w-full max-w-md bg-slate-900 border-2 border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl text-center">
          {/* Authentic Tactile Logo Box */}
          <div className="w-14 h-14 mx-auto rounded-xl bg-slate-800 border-2 border-retro-blue flex items-center justify-center mb-3 shadow-tactile text-retro-blue">
            <Grid className="w-7 h-7" />
          </div>

          <h1 className="text-3xl font-display font-black text-white tracking-tight uppercase">
            Wer ist es?
          </h1>
          <p className="text-xs text-stone-400 mt-0.5 mb-6 font-sans">
            Das klassische Ausschluss-Duell für 2 Personen.
          </p>

          {/* Name Input */}
          <div className="text-left mb-4">
            <label className="text-[10px] font-mono font-bold text-stone-400 block mb-1 uppercase tracking-wider">
              Dein Spielername
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Name eingeben..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:border-retro-blue transition text-sm"
              maxLength={20}
            />
          </div>

          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            className="btn-tactile w-full py-3 bg-retro-blue hover:bg-retro-blue-dark text-white font-display font-black rounded-lg shadow-tactile transition flex items-center justify-center gap-2 mb-4 text-xs sm:text-sm uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> Neuen Spielraum eröffnen
          </button>

          {/* Join Room Form */}
          <form onSubmit={handleJoinRoom} className="flex gap-2 mb-5">
            <input
              type="text"
              value={joinInputCode}
              onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
              placeholder="RAUM-CODE"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold tracking-widest text-center uppercase focus:outline-none focus:border-retro-blue text-xs sm:text-sm"
              maxLength={6}
            />
            <button
              type="submit"
              disabled={!joinInputCode.trim()}
              className="btn-tactile px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-stone-200 font-mono font-bold rounded-lg border border-slate-700 transition flex items-center justify-center text-xs uppercase"
            >
              Beitreten <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </form>

          {/* Custom Deck Creator Button */}
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => setIsDeckCreatorOpen(true)}
              className="btn-tactile w-full py-2 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-stone-300 font-medium rounded-lg transition flex items-center justify-center gap-1.5 text-xs font-sans"
            >
              <Camera className="w-3.5 h-3.5 text-retro-amber" /> Eigene Fotos & Namen hochladen
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
      <div className="min-h-screen flex flex-col bg-[#0a0e17]">
        {/* Top Mini Bar */}
        <header className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-black text-white text-sm tracking-wide uppercase">
            <Grid className="w-4 h-4 text-retro-blue" />
            <span>Wer ist es?</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-slate-800 transition"
              title={muted ? 'Ton an [M]' : 'Stumm [M]'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-retro-blue" />}
            </button>
            <button
              onClick={handleLeaveRoom}
              className="p-1.5 text-stone-400 hover:text-retro-red rounded hover:bg-slate-800 transition"
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
    <div className="min-h-screen flex flex-col bg-[#0a0e17] text-stone-100">
      {/* Game Header */}
      <header className="sticky top-0 z-30 px-3 sm:px-6 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 shadow-lg">
        {/* Left: Deck & Room Info */}
        <div className="flex items-center gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-white text-sm">
                {state?.selectedDeck.name || 'Wer ist es?'}
              </span>
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-retro-blue px-1.5 py-0.5 rounded border border-slate-700">
                {roomId}
              </span>
            </div>
            <span className="text-[10px] font-mono text-stone-400 block">
              Runde {state?.turnNumber || 1}
            </span>
          </div>
        </div>

        {/* Center: Turn Status */}
        <div className="flex items-center justify-center">
          {isMyTurn ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-retro-green/20 border border-retro-green text-retro-green rounded text-xs font-mono font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-retro-green" />
              <span>DU BIST AM ZUG</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 text-stone-300 rounded text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-stone-400 animate-spin" />
              <span>{opponent?.name || 'Gegner'} am Zug...</span>
            </div>
          )}
        </div>

        {/* Right: Sound & Exit */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-slate-800 transition"
            title={muted ? 'Ton einschalten [M]' : 'Stummschalten [M]'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-retro-blue" />}
          </button>
          <button
            onClick={handleLeaveRoom}
            className="p-1.5 text-stone-400 hover:text-retro-red rounded hover:bg-slate-800 transition"
            title="Raum verlassen"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Playing Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 flex flex-col gap-3 pb-32">
        {/* Turn Action Bar (if my turn & question phase) */}
        {isMyTurn && state?.phase === 'QUESTION_TIME' && (
          <div className="w-full max-w-4xl mx-auto p-3 bg-slate-900 border-2 border-slate-700 rounded-xl shadow-tactile flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-stone-300 font-sans">
              <span className="font-bold text-white block sm:inline mr-2">Aktion wählen:</span>
              Stelle eine Ja/Nein-Frage oder äußere einen Verdacht.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playSound('click');
                  setIsGuessMode(false);
                  setIsQuestionOpen(true);
                }}
                className="btn-tactile px-3.5 py-2 bg-retro-blue hover:bg-retro-blue-dark text-white font-display font-bold text-xs uppercase tracking-wider rounded-lg shadow-tactile flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4" /> Frage stellen
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  setIsGuessMode((prev) => !prev);
                }}
                className={`btn-tactile px-3.5 py-2 font-display font-bold text-xs uppercase tracking-wider rounded-lg transition flex items-center gap-1.5 ${
                  isGuessMode
                    ? 'bg-retro-amber text-slate-950 shadow-tactile'
                    : 'bg-slate-800 hover:bg-slate-700 text-retro-amber border border-retro-amber/60'
                }`}
              >
                <Target className="w-4 h-4" /> {isGuessMode ? 'Verdachts-Modus an' : 'Verdacht äußern'}
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

        {/* Turn History */}
        {state && (
          <div className="w-full max-w-6xl mx-auto">
            <GameHistory history={state.history} myPlayerId={playerId} />
          </div>
        )}
      </main>

      {/* Docked Bottom Bar: Secret Card & Opponent Status */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t-2 border-slate-800 p-2 sm:p-2.5 shadow-2xl backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <SecretCardView secretCharacter={state?.mySecretCharacter || null} />

          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-mono text-stone-400">Gegner: {opponent?.name || 'Spieler 2'}</span>
            <span className="text-xs font-mono font-bold text-white">
              {opponent?.cardCountEliminated || 0} / {state?.selectedDeck.characters.length || 24} umgeklappt
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {state && (
        <>
          <QuestionDialog
            isOpen={isQuestionOpen}
            onClose={() => setIsQuestionOpen(false)}
            onAsk={(q, filter) => {
              playSound('click');
              askQuestion(q, filter);
            }}
            deck={state.selectedDeck}
          />

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

      <DeckCreatorModal
        isOpen={isDeckCreatorOpen}
        onClose={() => setIsDeckCreatorOpen(false)}
        onSelectCustomDeck={(deck) => setCustomDeck(deck)}
      />
    </div>
  );
}
