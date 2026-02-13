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

export const BEAN_SPEED = 7;
export const BEAN_DAMAGE = 20;
export const BEAN_SIZE = 5;

export const ENEMY_CONFIGS = {
  croissant: { hp: 60, size: 18, speed: 1.5, damage: 15, gold: 3, color: '#D4A03A' },
  angry_cup: { hp: 80, size: 22, speed: 1, damage: 20, gold: 5, color: '#8B4513' },
  milk_blob: { hp: 40, size: 16, speed: 2, damage: 10, gold: 2, color: '#F5F5DC' },
  drone: { hp: 50, size: 14, speed: 2.5, damage: 12, gold: 4, color: '#708090' },
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

export const SHOP_ITEMS: UpgradeShopItem[] = [
  { id: 'maxHpBonus', name: 'Caneca Grande', description: '+25 HP máximo', cost: 15, maxLevel: 5, icon: '☕' },
  { id: 'damageBonus', name: 'Grãos Fortes', description: '+10% dano', cost: 20, maxLevel: 5, icon: '💥' },
  { id: 'speedBonus', name: 'Cafeína Extra', description: '+10% velocidade', cost: 15, maxLevel: 3, icon: '⚡' },
  { id: 'dashCdrBonus', name: 'Espresso Duplo', description: '-15% cooldown dash', cost: 25, maxLevel: 3, icon: '💨' },
];

export const ROOMS_PER_FLOOR = 6;
export const TOTAL_FLOORS = 3;
