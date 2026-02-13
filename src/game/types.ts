export interface Vec2 {
  x: number;
  y: number;
}

export interface Entity {
  pos: Vec2;
  vel: Vec2;
  size: number;
  hp: number;
  maxHp: number;
}

export interface Player extends Entity {
  dashCooldown: number;
  dashTimer: number;
  ultimateCooldown: number;
  ultimateTimer: number;
  invincibleTimer: number;
  facing: Vec2;
  shootCooldown: number;
}

export type EnemyType = 'croissant' | 'angry_cup' | 'milk_blob' | 'drone';

export interface Enemy extends Entity {
  type: EnemyType;
  shootTimer: number;
  moveTimer: number;
  targetPos: Vec2;
  dropGold: number;
}

export interface Projectile {
  pos: Vec2;
  vel: Vec2;
  size: number;
  damage: number;
  friendly: boolean;
  lifetime: number;
}

export interface Pickup {
  pos: Vec2;
  type: 'health' | 'gold';
  value: number;
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  enemies: Enemy[];
  pickups: Pickup[];
  cleared: boolean;
  doors: Door[];
  walls: Wall[];
}

export interface Door {
  pos: Vec2;
  direction: 'north' | 'south' | 'east' | 'west';
  leadsTo: number; // room index
}

export interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ExitPortal {
  pos: Vec2;
  active: boolean;
}

export interface GameState {
  phase: 'lobby' | 'playing' | 'gameover' | 'victory';
  player: Player;
  rooms: Room[];
  currentRoom: number;
  projectiles: Projectile[];
  particles: Particle[];
  goldCollected: number;
  totalGold: number;
  roomsCleared: number;
  totalRooms: number;
  floor: number;
  keys: Set<string>;
  mousePos: Vec2;
  mouseDown: boolean;
  upgrades: Upgrades;
  screenShake: number;
  damageFlash: number;
  exitPortal: ExitPortal | null;
  clearMessageTimer: number;
  transitionTimer: number;
  transitionTarget: { floor: number; room: number } | null;
}

export interface Particle {
  pos: Vec2;
  vel: Vec2;
  lifetime: number;
  maxLifetime: number;
  color: string;
  size: number;
}

export interface Upgrades {
  maxHpBonus: number;
  damageBonus: number;
  speedBonus: number;
  dashCdrBonus: number;
}

export interface UpgradeShopItem {
  id: keyof Upgrades;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  icon: string;
}
