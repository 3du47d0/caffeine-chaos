/**
 * Permanent (meta) progression that survives death.
 * Kept intentionally light so runs stay challenging: it unlocks *content*
 * (new item tiers, chest frequency) rather than raw power.
 */

export interface MetaProgress {
  runs: number;
  deepestFloor: number;
  totalKills: number;
  totalBosses: number;
  bestRunFrames: number;
}

const META_KEY = 'cafe_chaos_meta';

const EMPTY: MetaProgress = {
  runs: 0, deepestFloor: 0, totalKills: 0, totalBosses: 0, bestRunFrames: 0,
};

export function loadMeta(): MetaProgress {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {}
  return { ...EMPTY };
}

export function saveMeta(meta: MetaProgress) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch {}
}

export function clearMeta() {
  try { localStorage.removeItem(META_KEY); } catch {}
}

/** Item tiers unlocked by experience — keeps early runs readable. */
export function unlockedItemTiers(meta: MetaProgress): { epic: boolean; legendary: boolean } {
  return {
    epic: meta.runs >= 2 || meta.deepestFloor >= 1,
    legendary: meta.runs >= 4 || meta.totalBosses >= 3,
  };
}

export interface MetaUnlockInfo {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
}

export function getMetaUnlocks(meta: MetaProgress): MetaUnlockInfo[] {
  const tiers = unlockedItemTiers(meta);
  return [
    {
      id: 'epic', label: '💜 Itens Épicos',
      description: 'Complete 2 runs ou alcance o andar 2',
      unlocked: tiers.epic,
    },
    {
      id: 'legendary', label: '💛 Itens Lendários',
      description: 'Complete 4 runs ou derrote 3 chefes',
      unlocked: tiers.legendary,
    },
    {
      id: 'chests', label: '📦 Baús Extras',
      description: 'Complete 3 runs — mais baús por andar',
      unlocked: meta.runs >= 3,
    },
    {
      id: 'mythic', label: '🌟 Baús Dourados',
      description: 'Derrote 6 chefes no total',
      unlocked: meta.totalBosses >= 6,
    },
  ];
}

export function chestChanceBonus(meta: MetaProgress): number {
  let bonus = 0;
  if (meta.runs >= 3) bonus += 0.08;
  if (meta.totalBosses >= 6) bonus += 0.07;
  return bonus;
}
