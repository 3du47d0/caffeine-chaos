import React, { useMemo } from 'react';
import { Upgrades } from '../../game/types';

// ---- Rarity system ----
export type ShopItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

const RARITY_CONFIG: Record<ShopItemRarity, { label: string; color: string; glow: string; costMult: number; weight: number }> = {
  common:    { label: 'Comum',     color: '#B0B0B0', glow: 'none',                        costMult: 1,   weight: 40 },
  uncommon:  { label: 'Incomum',   color: '#4CAF50', glow: '0 0 6px #4CAF5066',           costMult: 1.3, weight: 28 },
  rare:      { label: 'Raro',      color: '#4488FF', glow: '0 0 8px #4488FF66',           costMult: 1.7, weight: 18 },
  epic:      { label: 'Épico',     color: '#AA44FF', glow: '0 0 10px #AA44FF88',          costMult: 2.2, weight: 9 },
  legendary: { label: 'Lendário',  color: '#FFD700', glow: '0 0 12px #FFD70088',          costMult: 3,   weight: 4 },
  mythic:    { label: 'Mítico',    color: '#FF4444', glow: '0 0 14px #FF444488, 0 0 24px #FF444444', costMult: 4, weight: 1 },
};

interface ShopItem {
  id: keyof Upgrades;
  name: string;
  description: string;
  baseCost: number;
  maxLevel: number;
  icon: string;
  rarity: ShopItemRarity;
}

const SHOP_POOL: Omit<ShopItem, 'rarity'>[] = [
  { id: 'maxHpBonus', name: 'Caneca Grande', description: '+1 coração extra', baseCost: 8, maxLevel: 5, icon: '☕' },
  { id: 'damageBonus', name: 'Grãos Fortes', description: '+10% dano', baseCost: 12, maxLevel: 5, icon: '💥' },
  { id: 'speedBonus', name: 'Cafeína Extra', description: '+10% velocidade', baseCost: 10, maxLevel: 3, icon: '⚡' },
  { id: 'dashCdrBonus', name: 'Espresso Duplo', description: '-15% cooldown dash', baseCost: 15, maxLevel: 3, icon: '💨' },
  { id: 'maxHpBonus', name: 'Recipiente Dourado', description: '+1 coração extra (premium)', baseCost: 14, maxLevel: 5, icon: '💛' },
  { id: 'damageBonus', name: 'Moagem Fina', description: '+10% dano concentrado', baseCost: 16, maxLevel: 5, icon: '🔥' },
  { id: 'speedBonus', name: 'Nitro Boost', description: '+10% velocidade pura', baseCost: 13, maxLevel: 3, icon: '🚀' },
  { id: 'dashCdrBonus', name: 'Vapor Pressurizado', description: '-15% cooldown dash turbo', baseCost: 18, maxLevel: 3, icon: '💫' },
];

function rollRarity(): ShopItemRarity {
  const entries = Object.entries(RARITY_CONFIG) as [ShopItemRarity, typeof RARITY_CONFIG[ShopItemRarity]][];
  const total = entries.reduce((s, [, c]) => s + c.weight, 0);
  let roll = Math.random() * total;
  for (const [rarity, config] of entries) {
    roll -= config.weight;
    if (roll <= 0) return rarity;
  }
  return 'common';
}

function generateShopItems(count: number): ShopItem[] {
  const items: ShopItem[] = [];
  const usedIndices = new Set<number>();
  for (let i = 0; i < count; i++) {
    let idx: number;
    do { idx = Math.floor(Math.random() * SHOP_POOL.length); } while (usedIndices.has(idx) && usedIndices.size < SHOP_POOL.length);
    usedIndices.add(idx);
    items.push({ ...SHOP_POOL[idx], rarity: rollRarity() });
  }
  return items;
}

interface ShopScreenProps {
  gold: number;
  upgrades: Upgrades;
  onBuy: (id: keyof Upgrades, cost: number) => boolean;
  onLeave: () => void;
}

const ShopScreen: React.FC<ShopScreenProps> = ({ gold, upgrades, onBuy, onLeave }) => {
  // Generate items once per shop visit
  const shopItems = useMemo(() => generateShopItems(4), []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-2 sm:p-4"
      style={{ background: 'rgba(20, 10, 5, 0.92)' }}>
      <div className="mb-4 sm:mb-6 text-center animate-fade-in">
        <div className="text-3xl sm:text-4xl mb-2">🏪</div>
        <h2 className="font-pixel text-coffee-gold text-glow text-sm sm:text-xl mb-1 tracking-widest">
          LOJINHA DO CAFÉ
        </h2>
        <p className="font-pixel text-foreground/60" style={{ fontSize: '9px' }}>
          Itens com raridades variadas — teste sua sorte!
        </p>
        <div className="font-pixel text-sm text-coffee-gold mt-2">
          Grãos: {gold} ✦
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 px-2 w-full max-w-md">
        {shopItems.map((item, idx) => {
          const level = upgrades[item.id];
          const maxed = level >= item.maxLevel;
          const rConf = RARITY_CONFIG[item.rarity];
          const cost = Math.floor(item.baseCost * rConf.costMult * (level + 1));
          const canAfford = gold >= cost;

          return (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => !maxed && canAfford && onBuy(item.id, cost)}
              disabled={maxed || !canAfford}
              className={`relative flex items-center gap-2 p-3 rounded-lg pixel-border text-left transition-all ${
                maxed
                  ? 'bg-muted/50 opacity-50 cursor-not-allowed'
                  : canAfford
                  ? 'bg-coffee-dark hover:bg-coffee-medium cursor-pointer hover:scale-[1.02] active:scale-95'
                  : 'bg-muted/30 opacity-60 cursor-not-allowed'
              }`}
              style={{
                borderColor: rConf.color,
                boxShadow: canAfford && !maxed ? rConf.glow : 'none',
              }}
            >
              {/* Rarity badge */}
              <div className="absolute -top-2 right-2 px-1.5 py-0.5 rounded font-pixel"
                style={{ fontSize: '6px', background: rConf.color, color: '#000' }}>
                {rConf.label}
              </div>

              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-pixel text-xs truncate" style={{ color: rConf.color }}>
                  {item.name}
                </div>
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
