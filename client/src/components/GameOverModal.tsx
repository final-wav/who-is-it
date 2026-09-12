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
      const duration = 2 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 50,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 50,
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border-4 border-amber-400 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-7 text-center relative">
        {/* Icon & Title */}
        <div className="mb-3">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border-2 ${
              isWinner
                ? 'bg-amber-100 border-amber-400 text-amber-600'
                : 'bg-rose-100 border-rose-400 text-rose-600'
            }`}
          >
            {isWinner ? <Trophy className="w-9 h-9" /> : <Frown className="w-9 h-9" />}
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 tracking-tight mb-1">
          {isWinner ? 'Gewonnen!' : 'Leider verloren!'}
        </h2>
        <p className="text-sm font-bold text-stone-600 mb-5 font-sans">
          {isWinner
            ? 'Du hast die Identität deines Gegenübers erfolgreich erraten!'
            : gameOverData.reason === 'WRONG_GUESS'
            ? 'Ein falscher Lösungsversuch hat das Spiel entschieden.'
            : `${gameOverData.winnerName} hat deine Person zuerst erraten.`}
        </p>

        {/* Both Cards Revealed */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 mb-5">
          <span className="text-xs font-black text-stone-500 uppercase tracking-wider block mb-2.5">
            Aufdeckung beider Geheimkarten
          </span>
          <div className="grid grid-cols-2 gap-3">
            {gameOverData.player1Secret && (
              <div className="flex flex-col items-center p-2 rounded-xl bg-white border border-red-200 shadow-2xs">
                <span className="text-xs font-black text-red-600 mb-1">Spieler 1 (Rot)</span>
                <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-amber-400 mb-1 bg-amber-50">
                  <CharacterAvatar character={gameOverData.player1Secret} />
                </div>
                <span className="text-xs font-black text-slate-900 truncate max-w-[110px]">
                  {gameOverData.player1Secret.name}
                </span>
              </div>
            )}

            {gameOverData.player2Secret && (
              <div className="flex flex-col items-center p-2 rounded-xl bg-white border border-blue-200 shadow-2xs">
                <span className="text-xs font-black text-blue-600 mb-1">Spieler 2 (Blau)</span>
                <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-amber-400 mb-1 bg-amber-50">
                  <CharacterAvatar character={gameOverData.player2Secret} />
                </div>
                <span className="text-xs font-black text-slate-900 truncate max-w-[110px]">
                  {gameOverData.player2Secret.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onLeaveRoom}
            className="btn-board flex-1 py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl border border-stone-300 transition flex items-center justify-center gap-1.5 text-xs uppercase"
          >
            <Home className="w-4 h-4" /> Tisch verlassen
          </button>
          <button
            onClick={onRematch}
            className="btn-board flex-1 py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl shadow-md transition flex items-center justify-center gap-1.5 text-xs sm:text-sm uppercase tracking-wider"
          >
            <RotateCcw className="w-4 h-4" /> Revanche
          </button>
        </div>
      </div>
    </div>
  );
};
