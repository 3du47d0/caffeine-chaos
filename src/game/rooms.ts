import { Room, Enemy, Pickup, Vec2, EnemyType, Wall, Boss, BossType } from './types';
import { ROOM_WIDTH, ROOM_HEIGHT, ENEMY_CONFIGS } from './constants';

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function createEnemy(x: number, y: number, type: EnemyType): Enemy {
  const config = ENEMY_CONFIGS[type];
  return {
    pos: { x, y },
    vel: { x: 0, y: 0 },
    size: config.size,
    hp: config.hp,
    maxHp: config.hp,
    type,
    shootTimer: randInt(30, 90),
    moveTimer: randInt(20, 60),
    targetPos: { x, y },
    dropGold: config.gold,
  };
}

const BOSS_TYPES: BossType[] = ['grinder', 'steam_king', 'overflowing_pot'];

function createBoss(floor: number): Boss {
  const type = BOSS_TYPES[floor % BOSS_TYPES.length];
  const hpMult = 1 + floor * 0.4;
  const baseHp = 300;
  const hp = Math.floor(baseHp * hpMult);
  return {
    pos: { x: ROOM_WIDTH / 2, y: 160 },
    vel: { x: 0, y: 0 },
    size: 36,
    hp,
    maxHp: hp,
    type,
    shootTimer: 60,
    moveTimer: 40,
    phase: 0,
    angle: 0,
    invisibleTimer: 0,
    summonTimer: 180,
    dropGold: 30 + floor * 10,
  };
}

function generateWalls(roomIndex: number): Wall[] {
  const walls: Wall[] = [];
  const margin = 60;
  const wallThickness = 20;

  if (roomIndex % 3 === 0) {
    walls.push({ x: 300, y: 220, w: 40, h: 40 });
    walls.push({ x: 460, y: 340, w: 40, h: 40 });
  } else if (roomIndex % 3 === 1) {
    walls.push({ x: 250, y: 200, w: wallThickness, h: 120 });
    walls.push({ x: 250, y: 200, w: 100, h: wallThickness });
    walls.push({ x: 500, y: 300, w: wallThickness, h: 120 });
    walls.push({ x: 430, y: 400, w: 90, h: wallThickness });
  } else {
    for (let i = 0; i < 3; i++) {
      walls.push({
        x: randInt(margin + 80, ROOM_WIDTH - margin - 120),
        y: randInt(margin + 80, ROOM_HEIGHT - margin - 120),
        w: randInt(30, 60),
        h: randInt(30, 60),
      });
    }
  }

  return walls;
}

export function generateFloor(floor: number, numRooms: number): Room[] {
  const rooms: Room[] = [];
  const enemyTypes: EnemyType[] = ['croissant', 'milk_blob', 'angry_cup', 'drone'];
  const margin = 70;

  for (let i = 0; i < numRooms; i++) {
    const isBoss = i === numRooms - 1;
    const enemyCount = isBoss ? 0 : Math.min(3 + floor + Math.floor(i / 2), 8);
    const hpMult = 1 + floor * 0.3;
    const enemies: Enemy[] = [];
    const pickups: Pickup[] = [];

    for (let e = 0; e < enemyCount; e++) {
      const type = enemyTypes[randInt(0, Math.min(floor + 1, enemyTypes.length - 1))];
      const enemy = createEnemy(
        rand(margin + 50, ROOM_WIDTH - margin - 50),
        rand(margin + 50, ROOM_HEIGHT - margin - 50),
        type
      );
      enemy.hp = Math.floor(enemy.hp * hpMult);
      enemy.maxHp = enemy.hp;
      enemies.push(enemy);
    }

    if (Math.random() < 0.4 || isBoss) {
      pickups.push({
        pos: { x: rand(margin, ROOM_WIDTH - margin), y: rand(margin, ROOM_HEIGHT - margin) },
        type: 'health',
        value: 25,
      });
    }

    const goldCount = randInt(1, 3);
    for (let g = 0; g < goldCount; g++) {
      pickups.push({
        pos: { x: rand(margin, ROOM_WIDTH - margin), y: rand(margin, ROOM_HEIGHT - margin) },
        type: 'gold',
        value: randInt(1, 3),
      });
    }

    const doors: { pos: Vec2; direction: 'north' | 'south' | 'east' | 'west'; leadsTo: number }[] = [];
    if (i < numRooms - 1) {
      doors.push({ pos: { x: ROOM_WIDTH / 2, y: 15 }, direction: 'north', leadsTo: i + 1 });
    }
    if (i > 0) {
      doors.push({ pos: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT - 15 }, direction: 'south', leadsTo: i - 1 });
    }

    rooms.push({
      x: 0,
      y: 0,
      width: ROOM_WIDTH,
      height: ROOM_HEIGHT,
      enemies,
      boss: isBoss ? createBoss(floor) : null,
      pickups,
      cleared: false,
      doors,
      walls: i === 0 ? [] : generateWalls(i),
      isBossRoom: isBoss,
    });
  }

  return rooms;
}
