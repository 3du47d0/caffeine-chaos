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

const HUD: React.FC<HUDProps> = ({ hp, maxHp, gold, dashCd, ultCd, floor, shield }) => {
  const hpPercent = Math.max(0, hp / maxHp);
  const dashReady = dashCd <= 0;
  const ultReady = ultCd <= 0;
  const dashPercent = dashReady ? 1 : 1 - dashCd / PLAYER_DASH_COOLDOWN;
  const ultPercent = ultReady ? 1 : 1 - ultCd / PLAYER_ULTIMATE_COOLDOWN;

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none p-4 flex items-end justify-between">
      {/* Health - Coffee Mug */}
      <div className="flex items-end gap-3">
        <div className="relative w-16 h-20">
          <div className="absolute inset-0 rounded-b-lg pixel-border bg-coffee-dark overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-200"
              style={{
                height: `${hpPercent * 100}%`,
                background: hpPercent > 0.5
                  ? 'linear-gradient(180deg, #8B4513 0%, #5C3D2E 100%)'
                  : hpPercent > 0.25
                  ? 'linear-gradient(180deg, #B8860B 0%, #8B4513 100%)'
                  : 'linear-gradient(180deg, #C0392B 0%, #8B0000 100%)',
              }}
            />
            {hpPercent > 0.5 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-foreground/40 text-xs animate-pulse">
                ～～
              </div>
            )}
          </div>
          <div className="absolute right-[-10px] top-4 w-3 h-8 border-2 border-primary rounded-r-full" />
          {/* Shield indicator */}
          {shield && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm animate-pulse" title="Escudo ativo">
              🛡️
            </div>
          )}
        </div>
        <div className="font-pixel text-xs text-foreground">
          {Math.max(0, Math.ceil(hp))}/{maxHp}
        </div>
      </div>

      {/* Gold counter */}
      <div className="flex items-center gap-2 font-pixel text-sm">
        <span className="text-coffee-gold text-glow">☕</span>
        <span className="text-coffee-gold">{gold}</span>
      </div>

      {/* Abilities */}
      <div className="flex gap-3">
        <div className="relative w-12 h-12 pixel-border rounded-lg overflow-hidden bg-coffee-dark flex items-center justify-center">
          <div
            className="absolute bottom-0 left-0 right-0 bg-secondary/50"
            style={{ height: `${dashPercent * 100}%` }}
          />
          <span className="relative font-pixel text-xs text-foreground">
            {dashReady ? '💨' : `${Math.ceil(dashCd / 60)}s`}
          </span>
          <span className="absolute bottom-0.5 font-pixel text-foreground/50" style={{ fontSize: '6px' }}>
            ESPAÇO
          </span>
        </div>

        <div className="relative w-12 h-12 pixel-border rounded-lg overflow-hidden bg-coffee-dark flex items-center justify-center">
          <div
            className="absolute bottom-0 left-0 right-0 bg-primary/30"
            style={{ height: `${ultPercent * 100}%` }}
          />
          <span className="relative font-pixel text-xs text-foreground">
            {ultReady ? '☕' : `${Math.ceil(ultCd / 60)}s`}
          </span>
          <span className="absolute bottom-0.5 font-pixel text-foreground/50" style={{ fontSize: '6px' }}>
            Q
          </span>
        </div>
      </div>
    </div>
  );
};

export default HUD;
