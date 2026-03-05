import React, { useState } from 'react';
import { Upgrades } from '../../game/types';
import { SHOP_ITEMS } from '../../game/constants';
import AchievementsScreen from './AchievementsScreen';

interface LobbyProps {
  gold: number;
  upgrades: Upgrades;
  onStartRun: () => void;
  onBuyUpgrade: (id: keyof Upgrades, cost: number) => boolean;
  hasGamepad?: boolean;
  isTouchDevice?: boolean;
  onToggleMusic?: () => void;
  musicMuted?: boolean;
}

const Lobby: React.FC<LobbyProps> = ({ gold, upgrades, onStartRun, onBuyUpgrade, hasGamepad, isTouchDevice, onToggleMusic, musicMuted }) => {
  const [showAchievements, setShowAchievements] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-lg w-full text-center px-2">
        <h1 className="font-pixel text-lg sm:text-2xl md:text-3xl text-primary text-glow mb-2 leading-relaxed">
          ☕ CAFE CHAOS
        </h1>
        <p className="font-pixel text-xs text-muted-foreground mb-4 sm:mb-6">The Morning Rush</p>

        <div className="font-pixel text-sm text-coffee-gold mb-4 sm:mb-6">
          Grãos de Ouro: {gold} ✦
        </div>

        <div className="pixel-border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 bg-card">
          <h2 className="font-pixel text-xs sm:text-sm text-primary mb-3">MELHORIAS</h2>
          <div className="grid grid-cols-1 gap-2">
            {SHOP_ITEMS.map((item) => {
              const level = upgrades[item.id];
              const maxed = level >= item.maxLevel;
              const cost = item.cost * (level + 1);
              const canAfford = gold >= cost;

              return (
                <button
                  key={item.id}
                  onClick={() => !maxed && canAfford && onBuyUpgrade(item.id, cost)}
                  disabled={maxed || !canAfford}
                  className={`flex items-center gap-2 p-2 sm:p-3 rounded-md text-left transition-all ${
                    maxed
                      ? 'bg-muted/50 opacity-50 cursor-not-allowed'
                      : canAfford
                      ? 'bg-secondary hover:bg-secondary/80 cursor-pointer hover:scale-[1.02] active:scale-95'
                      : 'bg-muted/30 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-pixel text-xs text-foreground truncate">{item.name}</div>
                    <div className="font-retro text-xs text-muted-foreground">{item.description}</div>
                    <div className="font-pixel text-muted-foreground mt-0.5" style={{ fontSize: '8px' }}>
                      Nv. {level}/{item.maxLevel}
                    </div>
                  </div>
                  {!maxed && (
                    <span className="font-pixel text-xs text-coffee-gold whitespace-nowrap">{cost}✦</span>
                  )}
                  {maxed && (
                    <span className="font-pixel text-xs text-primary">MAX</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mb-4">
          <button
            onClick={onStartRun}
            className="font-pixel text-xs sm:text-sm px-6 py-3 bg-primary text-primary-foreground rounded-lg
                       hover:scale-105 active:scale-95 transition-transform pixel-border
                       hover:shadow-[0_0_30px_hsl(var(--coffee-gold)/0.4)]"
          >
            ▶ INICIAR RUN
          </button>
          <button
            onClick={() => setShowAchievements(true)}
            className="font-pixel text-xs px-4 py-2 sm:py-3 bg-secondary text-secondary-foreground rounded-lg
                       hover:scale-105 active:scale-95 transition-transform pixel-border"
          >
            🏆 CONQUISTAS
          </button>
        </div>

        <div className="mt-4 font-retro text-xs text-muted-foreground space-y-1">
          {isTouchDevice ? (
            <>
              <p>🕹️ Joystick Esquerdo - Mover</p>
              <p>🎯 Joystick Direito - Mirar e Atirar</p>
              <p>💨 Dash | ☕ Ultimate</p>
            </>
          ) : (
            <>
              <p>WASD - Mover | Mouse - Mirar e Atirar</p>
              <p>Espaço - Espresso Shot (Dash) | Q - Chuva de Cappuccino</p>
            </>
          )}
          {hasGamepad && (
            <p className="text-primary mt-2">🎮 Controle detectado!</p>
          )}
        </div>

        {onToggleMusic && (
          <button
            onClick={onToggleMusic}
            className="mt-3 font-pixel text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {musicMuted ? '🔇 Música OFF' : '🔊 Música ON'}
          </button>
        )}
      </div>

      {showAchievements && (
        <AchievementsScreen onClose={() => setShowAchievements(false)} />
      )}
    </div>
  );
};

export default Lobby;
