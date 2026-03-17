export type DifficultyId = 'easy' | 'medium' | 'hard' | 'impossible';

export interface DifficultyConfig {
  id: DifficultyId;
  name: string;
  description: string;
  icon: string;
  enemyHpMult: number;
  enemyDamageMult: number;
  enemySpeedMult: number;
  enemyCountMult: number;
  bossHpMult: number;
  goldMult: number;
  hidden: boolean;
  // New: mini-boss chance per room (0-1)
  miniBossChance: number;
  // New: enemy ability chance (dash, spread shots)
  enemyAbilityChance: number;
}

export const DIFFICULTIES: DifficultyConfig[] = [
  {
    id: 'easy', name: 'Fácil', description: 'Para quem está aprendendo', icon: '🟢',
    enemyHpMult: 0.8, enemyDamageMult: 0.8, enemySpeedMult: 0.9,
    enemyCountMult: 0.8, bossHpMult: 0.8, goldMult: 0.8, hidden: false,
    miniBossChance: 0, enemyAbilityChance: 0,
  },
  {
    id: 'medium', name: 'Médio', description: 'A experiência padrão', icon: '🟡',
    enemyHpMult: 1.0, enemyDamageMult: 1.0, enemySpeedMult: 1.0,
    enemyCountMult: 1.0, bossHpMult: 1.0, goldMult: 1.0, hidden: false,
    miniBossChance: 0.1, enemyAbilityChance: 0.15,
  },
  {
    id: 'hard', name: 'Difícil', description: 'Para baristas experientes', icon: '🔴',
    enemyHpMult: 1.8, enemyDamageMult: 1.6, enemySpeedMult: 1.35,
    enemyCountMult: 1.5, bossHpMult: 1.8, goldMult: 1.4, hidden: false,
    miniBossChance: 0.25, enemyAbilityChance: 0.35,
  },
  {
    id: 'impossible', name: 'Impossível', description: 'Apenas para os lendários', icon: '💀',
    enemyHpMult: 2.8, enemyDamageMult: 2.2, enemySpeedMult: 1.6,
    enemyCountMult: 1.8, bossHpMult: 3.0, goldMult: 2.5, hidden: true,
    miniBossChance: 0.4, enemyAbilityChance: 0.55,
  },
];

export function isDifficultyUnlocked(id: DifficultyId): boolean {
  if (id !== 'impossible') return true;
  try {
    const data = localStorage.getItem('cafe_chaos_save');
    if (data) {
      const parsed = JSON.parse(data);
      return !!parsed.impossibleUnlocked;
    }
  } catch {}
  return false;
}

export function unlockImpossible() {
  try {
    const data = localStorage.getItem('cafe_chaos_save');
    const parsed = data ? JSON.parse(data) : {};
    parsed.impossibleUnlocked = true;
    localStorage.setItem('cafe_chaos_save', JSON.stringify(parsed));
  } catch {}
}

export function getDifficulty(id: DifficultyId): DifficultyConfig {
  return DIFFICULTIES.find(d => d.id === id) || DIFFICULTIES[1];
}
