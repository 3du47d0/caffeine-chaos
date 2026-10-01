import { isMissionComplete } from './missions';

export type CharacterId = 'barista' | 'french_press' | 'grao_torrado' | 'mocha' | 'supremo'
  | 'medico' | 'soldado' | 'explorador' | 'tanque';

export interface CharacterUnlockCondition {
  description: string;
  check: () => boolean;
}

export interface GameCharacter {
  id: CharacterId;
  name: string;
  description: string;
  icon: string;
  hpMult: number;
  speedMult: number;
  damageMult: number;
  shootCdMult: number;
  special: string;
  locked: boolean;
  unlockCondition?: CharacterUnlockCondition;
  /** multiplier on incoming damage (lower = tankier) */
  defenseMult?: number;
  /** multiplier on healing pickups */
  healMult?: number;
  /** extra chance of Treasure Rooms (and a bonus chest inside) */
  treasureBonus?: number;
  bio?: string;
  weakness?: string;
}

function getSaveData(): any {
  try {
    const data = localStorage.getItem('cafe_chaos_save');
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

export const CHARACTERS: GameCharacter[] = [
  {
    id: 'barista',
    name: 'O Barista',
    description: 'Equilibrado em tudo. O clássico.',
    icon: '☕',
    hpMult: 1.0,
    speedMult: 1.0,
    damageMult: 1.0,
    shootCdMult: 1.0,
    special: 'Nenhum bônus especial',
    locked: false,
  },
  {
    id: 'french_press',
    name: 'A Prensa Francesa',
    description: 'Lenta mas poderosa. +30% dano, -20% velocidade.',
    icon: '🫖',
    hpMult: 1.2,
    speedMult: 0.8,
    damageMult: 1.3,
    shootCdMult: 1.2,
    special: '+30% dano, +20% HP, mais lenta',
    locked: true,
    unlockCondition: {
      description: 'Complete o Andar 3 sem sofrer qualquer dano',
      check: () => !!getSaveData().unlock_french_press,
    },
  },
  {
    id: 'grao_torrado',
    name: 'O Grão Torrado',
    description: 'Rápido e frágil. +30% velocidade, -20% HP.',
    icon: '🔥',
    hpMult: 0.8,
    speedMult: 1.3,
    damageMult: 1.0,
    shootCdMult: 0.75,
    special: '+30% velocidade, ataque rápido, frágil',
    locked: true,
    unlockCondition: {
      description: 'Vença o jogo no Difícil em menos de 5 minutos',
      check: () => !!getSaveData().unlock_grao_torrado,
    },
  },
  {
    id: 'mocha',
    name: 'O Mocha',
    description: 'Tank de chocolate. +50% HP, -15% dano.',
    icon: '🍫',
    hpMult: 1.5,
    speedMult: 0.9,
    damageMult: 0.85,
    shootCdMult: 1.1,
    special: '+50% HP, resistente mas fraco',
    locked: true,
    unlockCondition: {
      description: 'Derrote 3 bosses sem usar o Dash',
      check: () => !!getSaveData().unlock_mocha,
    },
  },
  {
    id: 'supremo',
    name: 'O Supremo',
    description: '???',
    icon: '👑',
    hpMult: 1.1,
    speedMult: 1.15,
    damageMult: 1.25,
    shootCdMult: 0.8,
    special: 'Bônus em tudo. Derrote o Boss Secreto no Impossível.',
    locked: true,
    unlockCondition: {
      description: 'Derrote o Boss Secreto na dificuldade Impossível',
      check: () => !!getSaveData().supremoUnlocked,
    },
  },
  {
    id: 'medico',
    name: 'A Médica',
    description: 'Cura tudo, mas bate fraco.',
    bio: 'Enfermeira do turno da noite. Sabe que o café ali não é só café.',
    icon: '🩺',
    hpMult: 1.0, speedMult: 1.0, damageMult: 0.8, shootCdMult: 1.0,
    healMult: 1.8,
    special: 'Itens de cura curam +80%',
    weakness: '-20% de dano',
    locked: true,
    unlockCondition: { description: 'Missão: Use 20 itens de cura', check: () => isMissionComplete('m_heal_20') },
  },
  {
    id: 'soldado',
    name: 'O Segurança',
    description: 'Tiros pesados, passos pesados.',
    bio: 'Vigia da fábrica há 20 anos. Nunca saiu antes das 4:01.',
    icon: '🪖',
    hpMult: 1.1, speedMult: 0.82, damageMult: 1.35, shootCdMult: 1.05,
    special: '+35% de dano nos disparos',
    weakness: '-18% de velocidade',
    locked: true,
    unlockCondition: { description: 'Missão: Derrote 3 chefes', check: () => isMissionComplete('m_boss_3') },
  },
  {
    id: 'explorador',
    name: 'A Entregadora',
    description: 'Rápida e faro para tesouros.',
    bio: 'Conhece cada corredor do porão. Ninguém sabe como ela entrou.',
    icon: '🧭',
    hpMult: 0.7, speedMult: 1.25, damageMult: 1.0, shootCdMult: 1.0,
    treasureBonus: 0.25,
    special: '+25% velocidade, mais Salas de Tesouro e baú extra nelas',
    weakness: '-30% de vida',
    locked: true,
    unlockCondition: { description: 'Missão: Encontre 5 Salas de Tesouro', check: () => isMissionComplete('m_treasure_5') },
  },
  {
    id: 'tanque',
    name: 'O Galão',
    description: 'Aguenta pancada, demora a chegar.',
    bio: 'Um galão de 20 litros que ganhou vida. Pesado demais para fugir.',
    icon: '🛢️',
    hpMult: 1.2, speedMult: 0.75, damageMult: 1.0, shootCdMult: 1.1,
    defenseMult: 0.6,
    special: 'Recebe 40% menos dano',
    weakness: '-25% de velocidade',
    locked: true,
    unlockCondition: { description: 'Missão: Absorva 1500 de dano no total', check: () => isMissionComplete('m_damage_taken') },
  },
];

export function isCharacterUnlocked(id: CharacterId): boolean {
  const char = CHARACTERS.find(c => c.id === id);
  if (!char) return false;
  if (!char.locked) return true;
  if (char.unlockCondition) return char.unlockCondition.check();
  return false;
}

export function unlockCharacter(key: string) {
  try {
    const data = getSaveData();
    data[key] = true;
    localStorage.setItem('cafe_chaos_save', JSON.stringify(data));
  } catch {}
}

export function unlockSupremo() {
  unlockCharacter('supremoUnlocked');
}

export function getCharacter(id: CharacterId): GameCharacter {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}
