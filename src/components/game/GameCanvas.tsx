import React, { useRef } from 'react';
import { useGame } from '../../hooks/useGame';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../game/constants';
import HUD from './HUD';
import Lobby from './Lobby';
import GameOver from './GameOver';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    phase, gold, hp, maxHp, dashCd, ultCd, runGold, floor,
    startRun, returnToLobby, buyUpgrade, upgrades,
  } = useGame(canvasRef);

  if (phase === 'lobby') {
    return (
      <Lobby
        gold={gold}
        upgrades={upgrades}
        onStartRun={startRun}
        onBuyUpgrade={buyUpgrade}
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-coffee-espresso select-none">
      <div className="relative" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="pixel-border rounded-lg cursor-crosshair"
          style={{
            width: '100%',
            maxWidth: `${CANVAS_WIDTH}px`,
            imageRendering: 'pixelated',
          }}
        />
        <HUD hp={hp} maxHp={maxHp} gold={runGold} dashCd={dashCd} ultCd={ultCd} floor={floor} />
        {(phase === 'gameover' || phase === 'victory') && (
          <GameOver
            victory={phase === 'victory'}
            goldCollected={runGold}
            onReturnToLobby={returnToLobby}
          />
        )}
      </div>
    </div>
  );
};

export default GameCanvas;
