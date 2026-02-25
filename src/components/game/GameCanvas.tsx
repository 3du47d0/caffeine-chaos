import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../../hooks/useGame';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../game/constants';
import HUD from './HUD';
import Lobby from './Lobby';
import GameOver from './GameOver';
import RewardScreen from './RewardScreen';
import TouchControls from './TouchControls';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    phase, gold, hp, maxHp, dashCd, ultCd, runGold, floor, rewardChoices, playerShield,
    runTimer, roomTimes, inputManager,
    startRun, returnToLobby, buyUpgrade, chooseBuff, upgrades,
  } = useGame(canvasRef);

  const [canvasScale, setCanvasScale] = useState(1);
  const [showTouch, setShowTouch] = useState(false);

  // Responsive canvas sizing
  const updateCanvasSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const maxW = container.clientWidth;
    const maxH = container.clientHeight;
    const scaleX = maxW / CANVAS_WIDTH;
    const scaleY = maxH / CANVAS_HEIGHT;
    const scale = Math.min(scaleX, scaleY, 2); // cap at 2x
    setCanvasScale(scale);
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    // Detect touch
    setShowTouch(inputManager.isTouchDevice);
    const checkTouch = () => setShowTouch(inputManager.isTouchDevice);
    window.addEventListener('touchstart', checkTouch, { once: true });
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [updateCanvasSize, inputManager]);

  // Prevent pull-to-refresh and scroll on mobile when playing
  useEffect(() => {
    if (phase !== 'lobby') {
      const prevent = (e: TouchEvent) => e.preventDefault();
      document.body.style.overflow = 'hidden';
      document.addEventListener('touchmove', prevent, { passive: false });
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('touchmove', prevent);
      };
    }
  }, [phase]);

  return (
    <>
      {phase === 'lobby' && (
        <Lobby
          gold={gold}
          upgrades={upgrades}
          onStartRun={startRun}
          onBuyUpgrade={buyUpgrade}
          hasGamepad={inputManager.hasGamepad()}
          isTouchDevice={showTouch}
        />
      )}

      <div
        ref={containerRef}
        className="flex items-center justify-center w-screen h-screen bg-coffee-espresso select-none overflow-hidden"
        style={{ display: phase === 'lobby' ? 'none' : undefined }}
      >
        <div className="relative" style={{ width: CANVAS_WIDTH * canvasScale, height: CANVAS_HEIGHT * canvasScale }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="pixel-border rounded-lg cursor-crosshair w-full h-full"
            style={{ imageRendering: 'pixelated' }}
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
              runTimer={runTimer}
              roomTimes={roomTimes}
              onReturnToLobby={returnToLobby}
              onRestart={startRun}
            />
          )}
        </div>

        {/* Touch controls overlay */}
        {showTouch && (phase === 'playing') && (
          <TouchControls inputManager={inputManager} />
        )}
      </div>
    </>
  );
};

export default GameCanvas;
