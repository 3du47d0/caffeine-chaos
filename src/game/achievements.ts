import { Achievement, AchievementProgress } from './types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    name: 'Primeiro Gole',
    description: 'Derrote 50 inimigos em uma única run',
    icon: '☕',
    requirement: 50,
    rewardName: 'Grãos Reforçados',
    rewardDescription: '+5% de dano permanente',
    rewardType: 'damage',
    rewardValue: 0.05,
  },
  {
    id: 'gold_rush',
    name: 'Colheita Dourada',
    description: 'Colete 500 grãos de ouro no total',
    icon: '✦',
    requirement: 500,
    rewardName: 'Bolso Fundo',
    rewardDescription: '+1 ouro por inimigo',
    rewardType: 'gold',
    rewardValue: 1,
  },
  {
    id: 'speed_demon',
    name: 'Espresso Relâmpago',
    description: 'Complete 15 salas em menos de 10 segundos',
    icon: '⚡',
    requirement: 15,
    rewardName: 'Cafeína Turbo',
    rewardDescription: '+10% velocidade permanente',
    rewardType: 'speed',
    rewardValue: 0.1,
  },
  {
    id: 'untouchable',
    name: 'Barista Intocável',
    description: 'Complete 10 salas sem tomar dano',
    icon: '🛡️',
    requirement: 10,
    rewardName: 'Casca Grossa',
    rewardDescription: '+25 HP máximo permanente',
    rewardType: 'hp',
    rewardValue: 25,
  },
  {
    id: 'boss_slayer',
    name: 'Caçador de Chefes',
    description: 'Derrote 15 bosses no total',
    icon: '💀',
    requirement: 15,
    rewardName: 'Dash Aprimorado',
    rewardDescription: '-20% cooldown do dash permanente',
    rewardType: 'dash',
    rewardValue: 0.2,
  },
  {
    id: 'massacre',
    name: 'Massacre Cafeínado',
    description: 'Derrote 300 inimigos no total',
    icon: '🔥',
    requirement: 300,
    rewardName: 'Fúria do Café',
    rewardDescription: '+10% dano permanente',
    rewardType: 'damage',
    rewardValue: 0.1,
  },
  {
    id: 'victory_lap',
    name: 'Volta da Vitória',
    description: 'Complete o jogo sem morrer (derrote todos os bosses)',
    icon: '🏆',
    requirement: 1,
    rewardName: 'Aura Dourada',
    rewardDescription: 'Efeito visual especial + 5% em tudo',
    rewardType: 'special',
    rewardValue: 0.05,
  },
  {
    id: 'speedrunner',
    name: 'Speedrunner',
    description: 'Complete o jogo em menos de 5 minutos',
    icon: '⏱️',
    requirement: 1,
    rewardName: 'Cronômetro de Ouro',
    rewardDescription: '+15% velocidade de ataque permanente',
    rewardType: 'speed',
    rewardValue: 0.15,
  },
  {
    id: 'perfect_boss',
    name: 'Boss Perfeito',
    description: 'Derrote qualquer boss sem tomar dano',
    icon: '💎',
    requirement: 1,
    rewardName: 'Reflexos de Aço',
    rewardDescription: '+30 HP máximo permanente',
    rewardType: 'hp',
    rewardValue: 30,
  },
  {
    id: 'no_hit_floor',
    name: 'Andar Intocável',
    description: 'Complete um andar inteiro sem tomar dano',
    icon: '🌟',
    requirement: 1,
    rewardName: 'Escudo Eterno',
    rewardDescription: '-25% cooldown do dash permanente',
    rewardType: 'dash',
    rewardValue: 0.25,
  },
];

export function loadAchievementProgress(): AchievementProgress {
  try {
    const saved = localStorage.getItem('cafe_chaos_achievements');
    if (saved) return JSON.parse(saved);
  } catch {}
  const progress: AchievementProgress = {};
  for (const a of ACHIEVEMENTS) {
    progress[a.id] = { current: 0, unlocked: false };
  }
  return progress;
}

export function saveAchievementProgress(progress: AchievementProgress) {
  localStorage.setItem('cafe_chaos_achievements', JSON.stringify(progress));
}

export function checkAndUnlock(progress: AchievementProgress): string[] {
  const newlyUnlocked: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!progress[a.id]) progress[a.id] = { current: 0, unlocked: false };
    if (!progress[a.id].unlocked && progress[a.id].current >= a.requirement) {
      progress[a.id].unlocked = true;
      newlyUnlocked.push(a.id);
    }
  }
  return newlyUnlocked;
}

export function allAchievementsUnlocked(progress: AchievementProgress): boolean {
  return ACHIEVEMENTS.every(a => progress[a.id]?.unlocked);
}

export function getAchievementBonuses(progress: AchievementProgress) {
  let damageBonus = 0;
  let hpBonus = 0;
  let speedBonus = 0;
  let goldBonus = 0;
  let dashBonus = 0;

  for (const a of ACHIEVEMENTS) {
    if (progress[a.id]?.unlocked) {
      switch (a.rewardType) {
        case 'damage': damageBonus += a.rewardValue; break;
        case 'hp': hpBonus += a.rewardValue; break;
        case 'speed': speedBonus += a.rewardValue; break;
        case 'gold': goldBonus += a.rewardValue; break;
        case 'dash': dashBonus += a.rewardValue; break;
        case 'special':
          damageBonus += a.rewardValue;
          speedBonus += a.rewardValue;
          break;
      }
    }
  }

  return { damageBonus, hpBonus, speedBonus, goldBonus, dashBonus };
}
