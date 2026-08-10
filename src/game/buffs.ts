import { RunBuff, RunBuffId, BuffCategory, RunBuffs } from './types';
import { loadMeta, unlockedItemTiers } from './meta';

export type BuffRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface RunBuffWithRarity extends RunBuff {
  rarity: BuffRarity;
  category: BuffCategory;
}

export const RARITY_COLORS: Record<BuffRarity, string> = {
  common: '#B0B0B0',
  uncommon: '#5FD35F',
  rare: '#4488FF',
  epic: '#AA44FF',
  legendary: '#FFD700',
};

export const RARITY_LABELS: Record<BuffRarity, string> = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};

export const CATEGORY_LABELS: Record<BuffCategory, string> = {
  offensive: 'Ofensivo',
  defensive: 'Defensivo',
  mobility: 'Mobilidade',
  special: 'Especial',
};

export const CATEGORY_ICONS: Record<BuffCategory, string> = {
  offensive: '⚔',
  defensive: '🛡',
  mobility: '💨',
  special: '🌟',
};

/**
 * Item pool. Each entry stacks: picking the same id twice doubles its effect.
 * Higher rarities are stronger but rarer — they should open new playstyles,
 * never trivialise the run.
 */
export const RUN_BUFF_POOL: RunBuffWithRarity[] = [
  // ---------- COMMON ----------
  { id: 'torrado', name: 'Grão Torrado', description: '+15% de dano', icon: '🔥', rarity: 'common', category: 'offensive' },
  { id: 'chantilly', name: 'Chantilly Extra', description: '+12% velocidade de ataque', icon: '🍦', rarity: 'common', category: 'offensive' },
  { id: 'critico', name: 'Grão Quebradiço', description: '+7% chance de crítico', icon: '🎯', rarity: 'common', category: 'offensive' },
  { id: 'termo', name: 'Termo Térmico', description: '+1 coração máximo', icon: '☕', rarity: 'common', category: 'defensive' },
  { id: 'blindagem', name: 'Tampa Reforçada', description: '-7% de dano recebido', icon: '🥉', rarity: 'common', category: 'defensive' },
  { id: 'descaf', name: 'Gelado Rápido', description: '+12% de velocidade', icon: '💨', rarity: 'common', category: 'mobility' },
  { id: 'ima', name: 'Bandeja Magnética', description: 'Atrai itens próximos', icon: '🧲', rarity: 'common', category: 'mobility' },

  // ---------- UNCOMMON ----------
  { id: 'canela', name: 'Canela em Pó', description: '18% de chance de queimar', icon: '✨', rarity: 'uncommon', category: 'offensive' },
  { id: 'torrado', name: 'Torra Escura', description: '+22% de dano', icon: '🌑', rarity: 'uncommon', category: 'offensive' },
  { id: 'critico', name: 'Mira de Barista', description: '+12% chance de crítico', icon: '🔎', rarity: 'uncommon', category: 'offensive' },
  { id: 'leite_aveia', name: 'Leite de Aveia', description: 'Escudo que absorve 1 acerto por sala', icon: '🛡️', rarity: 'uncommon', category: 'defensive' },
  { id: 'termo', name: 'Garrafa Térmica', description: '+2 corações máximos', icon: '🏺', rarity: 'uncommon', category: 'defensive' },
  { id: 'regen', name: 'Infusão Lenta', description: 'Regenera 1 HP a cada 3s', icon: '🌿', rarity: 'uncommon', category: 'defensive' },
  { id: 'fantasma', name: 'Passo de Vapor', description: '+25% de dano por 1.5s após o dash', icon: '👻', rarity: 'uncommon', category: 'mobility' },
  { id: 'descaf', name: 'Nitro Cold Brew', description: '+20% velocidade e dash mais longo', icon: '🧊', rarity: 'uncommon', category: 'mobility' },

  // ---------- RARE ----------
  { id: 'chantilly', name: 'Espuma Cremosa', description: '+25% velocidade de ataque', icon: '🧁', rarity: 'rare', category: 'offensive' },
  { id: 'canela', name: 'Pimenta Caiena', description: '30% de queimar + dano extra', icon: '🌶️', rarity: 'rare', category: 'offensive' },
  { id: 'ricochete', name: 'Grão Perfurante', description: 'Seus tiros atravessam 1 inimigo', icon: '🔩', rarity: 'rare', category: 'offensive' },
  { id: 'adrenalina', name: 'Turno Dobrado', description: '+30% de dano com pouca vida', icon: '⏳', rarity: 'rare', category: 'special' },
  { id: 'vampiro', name: 'Coador Sedento', description: 'Recupera 2 HP por abate', icon: '🩸', rarity: 'rare', category: 'special' },
  { id: 'blindagem', name: 'Avental de Couro', description: '-14% de dano recebido', icon: '🥋', rarity: 'rare', category: 'defensive' },
  { id: 'sorte', name: 'Trevo de Café', description: '+20% de ouro e itens melhores', icon: '🍀', rarity: 'rare', category: 'special' },

  // ---------- EPIC ----------
  { id: 'torrado', name: 'Grão Vulcânico', description: '+40% de dano', icon: '🌋', rarity: 'epic', category: 'offensive' },
  { id: 'termo', name: 'Caldeirão Mágico', description: '+4 corações máximos', icon: '🍵', rarity: 'epic', category: 'defensive' },
  { id: 'critico', name: 'Olho do Torrador', description: '+20% de crítico', icon: '👁️', rarity: 'epic', category: 'offensive' },
  { id: 'fantasma', name: 'Esquiva Perfeita', description: '+45% de dano por 1.5s após o dash', icon: '🌀', rarity: 'epic', category: 'mobility' },
  { id: 'ricochete', name: 'Bala de Expresso', description: 'Tiros atravessam 2 inimigos', icon: '☄️', rarity: 'epic', category: 'offensive' },
  { id: 'adrenalina', name: 'Último Gole', description: '+55% de dano com pouca vida', icon: '💢', rarity: 'epic', category: 'special' },

  // ---------- LEGENDARY ----------
  { id: 'torrado', name: 'Essência do Expresso', description: '+60% de dano e projéteis maiores', icon: '💎', rarity: 'legendary', category: 'offensive' },
  { id: 'termo', name: 'Elixir Imortal', description: '+5 corações e regeneração contínua', icon: '✝️', rarity: 'legendary', category: 'defensive' },
  { id: 'vampiro', name: 'Sifão Eterno', description: 'Recupera 5 HP por abate', icon: '🦇', rarity: 'legendary', category: 'special' },
  { id: 'sorte', name: 'Grão Dourado', description: '+50% de ouro e raridades muito melhores', icon: '🏆', rarity: 'legendary', category: 'special' },
];

const RARITY_WEIGHTS: Record<BuffRarity, number> = {
  common: 40,
  uncommon: 27,
  rare: 19,
  epic: 10,
  legendary: 4,
};

const RARITY_ORDER: BuffRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

function availableRarities(): BuffRarity[] {
  const tiers = unlockedItemTiers(loadMeta());
  return RARITY_ORDER.filter(r => {
    if (r === 'epic') return tiers.epic;
    if (r === 'legendary') return tiers.legendary;
    return true;
  });
}

/** luck shifts the roll towards better rarities without guaranteeing them */
function pickRarity(luck = 0, allowed = availableRarities()): BuffRarity {
  let total = 0;
  const weights: number[] = [];
  for (const r of allowed) {
    const idx = RARITY_ORDER.indexOf(r);
    const w = RARITY_WEIGHTS[r] * (1 + luck * idx * 0.35);
    weights.push(w);
    total += w;
  }
  let roll = Math.random() * total;
  for (let i = 0; i < allowed.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return allowed[i];
  }
  return allowed[0] ?? 'common';
}

function drawFrom(pool: RunBuffWithRarity[], count: number, luck = 0, minRarity?: BuffRarity): RunBuffWithRarity[] {
  const allowed = availableRarities().filter(r =>
    !minRarity || RARITY_ORDER.indexOf(r) >= RARITY_ORDER.indexOf(minRarity),
  );
  const usable = allowed.length > 0 ? allowed : availableRarities();
  const result: RunBuffWithRarity[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    const rarity = pickRarity(luck, usable);
    let candidates = pool.filter(b => b.rarity === rarity && !usedNames.has(b.name));
    if (candidates.length === 0) {
      candidates = pool.filter(b => usable.includes(b.rarity) && !usedNames.has(b.name));
    }
    if (candidates.length === 0) break;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    result.push({ ...pick });
    usedNames.add(pick.name);
  }
  return result;
}

/** Standard 1-of-3 reward after a boss. */
export function drawRewards(count: number = 3, luck = 0): RunBuffWithRarity[] {
  return drawFrom(RUN_BUFF_POOL, count, luck);
}

/** Chest rewards — wooden chests skew common/rare, golden ones rare+ . */
export function drawChestRewards(kind: 'wooden' | 'golden', count: number = 3, luck = 0): RunBuffWithRarity[] {
  if (kind === 'golden') return drawFrom(RUN_BUFF_POOL, count, luck + 0.8, 'rare');
  return drawFrom(RUN_BUFF_POOL, count, luck + 0.2);
}

/** Only epic/legendary — used by the mysterious portal room. */
export function drawHighRarityRewards(count: number = 3): RunBuffWithRarity[] {
  const tiers = unlockedItemTiers(loadMeta());
  let highPool = RUN_BUFF_POOL.filter(b =>
    (b.rarity === 'epic' && tiers.epic) || (b.rarity === 'legendary' && tiers.legendary),
  );
  if (highPool.length < count) {
    highPool = RUN_BUFF_POOL.filter(b => b.rarity === 'rare' || highPool.includes(b));
  }
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

/** Per-stack strength of an item, scaled by its rarity. */
export function getBuffMultiplier(rarity: BuffRarity): number {
  switch (rarity) {
    case 'common': return 1;
    case 'uncommon': return 1.35;
    case 'rare': return 1.8;
    case 'epic': return 2.5;
    case 'legendary': return 3.5;
  }
}

export function defaultRunBuffs(): RunBuffs {
  return {
    torrado: 0,
    leite_aveia: 0,
    chantilly: 0,
    termo: 0,
    canela: 0,
    descaf: 0,
    critico: 0,
    ricochete: 0,
    adrenalina: 0,
    blindagem: 0,
    regen: 0,
    vampiro: 0,
    fantasma: 0,
    ima: 0,
    sorte: 0,
  };
}

export const BUFF_META: Record<RunBuffId, { icon: string; label: string; category: BuffCategory }> = {
  torrado: { icon: '🔥', label: 'Dano', category: 'offensive' },
  chantilly: { icon: '🍦', label: 'Cadência', category: 'offensive' },
  canela: { icon: '✨', label: 'Queimadura', category: 'offensive' },
  critico: { icon: '🎯', label: 'Crítico', category: 'offensive' },
  ricochete: { icon: '🔩', label: 'Perfuração', category: 'offensive' },
  adrenalina: { icon: '⏳', label: 'Adrenalina', category: 'special' },
  termo: { icon: '☕', label: 'Corações', category: 'defensive' },
  leite_aveia: { icon: '🛡️', label: 'Escudo', category: 'defensive' },
  blindagem: { icon: '🥋', label: 'Resistência', category: 'defensive' },
  regen: { icon: '🌿', label: 'Regeneração', category: 'defensive' },
  vampiro: { icon: '🩸', label: 'Vampirismo', category: 'special' },
  descaf: { icon: '💨', label: 'Velocidade', category: 'mobility' },
  fantasma: { icon: '👻', label: 'Pós-dash', category: 'mobility' },
  ima: { icon: '🧲', label: 'Ímã', category: 'mobility' },
  sorte: { icon: '🍀', label: 'Sorte', category: 'special' },
};
