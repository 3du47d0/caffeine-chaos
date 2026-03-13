import React from 'react';
import { Upgrades } from '../../game/types';
import { IN_RUN_SHOP_ITEMS } from '../../game/constants';

interface ShopScreenProps {
  gold: number;
  upgrades: Upgrades;
  onBuy: (id: keyof Upgrades, cost: number) => boolean;
  onLeave: () => void;
}

const ShopScreen: React.FC<ShopScreenProps> = ({ gold, upgrades, onBuy, onLeave }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-2 sm:p-4"
      style={{ background: 'rgba(20, 10, 5, 0.92)' }}>
      <div className="mb-4 sm:mb-6 text-center animate-fade-in">
        <div className="text-3xl sm:text-4xl mb-2">🏪</div>
        <h2 className="font-pixel text-coffee-gold text-glow text-sm sm:text-xl mb-1 tracking-widest">
          LOJINHA DO CAFÉ
        </h2>
        <p className="font-pixel text-foreground/60" style={{ fontSize: '9px' }}>
          Gaste seus grãos em melhorias para esta run!
        </p>
        <div className="font-pixel text-sm text-coffee-gold mt-2">
          Grãos: {gold} ✦
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 px-2 w-full max-w-md">
        {IN_RUN_SHOP_ITEMS.map((item) => {
          const level = upgrades[item.id];
          const maxed = level >= item.maxLevel;
          const cost = item.cost * (level + 1);
          const canAfford = gold >= cost;

          return (
            <button
              key={item.id}
              onClick={() => !maxed && canAfford && onBuy(item.id, cost)}
              disabled={maxed || !canAfford}
              className={`flex items-center gap-2 p-3 rounded-lg pixel-border text-left transition-all ${
                maxed
                  ? 'bg-muted/50 opacity-50 cursor-not-allowed'
                  : canAfford
                  ? 'bg-coffee-dark hover:bg-coffee-medium cursor-pointer hover:scale-[1.02] active:scale-95'
                  : 'bg-muted/30 opacity-60 cursor-not-allowed'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-pixel text-xs text-foreground truncate">{item.name}</div>
                <div className="font-pixel text-foreground/60" style={{ fontSize: '8px' }}>{item.description}</div>
                <div className="font-pixel text-foreground/40 mt-0.5" style={{ fontSize: '7px' }}>
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

      <button
        onClick={onLeave}
        className="mt-4 sm:mt-6 font-pixel text-xs sm:text-sm px-6 py-3 bg-primary text-primary-foreground rounded-lg
                   hover:scale-105 active:scale-95 transition-transform pixel-border"
      >
        ▶ CONTINUAR
      </button>
    </div>
  );
};

export default ShopScreen;
