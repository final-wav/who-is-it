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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-lg rounded-xl shadow-2xl p-6 sm:p-7 text-center relative">
        {/* Icon & Title */}
        <div className="mb-3">
          <div
            className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center border-2 ${
              isWinner
                ? 'bg-amber-950/80 border-retro-amber text-retro-amber'
                : 'bg-red-950/80 border-retro-red text-retro-red'
            }`}
          >
            {isWinner ? <Trophy className="w-8 h-8" /> : <Frown className="w-8 h-8" />}
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight mb-1">
          {isWinner ? 'Sieg!' : 'Niederlage!'}
        </h2>
        <p className="text-xs sm:text-sm text-stone-300 mb-5 font-sans">
          {isWinner
            ? 'Du hast die Identität deines Gegenübers erfolgreich aufgedeckt.'
            : gameOverData.reason === 'WRONG_GUESS'
            ? 'Ein falscher Lösungsversuch hat das Spiel entschieden.'
            : `${gameOverData.winnerName} hat deine Karte zuerst erraten.`}
        </p>

        {/* Both Cards Revealed */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 mb-5">
          <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block mb-2.5">
            Aufdeckung beider Geheimkarten
          </span>
          <div className="grid grid-cols-2 gap-3">
            {gameOverData.player1Secret && (
              <div className="flex flex-col items-center p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-mono text-stone-400 mb-1">Spieler 1 (Rot)</span>
                <div className="w-14 h-18 sm:w-16 sm:h-20 rounded overflow-hidden border border-slate-700 mb-1">
                  <CharacterAvatar character={gameOverData.player1Secret} />
                </div>
                <span className="text-xs font-bold text-white truncate max-w-[100px]">
                  {gameOverData.player1Secret.name}
                </span>
              </div>
            )}

            {gameOverData.player2Secret && (
              <div className="flex flex-col items-center p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-mono text-stone-400 mb-1">Spieler 2 (Blau)</span>
                <div className="w-14 h-18 sm:w-16 sm:h-20 rounded overflow-hidden border border-slate-700 mb-1">
                  <CharacterAvatar character={gameOverData.player2Secret} />
                </div>
                <span className="text-xs font-bold text-white truncate max-w-[100px]">
                  {gameOverData.player2Secret.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onLeaveRoom}
            className="btn-tactile flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-stone-300 font-mono font-bold rounded-lg border border-slate-700 transition flex items-center justify-center gap-1.5 text-xs uppercase"
          >
            <Home className="w-3.5 h-3.5" /> Tisch verlassen
          </button>
          <button
            onClick={onRematch}
            className="btn-tactile flex-1 py-2.5 px-3 bg-retro-blue hover:bg-retro-blue-dark text-white font-display font-black rounded-lg shadow-tactile transition flex items-center justify-center gap-1.5 text-xs sm:text-sm uppercase tracking-wider"
          >
            <RotateCcw className="w-4 h-4" /> Revanche
          </button>
        </div>
      </div>
    </div>
  );
};
