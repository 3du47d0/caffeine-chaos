import React, { useCallback } from 'react';
import { InputManager } from '../../game/input';

interface TouchControlsProps {
  inputManager: InputManager;
}

const TouchControls: React.FC<TouchControlsProps> = ({ inputManager }) => {
  const handleButtonStart = useCallback((button: 'shoot' | 'dash' | 'ultimate') => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    inputManager.setTouchButton(button, true);
  }, [inputManager]);

  const handleButtonEnd = useCallback((button: 'shoot' | 'dash' | 'ultimate') => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    inputManager.setTouchButton(button, false);
  }, [inputManager]);

  const moveJoy = inputManager.joystick;
  const moveDx = moveJoy.active ? Math.max(-40, Math.min(40, moveJoy.currentX - moveJoy.startX)) : 0;
  const moveDy = moveJoy.active ? Math.max(-40, Math.min(40, moveJoy.currentY - moveJoy.startY)) : 0;

  const aimJoy = inputManager.aimJoystick;
  const aimDx = aimJoy.active ? Math.max(-40, Math.min(40, aimJoy.currentX - aimJoy.startX)) : 0;
  const aimDy = aimJoy.active ? Math.max(-40, Math.min(40, aimJoy.currentY - aimJoy.startY)) : 0;

  return (
    <>
      {/* Left joystick - Movement */}
      <div className="fixed left-3 bottom-16 w-24 h-24 sm:w-28 sm:h-28 pointer-events-none z-30 opacity-60">
        <div className="absolute inset-0 rounded-full border-2 border-foreground/30 bg-background/20 backdrop-blur-sm" />
        {moveJoy.active && (
          <div
            className="absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/60 border-2 border-primary"
            style={{
              left: `calc(50% - 20px + ${moveDx}px)`,
              top: `calc(50% - 20px + ${moveDy}px)`,
              transition: 'none',
            }}
          />
        )}
        {!moveJoy.active && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-pixel text-foreground/40" style={{ fontSize: '6px' }}>MOVER</span>
          </div>
        )}
      </div>

      {/* Right joystick - Aim & Shoot */}
      <div className="fixed right-3 bottom-16 w-24 h-24 sm:w-28 sm:h-28 pointer-events-none z-30 opacity-60">
        <div className="absolute inset-0 rounded-full border-2 border-accent/40 bg-background/20 backdrop-blur-sm" />
        {aimJoy.active && (
          <div
            className="absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/60 border-2 border-accent"
            style={{
              left: `calc(50% - 20px + ${aimDx}px)`,
              top: `calc(50% - 20px + ${aimDy}px)`,
              transition: 'none',
            }}
          />
        )}
        {!aimJoy.active && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-pixel text-foreground/40" style={{ fontSize: '6px' }}>MIRAR</span>
          </div>
        )}
      </div>

      {/* Action buttons - above right joystick */}
      <div className="fixed right-2 bottom-44 sm:bottom-48 flex gap-2 z-30" data-touch-button>
        {/* Dash button */}
        <button
          data-touch-button
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-secondary/50 border-2 border-secondary active:bg-secondary/80
                     flex items-center justify-center touch-none select-none backdrop-blur-sm"
          onTouchStart={handleButtonStart('dash')}
          onTouchEnd={handleButtonEnd('dash')}
          onMouseDown={handleButtonStart('dash')}
          onMouseUp={handleButtonEnd('dash')}
        >
          <span className="font-pixel text-secondary-foreground pointer-events-none" style={{ fontSize: '7px' }}>💨</span>
        </button>

        {/* Ultimate button */}
        <button
          data-touch-button
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary/50 border-2 border-primary active:bg-primary/80
                     flex items-center justify-center touch-none select-none backdrop-blur-sm"
          onTouchStart={handleButtonStart('ultimate')}
          onTouchEnd={handleButtonEnd('ultimate')}
          onMouseDown={handleButtonStart('ultimate')}
          onMouseUp={handleButtonEnd('ultimate')}
        >
          <span className="font-pixel text-primary-foreground pointer-events-none" style={{ fontSize: '7px' }}>☕</span>
        </button>
      </div>
    </>
  );
};

export default TouchControls;
