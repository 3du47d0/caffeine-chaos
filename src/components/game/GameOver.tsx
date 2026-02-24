import React from 'react';
import { RoomTime } from '../../game/types';

interface GameOverProps {
  victory: boolean;
  goldCollected: number;
  runTimer: number;
  roomTimes: RoomTime[];
  onReturnToLobby: () => void;
  onRestart: () => void;
}

function formatTime(frames: number): string {
  const totalSeconds = Math.floor(frames / 60);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatSeconds(frames: number): string {
  return `${(frames / 60).toFixed(1)}s`;
}

const GameOver: React.FC<GameOverProps> = ({ victory, goldCollected, runTimer, roomTimes, onReturnToLobby, onRestart }) => {
  const bestRoom = roomTimes.length > 0
    ? roomTimes.reduce((best, rt) => rt.timeFrames < best.timeFrames ? rt : best)
    : null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10 overflow-y-auto">
      <div className="text-center pixel-border rounded-xl p-6 bg-card max-w-md w-full mx-4 my-4">
        {victory ? (
          <>
            <div className="text-5xl mb-3">☕🏆</div>
            <h2 className="font-pixel text-xl text-primary text-glow mb-1">VITÓRIA!</h2>
            <p className="font-retro text-base text-muted-foreground mb-2">
              O Rei Descafeinado foi derrotado!
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-3">💀☕</div>
            <h2 className="font-pixel text-xl text-accent mb-1">GAME OVER</h2>
            <p className="font-retro text-base text-muted-foreground mb-2">
              Você ficou sem cafeína...
            </p>
          </>
        )}

        <div className="font-pixel text-sm text-coffee-gold my-3">
          +{goldCollected} Grãos de Ouro ✦
        </div>

        {/* Run Summary */}
        <div className="bg-background/60 rounded-lg p-4 mb-4 text-left">
          <h3 className="font-pixel text-xs text-primary mb-3 text-center">☕ RESUMO DA CAFETERIA</h3>

          <div className="flex justify-between font-pixel text-xs text-foreground mb-2">
            <span>Tempo Total:</span>
            <span className="text-coffee-gold">{formatTime(runTimer)}</span>
          </div>

          {roomTimes.length > 0 && (
            <div className="border-t border-muted pt-2 mt-2">
              <div className="font-pixel text-foreground/60 mb-1" style={{ fontSize: '8px' }}>
                SALAS LIMPAS
              </div>
              <div className="max-h-28 overflow-y-auto space-y-0.5">
                {roomTimes.map((rt, i) => {
                  const isBest = bestRoom && rt === bestRoom;
                  return (
                    <div
                      key={i}
                      className={`flex justify-between font-pixel text-foreground ${isBest ? 'text-coffee-gold' : ''}`}
                      style={{ fontSize: '9px' }}
                    >
                      <span>
                        {isBest && '⚡ '}A{rt.floor + 1} Sala {rt.room + 1}
                      </span>
                      <span>{formatSeconds(rt.timeFrames)}</span>
                    </div>
                  );
                })}
              </div>
              {bestRoom && (
                <div className="font-pixel text-coffee-gold mt-2 text-center" style={{ fontSize: '9px' }}>
                  ⚡ Melhor: A{bestRoom.floor + 1} Sala {bestRoom.room + 1} — {formatSeconds(bestRoom.timeFrames)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onRestart}
            className="font-pixel text-sm px-5 py-3 bg-secondary text-secondary-foreground rounded-lg
                       hover:scale-105 transition-transform pixel-border"
          >
            REINICIAR RUN
          </button>
          <button
            onClick={onReturnToLobby}
            className="font-pixel text-sm px-5 py-3 bg-primary text-primary-foreground rounded-lg
                       hover:scale-105 transition-transform pixel-border"
          >
            VOLTAR AO CAFÉ
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
