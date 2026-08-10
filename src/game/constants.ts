import { UpgradeShopItem } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const TILE_SIZE = 32;

export const ROOM_WIDTH = 800;
export const ROOM_HEIGHT = 600;

export const PLAYER_SIZE = 20;
export const PLAYER_SPEED = 3;
export const PLAYER_HP = 100;
export const PLAYER_SHOOT_COOLDOWN = 12;
export const PLAYER_DASH_COOLDOWN = 90;
export const PLAYER_DASH_DURATION = 10;
export const PLAYER_DASH_SPEED = 10;
export const PLAYER_ULTIMATE_COOLDOWN = 600;
export const PLAYER_INVINCIBLE_AFTER_HIT = 30;

// ---- Charged (heavy) attack ----
/** frames needed for a full charge */
export const CHARGE_TIME = 42;
/** damage multiplier of a fully charged shot */
export const CHARGE_DAMAGE_MULT = 2.6;
/** how much slower the player moves while charging */
export const CHARGE_MOVE_PENALTY = 0.55;

// ---- Combo system ----
/** frames without landing a hit before the combo resets */
export const COMBO_WINDOW = 110;
/** damage bonus per combo stack */
export const COMBO_DAMAGE_STEP = 0.015;
/** maximum combo damage bonus (+30%) */
export const COMBO_DAMAGE_CAP = 0.3;

// ---- Crit ----
export const BASE_CRIT_CHANCE = 0.05;
export const CRIT_MULT = 2;

export const BEAN_SPEED = 7;
export const BEAN_DAMAGE = 20;
export const BEAN_SIZE = 5;

/**
 * Enemy roles — difficulty comes from behaviour, not from inflated stats.
 * heavy   : slow, tanky, telegraphed charge
 * fast    : fragile, erratic, closes distance quickly
 * ranged  : keeps distance and forces the player to move
 * special : orbits the player and fires bursts, needs positioning
 */
export const ENEMY_CONFIGS = {
  croissant: { hp: 90, size: 20, speed: 1.05, damage: 16, gold: 4, color: '#D4A03A', role: 'heavy' },
  angry_cup: { hp: 55, size: 20, speed: 0.95, damage: 14, gold: 5, color: '#8B4513', role: 'ranged' },
  milk_blob: { hp: 32, size: 15, speed: 2.6, damage: 10, gold: 2, color: '#F5F5DC', role: 'fast' },
  drone: { hp: 48, size: 14, speed: 2.1, damage: 11, gold: 4, color: '#708090', role: 'special' },
} as const;


export const COLORS = {
  floor: '#3D2B1F',
  floorTile: '#4A3728',
  wall: '#2C1810',
  wallHighlight: '#5C3D2E',
  player: '#E8C170',
  playerOutline: '#B8860B',
  bean: '#6F4E37',
  healthFull: '#8B4513',
  healthEmpty: '#2C1810',
  gold: '#FFD700',
  door: '#D4A03A',
  doorLocked: '#5C3D2E',
  healing: '#90EE90',
  dash: '#87CEEB',
  ultimate: '#FFD700',
  particle: '#E8C170',
} as const;

// In-run shop items (bought during runs with collected gold)
// Heart system constant
export const HEART_VALUE = 20;

export const IN_RUN_SHOP_ITEMS: UpgradeShopItem[] = [
  { id: 'maxHpBonus', name: 'Caneca Grande', description: '+1 coração extra', cost: 8, maxLevel: 5, icon: '☕' },
  { id: 'damageBonus', name: 'Grãos Fortes', description: '+10% dano', cost: 12, maxLevel: 5, icon: '💥' },
  { id: 'speedBonus', name: 'Cafeína Extra', description: '+10% velocidade', cost: 10, maxLevel: 3, icon: '⚡' },
  { id: 'dashCdrBonus', name: 'Espresso Duplo', description: '-15% cooldown dash', cost: 15, maxLevel: 3, icon: '💨' },
];

// Legacy — kept for save compat but no longer shown in lobby
export const SHOP_ITEMS: UpgradeShopItem[] = IN_RUN_SHOP_ITEMS;

export const ROOMS_PER_FLOOR = 6;
export const TOTAL_FLOORS = 3;
