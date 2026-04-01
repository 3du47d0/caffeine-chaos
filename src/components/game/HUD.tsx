import React from 'react';
import { PLAYER_DASH_COOLDOWN, PLAYER_ULTIMATE_COOLDOWN } from '../../game/constants';

interface HUDProps {
  hp: number;
  maxHp: number;
  gold: number;
  dashCd: number;
  ultCd: number;
  floor: number;
  shield: boolean;
}

const HEART_VALUE = 20; // Each heart = 20 HP

const HUD: React.FC<HUDProps> = ({ hp, maxHp, gold, dashCd, ultCd, floor, shield }) => {
  const dashReady = dashCd <= 0;
  const ultReady = ultCd <= 0;
  const dashPercent = dashReady ? 1 : 1 - dashCd / PLAYER_DASH_COOLDOWN;
  const ultPercent = ultReady ? 1 : 1 - ultCd / PLAYER_ULTIMATE_COOLDOWN;

  // Heart rendering
  const totalHearts = Math.ceil(maxHp / HEART_VALUE);
  const fullHearts = Math.floor(Math.max(0, hp) / HEART_VALUE);
  const remainder = Math.max(0, hp) % HEART_VALUE;
  const hasHalf = remainder >= HEART_VALUE / 2;

  const hearts: ('full' | 'half' | 'empty')[] = [];
  for (let i = 0; i < totalHearts; i++) {
    if (i < fullHearts) hearts.push('full');
    else if (i === fullHearts && hasHalf) hearts.push('half');
    else hearts.push('empty');
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none p-2 sm:p-4 flex items-end justify-between">
      {/* Health - Hearts */}
      <div className="flex items-end gap-1">
        <div className="flex flex-wrap gap-0.5 max-w-[140px] sm:max-w-[200px]">
          {hearts.map((type, i) => (
            <span
              key={i}
              className={`text-sm sm:text-lg leading-none transition-transform duration-100 ${
                type === 'full' && hp <= maxHp * 0.25 ? 'animate-pulse' : ''
              }`}
              style={{
                filter: type === 'empty' ? 'grayscale(1) brightness(0.4)' : undefined,
                opacity: type === 'half' ? 0.7 : 1,
              }}
            >
              {type === 'full' ? '❤️' : type === 'half' ? '💔' : '🖤'}
            </span>
          ))}
        </div>
        {shield && (
          <span className="text-xs sm:text-sm animate-pulse ml-1" title="Escudo ativo">
            🛡️
          </span>
        )}
      </div>

      {/* Gold counter */}
      <div className="flex items-center gap-1 sm:gap-2 font-pixel text-xs sm:text-sm">
        <span className="text-coffee-gold text-glow">☕</span>
        <span className="text-coffee-gold">{gold}</span>
      </div>

      {/* Abilities */}
      <div className="flex gap-2 sm:gap-3">
        <div className="relative w-9 h-9 sm:w-12 sm:h-12 pixel-border rounded-lg overflow-hidden bg-coffee-dark flex items-center justify-center">
          <div
            className="absolute bottom-0 left-0 right-0 bg-secondary/50"
            style={{ height: `${dashPercent * 100}%` }}
          />
          <span className="relative font-pixel text-foreground" style={{ fontSize: '10px' }}>
            {dashReady ? '💨' : `${Math.ceil(dashCd / 60)}s`}
          </span>
          <span className="absolute bottom-0.5 font-pixel text-foreground/50 hidden sm:block" style={{ fontSize: '6px' }}>
            ESPAÇO
          </span>
        </div>

        <div className="relative w-9 h-9 sm:w-12 sm:h-12 pixel-border rounded-lg overflow-hidden bg-coffee-dark flex items-center justify-center">
          <div
            className="absolute bottom-0 left-0 right-0 bg-primary/30"
            style={{ height: `${ultPercent * 100}%` }}
          />
          <span className="relative font-pixel text-foreground" style={{ fontSize: '10px' }}>
            {ultReady ? '☕' : `${Math.ceil(ultCd / 60)}s`}
          </span>
          <span className="absolute bottom-0.5 font-pixel text-foreground/50 hidden sm:block" style={{ fontSize: '6px' }}>
            Q
          </span>
        </div>
      </div>
    </div>
  );
};

export default HUD;
