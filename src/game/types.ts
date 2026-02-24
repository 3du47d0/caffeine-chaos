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
  shield: boolean; // Leite de Aveia buff
}

export type EnemyType = 'croissant' | 'angry_cup' | 'milk_blob' | 'drone';
export type BossType = 'grinder' | 'steam_king' | 'overflowing_pot';

export interface Enemy extends Entity {
  type: EnemyType;
  shootTimer: number;
  moveTimer: number;
  targetPos: Vec2;
  dropGold: number;
}

export interface Boss extends Entity {
  type: BossType;
  shootTimer: number;
  moveTimer: number;
  phase: number; // attack pattern phase
  angle: number; // for rotation-based attacks
  invisibleTimer: number; // steam_king invisibility
  summonTimer: number; // overflowing_pot summon timer
  dropGold: number;
  burnTimer?: number;
}

export interface Projectile {
  pos: Vec2;
  vel: Vec2;
  size: number;
  damage: number;
  friendly: boolean;
  lifetime: number;
  isBurnZone?: boolean; // steam_king floor hazard
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
  boss: Boss | null;
  pickups: Pickup[];
  cleared: boolean;
  doors: Door[];
  walls: Wall[];
  isBossRoom: boolean;
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

// ---- Run Buff System ----
export type RunBuffId =
  | 'torrado'      // +20% damage
  | 'leite_aveia'  // shield per room
  | 'chantilly'    // +20% fire rate
  | 'termo'        // +50 max hp
  | 'canela'       // burn chance
  | 'descaf';      // +20% speed & dash range

export interface RunBuff {
  id: RunBuffId;
  name: string;
  description: string;
  icon: string;
}

export interface RunBuffs {
  torrado: number;
  leite_aveia: number;
  chantilly: number;
  termo: number;
  canela: number;
  descaf: number;
}

export interface RoomTime {
  room: number;
  floor: number;
  timeFrames: number; // in frames (60fps)
}

export interface GameState {
  phase: 'lobby' | 'playing' | 'reward' | 'gameover' | 'victory';
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
  runBuffs: RunBuffs;
  screenShake: number;
  damageFlash: number;
  exitPortal: ExitPortal | null;
  clearMessageTimer: number;
  transitionTimer: number;
  transitionTarget: { floor: number; room: number } | null;
  rewardChoices: RunBuff[];
  // Timer system
  runTimer: number; // total frames elapsed during gameplay
  roomTimer: number; // frames in current room
  roomTimes: RoomTime[]; // completed room times
  fastBrewTimer: number; // countdown to show "Fast Brew!" message
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
