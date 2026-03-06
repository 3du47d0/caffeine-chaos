import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../../hooks/useGame';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../game/constants';
import HUD from './HUD';
import Lobby from './Lobby';
import GameOver from './GameOver';
import RewardScreen from './RewardScreen';
import TouchControls from './TouchControls';
import AchievementNotification from './AchievementNotification';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    phase, gold, hp, maxHp, dashCd, ultCd, runGold, floor, rewardChoices, playerShield,
    runTimer, roomTimes, inputManager, isBossRoom,
    startRun, returnToLobby, buyUpgrade, chooseBuff, toggleMusic,
    upgrades, unlockedAchievement, clearAchievementNotification, musicMuted,
  } = useGame(canvasRef);

  const [canvasScale, setCanvasScale] = useState(1);
  const [showTouch, setShowTouch] = useState(false);

  const updateCanvasSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const maxW = container.clientWidth;
    const maxH = container.clientHeight;
    const scaleX = maxW / CANVAS_WIDTH;
    const scaleY = maxH / CANVAS_HEIGHT;
    const scale = Math.min(scaleX, scaleY, 3);
    setCanvasScale(scale);
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    setShowTouch(inputManager.isTouchDevice);
    const checkTouch = () => setShowTouch(inputManager.isTouchDevice);
    window.addEventListener('touchstart', checkTouch, { once: true });
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [updateCanvasSize, inputManager]);

  useEffect(() => {
    if (phase !== 'lobby') {
      // Force a layout recalculation after the container becomes visible
      requestAnimationFrame(() => {
        updateCanvasSize();
      });

      const prevent = (e: TouchEvent) => e.preventDefault();
      document.body.style.overflow = 'hidden';
      document.addEventListener('touchmove', prevent, { passive: false });
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('touchmove', prevent);
      };
    }
  }, [phase, updateCanvasSize]);

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
          onToggleMusic={toggleMusic}
          musicMuted={musicMuted}
        />
      )}

      <div
        ref={containerRef}
        className="flex items-center justify-center w-screen h-[100dvh] bg-coffee-espresso select-none overflow-hidden"
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
          {(phase === 'gameover' || phase === 'victory' || phase === 'secret_victory') && (
            <GameOver
              victory={phase === 'victory' || phase === 'secret_victory'}
              secretVictory={phase === 'secret_victory'}
              goldCollected={runGold}
              runTimer={runTimer}
              roomTimes={roomTimes}
              onReturnToLobby={returnToLobby}
              onRestart={startRun}
            />
          )}
        </div>

        {showTouch && (phase === 'playing') && (
          <TouchControls inputManager={inputManager} />
        )}

        {/* Music toggle button */}
        <button
          onClick={toggleMusic}
          className="fixed top-2 right-2 z-40 w-8 h-8 rounded-full bg-background/50 backdrop-blur-sm
                     flex items-center justify-center text-foreground/60 hover:text-foreground
                     border border-border/30 transition-colors"
          style={{ fontSize: '14px' }}
        >
          {musicMuted ? '🔇' : '🔊'}
        </button>
      </div>

      <AchievementNotification
        achievement={unlockedAchievement}
        onDone={clearAchievementNotification}
      />
    </>
  );
};

export default GameCanvas;
