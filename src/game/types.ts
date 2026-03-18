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
  shield: boolean;
}

export type EnemyType = 'croissant' | 'angry_cup' | 'milk_blob' | 'drone';
export type BossType = 'grinder' | 'steam_king' | 'overflowing_pot' | 'secret_boss';

export interface Enemy extends Entity {
  type: EnemyType;
  shootTimer: number;
  moveTimer: number;
  targetPos: Vec2;
  dropGold: number;
  isMiniBoss?: boolean;
  // Enemy abilities
  dashTimer?: number;
  abilityTimer?: number;
}

export interface Boss extends Entity {
  type: BossType;
  shootTimer: number;
  moveTimer: number;
  phase: number;
  angle: number;
  invisibleTimer: number;
  summonTimer: number;
  dropGold: number;
  burnTimer?: number;
  enrageTimer?: number;
  teleportTimer?: number;
  shieldActive?: boolean;
  shieldHp?: number;
}

export interface Projectile {
  pos: Vec2;
  vel: Vec2;
  size: number;
  damage: number;
  friendly: boolean;
  lifetime: number;
  isBurnZone?: boolean;
  isVortex?: boolean;
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
  isSecretBossRoom?: boolean;
  isShopRoom?: boolean;
  shopVisited?: boolean;
  isRewardRoom?: boolean;
}

export interface Door {
  pos: Vec2;
  direction: 'north' | 'south' | 'east' | 'west';
  leadsTo: number;
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
  type?: 'normal' | 'finish' | 'secret' | 'reward';
}

// ---- Run Buff System ----
export type RunBuffId =
  | 'torrado'
  | 'leite_aveia'
  | 'chantilly'
  | 'termo'
  | 'canela'
  | 'descaf';

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
  timeFrames: number;
}

// ---- Achievement System ----
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  rewardName: string;
  rewardDescription: string;
  rewardType: 'damage' | 'hp' | 'speed' | 'gold' | 'dash' | 'special';
  rewardValue: number;
}

export interface AchievementProgress {
  [achievementId: string]: {
    current: number;
    unlocked: boolean;
  };
}

// ---- Stats tracked per run for achievements ----
export interface RunStats {
  enemiesKilled: number;
  damageTaken: number;
  bossesDefeated: number;
  roomsCleared: number;
  goldCollected: number;
  dashesUsed: number;
  ultimatesUsed: number;
  perfectRooms: number;
  fastRooms: number;
  totalDamageDealt: number;
  perfectBoss: boolean;
  floorDamageTaken: number;
  perfectFloor: boolean;
}

export interface GameState {
  phase: 'lobby' | 'playing' | 'reward' | 'gameover' | 'victory' | 'secret_victory' | 'shop' | 'reward_room';
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
  secretPortal: ExitPortal | null;
  clearMessageTimer: number;
  transitionTimer: number;
  transitionTarget: { floor: number; room: number } | null;
  rewardChoices: RunBuff[];
  runTimer: number;
  roomTimer: number;
  roomTimes: RoomTime[];
  fastBrewTimer: number;
  particleMultiplier: number;
  runStats: RunStats;
  roomDamageTaken: number;
  isBossRoom: boolean;
  secretBossDefeated: boolean;
  showSecretPortals: boolean;
  difficulty: string;
  characterId: string;
  // Quick restart
  restartHoldTimer: number;
  // Reward portal
  rewardPortal: ExitPortal | null;
  // Track return destination from reward room
  rewardReturnRoom: number;
  rewardReturnFloor: number;
  // Cached per-run computations to avoid per-frame GC
  _cache: any;
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
