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

  // Render joystick visual
  const joystick = inputManager.joystick;
  const joyDx = joystick.active ? Math.max(-40, Math.min(40, joystick.currentX - joystick.startX)) : 0;
  const joyDy = joystick.active ? Math.max(-40, Math.min(40, joystick.currentY - joystick.startY)) : 0;

  return (
    <>
      {/* Joystick zone hint (left side) */}
      <div className="fixed left-4 bottom-24 w-28 h-28 pointer-events-none z-30 opacity-50">
        <div className="absolute inset-0 rounded-full border-2 border-foreground/30 bg-background/20 backdrop-blur-sm" />
        {joystick.active && (
          <div
            className="absolute w-12 h-12 rounded-full bg-primary/60 border-2 border-primary"
            style={{
              left: `calc(50% - 24px + ${joyDx}px)`,
              top: `calc(50% - 24px + ${joyDy}px)`,
              transition: 'none',
            }}
          />
        )}
        {!joystick.active && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-pixel text-foreground/40" style={{ fontSize: '7px' }}>MOVER</span>
          </div>
        )}
      </div>

      {/* Action buttons (right side) */}
      <div className="fixed right-4 bottom-20 flex flex-col items-center gap-3 z-30">
        {/* Attack button - largest */}
        <button
          className="w-16 h-16 rounded-full bg-accent/50 border-2 border-accent active:bg-accent/80
                     flex items-center justify-center touch-none select-none backdrop-blur-sm"
          onTouchStart={handleButtonStart('shoot')}
          onTouchEnd={handleButtonEnd('shoot')}
          onMouseDown={handleButtonStart('shoot')}
          onMouseUp={handleButtonEnd('shoot')}
        >
          <span className="font-pixel text-accent-foreground text-xs pointer-events-none">ATK</span>
        </button>

        <div className="flex gap-3">
          {/* Dash button */}
          <button
            className="w-12 h-12 rounded-full bg-secondary/50 border-2 border-secondary active:bg-secondary/80
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
            className="w-12 h-12 rounded-full bg-primary/50 border-2 border-primary active:bg-primary/80
                       flex items-center justify-center touch-none select-none backdrop-blur-sm"
            onTouchStart={handleButtonStart('ultimate')}
            onTouchEnd={handleButtonEnd('ultimate')}
            onMouseDown={handleButtonStart('ultimate')}
            onMouseUp={handleButtonEnd('ultimate')}
          >
            <span className="font-pixel text-primary-foreground pointer-events-none" style={{ fontSize: '7px' }}>☕</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default TouchControls;
