export type CharacterId = 'barista' | 'french_press' | 'grao_torrado' | 'mocha' | 'supremo';

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
  locked: boolean; // default lock state; actual unlock checked at runtime
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
    locked: false,
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
    locked: false,
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
    locked: false,
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
    special: 'Bônus em tudo. Desbloqueie derrotando o Boss Secreto no Impossível.',
    locked: true,
  },
];

export function isCharacterUnlocked(id: CharacterId): boolean {
  if (id !== 'supremo') return true;
  try {
    const data = localStorage.getItem('cafe_chaos_save');
    if (data) {
      const parsed = JSON.parse(data);
      return !!parsed.supremoUnlocked;
    }
  } catch {}
  return false;
}

export function unlockSupremo() {
  try {
    const data = localStorage.getItem('cafe_chaos_save');
    const parsed = data ? JSON.parse(data) : {};
    parsed.supremoUnlocked = true;
    localStorage.setItem('cafe_chaos_save', JSON.stringify(parsed));
  } catch {}
}

export function getCharacter(id: CharacterId): GameCharacter {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}
