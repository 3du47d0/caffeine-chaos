import React from 'react';
import { Upgrades } from '../../game/types';
import { SHOP_ITEMS } from '../../game/constants';

interface LobbyProps {
  gold: number;
  upgrades: Upgrades;
  onStartRun: () => void;
  onBuyUpgrade: (id: keyof Upgrades, cost: number) => boolean;
}

const Lobby: React.FC<LobbyProps> = ({ gold, upgrades, onStartRun, onBuyUpgrade }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-lg w-full text-center">
        {/* Title */}
        <h1 className="font-pixel text-2xl md:text-3xl text-primary text-glow mb-2 leading-relaxed">
          ☕ CAFE CHAOS
        </h1>
        <p className="font-pixel text-xs text-muted-foreground mb-8">The Morning Rush</p>

        {/* Gold */}
        <div className="font-pixel text-sm text-coffee-gold mb-8">
          Grãos de Ouro: {gold} ✦
        </div>

        {/* Upgrades Shop */}
        <div className="pixel-border rounded-lg p-4 mb-8 bg-card">
          <h2 className="font-pixel text-sm text-primary mb-4">MELHORIAS</h2>
          <div className="grid grid-cols-1 gap-3">
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
                  className={`flex items-center gap-3 p-3 rounded-md text-left transition-all ${
                    maxed
                      ? 'bg-muted/50 opacity-50 cursor-not-allowed'
                      : canAfford
                      ? 'bg-secondary hover:bg-secondary/80 cursor-pointer hover:scale-[1.02]'
                      : 'bg-muted/30 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-pixel text-xs text-foreground">{item.name}</div>
                    <div className="font-retro text-sm text-muted-foreground">{item.description}</div>
                    <div className="font-pixel text-muted-foreground mt-1" style={{ fontSize: '8px' }}>
                      Nv. {level}/{item.maxLevel}
                    </div>
                  </div>
                  {!maxed && (
                    <span className="font-pixel text-xs text-coffee-gold">{cost}✦</span>
                  )}
                  {maxed && (
                    <span className="font-pixel text-xs text-primary">MAX</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={onStartRun}
          className="font-pixel text-sm px-8 py-4 bg-primary text-primary-foreground rounded-lg
                     hover:scale-105 transition-transform pixel-border
                     hover:shadow-[0_0_30px_hsl(var(--coffee-gold)/0.4)]"
        >
          ▶ INICIAR RUN
        </button>

        {/* Controls */}
        <div className="mt-8 font-retro text-sm text-muted-foreground space-y-1">
          <p>WASD - Mover | Mouse - Mirar e Atirar</p>
          <p>Espaço - Espresso Shot (Dash) | Q - Chuva de Cappuccino</p>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
