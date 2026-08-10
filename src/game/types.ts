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
  /** frames the heavy attack has been charging (0 = not charging) */
  chargeTimer: number;
  /** frames left of the post-dash damage window */
  dashBuffTimer: number;
  /** frames left of a perfect-dodge bonus */
  perfectDodgeTimer: number;
  /** accumulator for regeneration */
  regenTimer: number;
}

export type EnemyType = 'croissant' | 'angry_cup' | 'milk_blob' | 'drone';
export type EnemyRole = 'heavy' | 'ranged' | 'fast' | 'special';
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
  /** telegraph frames before a charge (heavy) */
  windupTimer?: number;
  /** frames of an active charge */
  chargeTimer?: number;
  /** orbit angle used by special enemies */
  orbitAngle?: number;
  /** white flash frames after being hit */
  hitFlash?: number;
  /** knockback velocity */
  knockX?: number;
  knockY?: number;
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
  // Laser system
  laserChargeTimer?: number;
  laserAngle?: number;
  ultimateActive?: boolean;
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
  /** how many extra enemies this shot can go through */
  pierce?: number;
  /** heavy/charged shot — bigger impact feedback */
  charged?: boolean;
  /** rolled as a critical hit */
  crit?: boolean;
}

export interface Pickup {
  pos: Vec2;
  type: 'health' | 'gold';
  value: number;
}

export type ChestKind = 'wooden' | 'golden';

export interface Chest {
  pos: Vec2;
  kind: ChestKind;
  opened: boolean;
  /** small idle animation timer */
  bob: number;
}

/** Floating combat text */
export interface DamageNumber {
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  value: number;
  crit: boolean;
  heal?: boolean;
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  enemies: Enemy[];
  boss: Boss | null;
  pickups: Pickup[];
  chests: Chest[];
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
  // offensive
  | 'torrado'      // +damage
  | 'chantilly'    // +attack speed
  | 'canela'       // burn chance
  | 'critico'      // crit chance
  | 'ricochete'    // piercing shots
  | 'adrenalina'   // more damage at low HP
  // defensive
  | 'termo'        // +max hearts
  | 'leite_aveia'  // shield
  | 'blindagem'    // damage reduction
  | 'regen'        // health regeneration
  | 'vampiro'      // lifesteal on kill
  // mobility
  | 'descaf'       // speed & dash
  | 'fantasma'     // damage window after dash
  | 'ima'          // pickup magnet
  // special
  | 'sorte';       // better rarities & gold

export type BuffCategory = 'offensive' | 'defensive' | 'mobility' | 'special';

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
  critico: number;
  ricochete: number;
  adrenalina: number;
  blindagem: number;
  regen: number;
  vampiro: number;
  fantasma: number;
  ima: number;
  sorte: number;
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
  // ---- Performance ----
  perfMode: import('./perf').PerfMode;
  // ---- Combat feedback ----
  damageNumbers: DamageNumber[];
  comboCount: number;
  comboTimer: number;
  bestCombo: number;
  hitStop: number;
  /** id of a lore fragment discovered this frame (consumed by the UI) */
  pendingLore: string | null;
  /** ids of lore fragments discovered during this run */
  loreFound: string[];
  /** true while a chest reward is being chosen */
  chestReward: boolean;

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
