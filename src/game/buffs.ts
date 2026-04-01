import { RunBuff, RunBuffId } from './types';

export type BuffRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface RunBuffWithRarity extends RunBuff {
  rarity: BuffRarity;
}

export const RARITY_COLORS: Record<BuffRarity, string> = {
  common: '#B0B0B0',
  rare: '#4488FF',
  epic: '#AA44FF',
  legendary: '#FFD700',
};

export const RARITY_LABELS: Record<BuffRarity, string> = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};

export const RUN_BUFF_POOL: RunBuffWithRarity[] = [
  // Common
  { id: 'torrado', name: 'Grão Torrado', description: '+15% dano em todos os ataques', icon: '🔥', rarity: 'common' },
  { id: 'leite_aveia', name: 'Leite de Aveia', description: 'Escudo que absorve 1 acerto por sala', icon: '🛡️', rarity: 'common' },
  { id: 'chantilly', name: 'Chantilly Extra', description: '+15% velocidade de ataque', icon: '🍦', rarity: 'common' },
  { id: 'termo', name: 'Termo Térmico', description: '+2 corações máximos', icon: '☕', rarity: 'common' },
  { id: 'canela', name: 'Canela em Pó', description: '20% chance de queimar inimigos', icon: '✨', rarity: 'common' },
  { id: 'descaf', name: 'Descafeinado Gelado', description: '+15% velocidade e alcance do dash', icon: '💨', rarity: 'common' },
  // Rare
  { id: 'torrado', name: 'Grão Premium', description: '+25% dano em todos os ataques', icon: '🔥', rarity: 'rare' },
  { id: 'termo', name: 'Garrafa Térmica Pro', description: '+3 corações máximos', icon: '🏺', rarity: 'rare' },
  { id: 'chantilly', name: 'Espuma Cremosa', description: '+30% velocidade de ataque', icon: '🧁', rarity: 'rare' },
  { id: 'descaf', name: 'Nitro Cold Brew', description: '+30% velocidade e dash', icon: '🧊', rarity: 'rare' },
  { id: 'canela', name: 'Pimenta Caiena', description: '35% chance de queimar + dano extra', icon: '🌶️', rarity: 'rare' },
  { id: 'leite_aveia', name: 'Leite Blindado', description: 'Escudo + cura 10 HP ao absorver', icon: '🥛', rarity: 'rare' },
  // Epic
  { id: 'torrado', name: 'Grão Vulcânico', description: '+40% dano', icon: '🌋', rarity: 'epic' },
  { id: 'termo', name: 'Caldeirão Mágico', description: '+5 corações máximos', icon: '🍵', rarity: 'epic' },
  { id: 'descaf', name: 'Jet Fuel', description: '+50% velocidade total', icon: '🚀', rarity: 'epic' },
  { id: 'chantilly', name: 'Turbina de Café', description: '+50% velocidade de ataque', icon: '⚙️', rarity: 'epic' },
  // Legendary
  { id: 'torrado', name: 'Essência do Expresso', description: '+60% dano + projéteis maiores', icon: '💎', rarity: 'legendary' },
  { id: 'termo', name: 'Elixir Imortal', description: '+150 HP + regenera 1 HP/s', icon: '✝️', rarity: 'legendary' },
];

const RARITY_WEIGHTS: Record<BuffRarity, number> = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 5,
};

function pickRarity(): BuffRarity {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) return rarity as BuffRarity;
  }
  return 'common';
}

export function drawRewards(count: number = 3): RunBuffWithRarity[] {
  const result: RunBuffWithRarity[] = [];
  const usedNames = new Set<string>();

  const guaranteeRare = Math.random() < 0.5;

  for (let i = 0; i < count; i++) {
    let rarity = pickRarity();
    if (i === 0 && guaranteeRare && rarity === 'common') {
      rarity = 'rare';
    }

    const candidates = RUN_BUFF_POOL.filter(b => b.rarity === rarity && !usedNames.has(b.name));
    if (candidates.length === 0) {
      const fallback = RUN_BUFF_POOL.filter(b => !usedNames.has(b.name));
      if (fallback.length > 0) {
        const pick = fallback[Math.floor(Math.random() * fallback.length)];
        result.push({ ...pick });
        usedNames.add(pick.name);
      }
      continue;
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    result.push({ ...pick });
    usedNames.add(pick.name);
  }
  return result;
}

// Draw only epic/legendary rewards for secret reward rooms
export function drawHighRarityRewards(count: number = 3): RunBuffWithRarity[] {
  const highPool = RUN_BUFF_POOL.filter(b => b.rarity === 'epic' || b.rarity === 'legendary');
  const result: RunBuffWithRarity[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    const candidates = highPool.filter(b => !usedNames.has(b.name));
    if (candidates.length === 0) break;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    result.push({ ...pick });
    usedNames.add(pick.name);
  }
  return result;
}

export function getBuffMultiplier(rarity: BuffRarity): number {
  switch (rarity) {
    case 'common': return 1;
    case 'rare': return 1.5;
    case 'epic': return 2.5;
    case 'legendary': return 4;
  }
}

export function defaultRunBuffs() {
  return {
    torrado: 0,
    leite_aveia: 0,
    chantilly: 0,
    termo: 0,
    canela: 0,
    descaf: 0,
  };
}
