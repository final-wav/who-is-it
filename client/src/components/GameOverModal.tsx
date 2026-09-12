import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SanitizedRoomState } from '../../../worker/types';
import { CharacterAvatar } from './CharacterAvatar';
import { Trophy, Frown, RotateCcw, Home } from 'lucide-react';

interface GameOverModalProps {
  gameOverData: SanitizedRoomState['gameOverData'];
  myPlayerId: string;
  onRematch: () => void;
  onLeaveRoom: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameOverData,
  myPlayerId,
  onRematch,
  onLeaveRoom,
}) => {
  if (!gameOverData) return null;

  const isWinner = gameOverData.winnerId === myPlayerId;

  useEffect(() => {
    if (isWinner) {
      // Fire victory confetti cannons
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isWinner]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Glow effect */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40 ${
            isWinner ? 'bg-amber-400' : 'bg-rose-600'
          }`}
        />

        {/* Icon & Title */}
        <div className="relative mb-3">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl flex items-center justify-center shadow-2xl ${
              isWinner
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950'
                : 'bg-gradient-to-tr from-rose-600 to-red-400 text-white'
            }`}
          >
            {isWinner ? <Trophy className="w-10 h-10" /> : <Frown className="w-10 h-10" />}
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
          {isWinner ? 'Du hast gewonnen!' : 'Niederlage!'}
        </h2>
        <p className="text-sm text-slate-300 mb-6">
          {isWinner
            ? 'Genial kombiniert! Du hast die geheime Identität deines Gegners enttarnt.'
            : gameOverData.reason === 'WRONG_GUESS'
            ? 'Ein falscher Lösungsversuch hat das Spiel entschieden.'
            : `${gameOverData.winnerName} hat deine Identität erraten.`}
        </p>

        {/* Secret Cards Reveal */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Aufdeckung der geheimen Karten
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {gameOverData.player1Secret && (
              <div className="flex flex-col items-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 mb-1.5">Spieler 1</span>
                <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border border-slate-700 mb-1.5">
                  <CharacterAvatar character={gameOverData.player1Secret} />
                </div>
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px]">
                  {gameOverData.player1Secret.name}
                </span>
              </div>
            )}

            {gameOverData.player2Secret && (
              <div className="flex flex-col items-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 mb-1.5">Spieler 2</span>
                <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border border-slate-700 mb-1.5">
                  <CharacterAvatar character={gameOverData.player2Secret} />
                </div>
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px]">
                  {gameOverData.player2Secret.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onLeaveRoom}
            className="flex-1 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
          >
            <Home className="w-4 h-4" /> Raum verlassen
          </button>
          <button
            onClick={onRematch}
            className="flex-1 py-3.5 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-sky-500/25 transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" /> Revanche / Nochmal
          </button>
        </div>
      </div>
    </div>
  );
};
