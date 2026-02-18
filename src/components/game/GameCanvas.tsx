import React, { useRef } from 'react';
import { useGame } from '../../hooks/useGame';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../game/constants';
import HUD from './HUD';
import Lobby from './Lobby';
import GameOver from './GameOver';
import RewardScreen from './RewardScreen';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    phase, gold, hp, maxHp, dashCd, ultCd, runGold, floor, rewardChoices, playerShield,
    startRun, returnToLobby, buyUpgrade, chooseBuff, upgrades,
  } = useGame(canvasRef);

  return (
    <>
      {phase === 'lobby' && (
        <Lobby
          gold={gold}
          upgrades={upgrades}
          onStartRun={startRun}
          onBuyUpgrade={buyUpgrade}
        />
      )}

      <div
        className="flex items-center justify-center min-h-screen bg-coffee-espresso select-none"
        style={{ display: phase === 'lobby' ? 'none' : undefined }}
      >
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
          {(phase === 'playing' || phase === 'reward') && (
            <HUD hp={hp} maxHp={maxHp} gold={runGold} dashCd={dashCd} ultCd={ultCd} floor={floor} shield={playerShield} />
          )}
          {phase === 'reward' && rewardChoices.length > 0 && (
            <RewardScreen choices={rewardChoices} onChoose={chooseBuff} />
          )}
          {(phase === 'gameover' || phase === 'victory') && (
            <GameOver
              victory={phase === 'victory'}
              goldCollected={runGold}
              onReturnToLobby={returnToLobby}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default GameCanvas;
