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
}

export const DIFFICULTIES: DifficultyConfig[] = [
  {
    id: 'easy', name: 'Fácil', description: 'Para quem está aprendendo', icon: '🟢',
    enemyHpMult: 0.7, enemyDamageMult: 0.7, enemySpeedMult: 0.85,
    enemyCountMult: 0.7, bossHpMult: 0.7, goldMult: 0.8, hidden: false,
  },
  {
    id: 'medium', name: 'Médio', description: 'A experiência padrão', icon: '🟡',
    enemyHpMult: 1.0, enemyDamageMult: 1.0, enemySpeedMult: 1.0,
    enemyCountMult: 1.0, bossHpMult: 1.0, goldMult: 1.0, hidden: false,
  },
  {
    id: 'hard', name: 'Difícil', description: 'Para baristas experientes', icon: '🔴',
    enemyHpMult: 1.5, enemyDamageMult: 1.4, enemySpeedMult: 1.2,
    enemyCountMult: 1.3, bossHpMult: 1.5, goldMult: 1.3, hidden: false,
  },
  {
    id: 'impossible', name: 'Impossível', description: 'Apenas para os lendários', icon: '💀',
    enemyHpMult: 2.2, enemyDamageMult: 1.8, enemySpeedMult: 1.4,
    enemyCountMult: 1.6, bossHpMult: 2.5, goldMult: 2.0, hidden: true,
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
