import { Door, Room, Enemy, Pickup, Vec2, EnemyType, Wall, Boss, BossType, Chest } from './types';
import { ROOM_WIDTH, ROOM_HEIGHT, ENEMY_CONFIGS } from './constants';
import { DifficultyConfig } from './difficulty';
import { getFloorTheme } from './floors';
import { loadMeta, chestChanceBonus } from './meta';


function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function createEnemy(x: number, y: number, type: EnemyType, diff?: DifficultyConfig): Enemy {
  const config = ENEMY_CONFIGS[type];
  const hpMult = diff?.enemyHpMult ?? 1;
  const hp = Math.floor(config.hp * hpMult);
  return {
    pos: { x, y },
    vel: { x: 0, y: 0 },
    size: config.size,
    hp,
    maxHp: hp,
    type,
    shootTimer: randInt(30, 90),
    moveTimer: randInt(20, 60),
    targetPos: { x, y },
    dropGold: Math.ceil(config.gold * (diff?.goldMult ?? 1)),
  };
}

// Create a mini-boss: an enemy with 3x HP, 1.5x size, and more gold
function createMiniBoss(x: number, y: number, type: EnemyType, diff?: DifficultyConfig): Enemy {
  const config = ENEMY_CONFIGS[type];
  const hpMult = (diff?.enemyHpMult ?? 1) * 3;
  const hp = Math.floor(config.hp * hpMult);
  return {
    pos: { x, y },
    vel: { x: 0, y: 0 },
    size: Math.floor(config.size * 1.5),
    hp,
    maxHp: hp,
    type,
    shootTimer: randInt(20, 50),
    moveTimer: randInt(15, 40),
    targetPos: { x, y },
    dropGold: Math.ceil(config.gold * (diff?.goldMult ?? 1) * 3),
    isMiniBoss: true,
  };
}

const BOSS_TYPES: BossType[] = ['grinder', 'steam_king', 'overflowing_pot'];

function createBoss(floor: number, diff?: DifficultyConfig): Boss {
  const type = BOSS_TYPES[floor % BOSS_TYPES.length];
  const hpMult = (1 + floor * 0.4) * (diff?.bossHpMult ?? 1);
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
    dropGold: Math.ceil((30 + floor * 10) * (diff?.goldMult ?? 1)),
  };
}

// ---- Room Layout Templates ----
type LayoutType = 'square' | 'L_shape' | 'cross' | 'pillars' | 'corridors' | 'arena';

function getLayoutType(roomIndex: number, floor: number): LayoutType {
  const layouts: LayoutType[] = ['square', 'L_shape', 'cross', 'pillars', 'corridors', 'arena'];
  // Deterministic-ish but varied
  const seed = (roomIndex * 7 + floor * 13) % layouts.length;
  return layouts[seed];
}

function generateWalls(roomIndex: number, floor: number): Wall[] {
  const walls: Wall[] = [];
  const layout = getLayoutType(roomIndex, floor);

  switch (layout) {
    case 'L_shape': {
      // L-shaped obstacle: top-right block
      walls.push({ x: 500, y: 60, w: 240, h: 200 });
      // Fill with smaller decorative walls
      walls.push({ x: 500, y: 260, w: 30, h: 30 });
      walls.push({ x: 710, y: 260, w: 30, h: 30 });
      break;
    }
    case 'cross': {
      // Cross shape in center
      const cx = ROOM_WIDTH / 2, cy = ROOM_HEIGHT / 2;
      walls.push({ x: cx - 15, y: cy - 100, w: 30, h: 200 }); // vertical
      walls.push({ x: cx - 100, y: cy - 15, w: 200, h: 30 }); // horizontal
      break;
    }
    case 'pillars': {
      // 4 pillars grid
      const positions = [
        { x: 200, y: 180 }, { x: 550, y: 180 },
        { x: 200, y: 380 }, { x: 550, y: 380 },
      ];
      for (const p of positions) {
        walls.push({ x: p.x, y: p.y, w: 40, h: 40 });
      }
      break;
    }
    case 'corridors': {
      // Horizontal corridor walls with gaps
      walls.push({ x: 60, y: 200, w: 280, h: 20 });
      walls.push({ x: 460, y: 200, w: 280, h: 20 });
      walls.push({ x: 150, y: 380, w: 280, h: 20 });
      walls.push({ x: 520, y: 380, w: 220, h: 20 });
      break;
    }
    case 'arena': {
      // Ring of small obstacles
      const cx = ROOM_WIDTH / 2, cy = ROOM_HEIGHT / 2;
      const radius = 140;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        walls.push({
          x: Math.floor(cx + Math.cos(a) * radius - 15),
          y: Math.floor(cy + Math.sin(a) * radius - 15),
          w: 30, h: 30,
        });
      }
      break;
    }
    default: {
      // Classic random walls
      if (roomIndex % 3 === 0) {
        walls.push({ x: 300, y: 220, w: 40, h: 40 });
        walls.push({ x: 460, y: 340, w: 40, h: 40 });
      } else if (roomIndex % 3 === 1) {
        walls.push({ x: 250, y: 200, w: 20, h: 120 });
        walls.push({ x: 250, y: 200, w: 100, h: 20 });
        walls.push({ x: 500, y: 300, w: 20, h: 120 });
        walls.push({ x: 430, y: 400, w: 90, h: 20 });
      } else {
        for (let i = 0; i < 3; i++) {
          walls.push({
            x: randInt(140, ROOM_WIDTH - 200),
            y: randInt(140, ROOM_HEIGHT - 200),
            w: randInt(30, 60),
            h: randInt(30, 60),
          });
        }
      }
      break;
    }
  }

  // Floor 3 (furnace): add extra fire obstacles
  const theme = getFloorTheme(floor);
  if (theme.id === 'roast_furnace') {
    walls.push({
      x: randInt(200, 400),
      y: randInt(200, 350),
      w: 30, h: 30,
    });
  }

  return walls;
}

// Floor-specific enemy pools
function getEnemyPool(floor: number): EnemyType[] {
  switch (floor) {
    case 0: return ['croissant', 'milk_blob'];
    case 1: return ['milk_blob', 'angry_cup', 'drone'];
    case 2: return ['angry_cup', 'drone', 'croissant'];
    default: return ['croissant', 'milk_blob', 'angry_cup', 'drone'];
  }
}

type Dir = Door['direction'];
const DIRS: { name: Dir; dx: number; dy: number }[] = [
  { name: 'north', dx: 0, dy: -1 }, { name: 'south', dx: 0, dy: 1 },
  { name: 'west', dx: -1, dy: 0 }, { name: 'east', dx: 1, dy: 0 },
];

export function doorPos(dir: Dir): Vec2 {
  switch (dir) {
    case 'north': return { x: ROOM_WIDTH / 2, y: 15 };
    case 'south': return { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT - 15 };
    case 'west': return { x: 15, y: ROOM_HEIGHT / 2 };
    default: return { x: ROOM_WIDTH - 15, y: ROOM_HEIGHT / 2 };
  }
}

/** Spawn point just inside the door on the given side. */
export function spawnNearDoor(side: Dir): Vec2 {
  switch (side) {
    case 'north': return { x: ROOM_WIDTH / 2, y: 80 };
    case 'south': return { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT - 80 };
    case 'west': return { x: 80, y: ROOM_HEIGHT / 2 };
    default: return { x: ROOM_WIDTH - 80, y: ROOM_HEIGHT / 2 };
  }
}

export const OPPOSITE: Record<Dir, Dir> = { north: 'south', south: 'north', west: 'east', east: 'west' };

/**
 * Compact random blob of rooms on a grid (favours cells with many neighbours,
 * so most rooms get 3-4 doors). Returned order: start first, boss (farthest) last.
 */
function buildLayout(n: number): { x: number; y: number }[] {
  const cells = [{ x: 0, y: 0 }];
  const has = (x: number, y: number) => cells.some(c => c.x === x && c.y === y);
  let guard = 0;
  while (cells.length < n && guard++ < 500) {
    const base = cells[randInt(0, cells.length - 1)];
    const d = DIRS[randInt(0, 3)];
    const nx = base.x + d.dx, ny = base.y + d.dy;
    if (has(nx, ny) || Math.abs(nx) > 2 || Math.abs(ny) > 2) continue;
    cells.push({ x: nx, y: ny });
  }
  // BFS distance from start; farthest cell becomes the boss room.
  const dist = new Map<string, number>([['0,0', 0]]);
  const q = [cells[0]];
  while (q.length) {
    const c = q.shift()!;
    for (const d of DIRS) {
      const k = `${c.x + d.dx},${c.y + d.dy}`;
      if (has(c.x + d.dx, c.y + d.dy) && !dist.has(k)) { dist.set(k, dist.get(`${c.x},${c.y}`)! + 1); q.push({ x: c.x + d.dx, y: c.y + d.dy }); }
    }
  }
  const rest = cells.slice(1);
  rest.sort((a, b) => dist.get(`${a.x},${a.y}`)! - dist.get(`${b.x},${b.y}`)!);
  return [cells[0], ...rest];
}

/** base chance per floor of spawning a Treasure Room */
export const TREASURE_ROOM_CHANCE = 0.75;

export function generateFloor(floor: number, numRooms: number, diff?: DifficultyConfig, treasureBonus = 0): Room[] {
  const rooms: Room[] = [];
  const enemyPool = getEnemyPool(floor);
  const margin = 70;
  const countMult = diff?.enemyCountMult ?? 1;

  // Grid layout: index 0 = start, last index = boss (farthest from start).
  const cells = buildLayout(numRooms);
  // Treasure room: a quiet room holding a guaranteed chest (replaces the old shop).
  const shopRoomIndex = numRooms > 3 && Math.random() < TREASURE_ROOM_CHANCE + treasureBonus
    ? randInt(1, numRooms - 2) : -1;

  for (let i = 0; i < numRooms; i++) {
    const isBoss = i === numRooms - 1;
    const isShop = i === shopRoomIndex;

    const enemyCount = isBoss || isShop ? 0 : Math.min(Math.round((3 + floor + Math.floor(i / 2)) * countMult), 12);
    const enemies: Enemy[] = [];
    const pickups: Pickup[] = [];

    for (let e = 0; e < enemyCount; e++) {
      const type = enemyPool[randInt(0, enemyPool.length - 1)];
      const enemy = createEnemy(
        rand(margin + 50, ROOM_WIDTH - margin - 50),
        rand(margin + 50, ROOM_HEIGHT - margin - 50),
        type, diff,
      );
      enemy.hp = Math.floor(enemy.hp * (1 + floor * 0.3));
      enemy.maxHp = enemy.hp;
      enemies.push(enemy);
    }

    // Mini-boss chance for non-boss, non-shop, non-first rooms
    if (!isBoss && !isShop && i > 0 && diff) {
      const chance = diff.miniBossChance ?? 0;
      if (Math.random() < chance) {
        const type = enemyPool[randInt(0, enemyPool.length - 1)];
        const mb = createMiniBoss(
          rand(margin + 80, ROOM_WIDTH - margin - 80),
          rand(margin + 80, ROOM_HEIGHT - margin - 80),
          type, diff,
        );
        mb.hp = Math.floor(mb.hp * (1 + floor * 0.3));
        mb.maxHp = mb.hp;
        enemies.push(mb);
      }
    }

    if ((Math.random() < 0.4 || isBoss) && !isShop) {
      pickups.push({
        pos: { x: rand(margin, ROOM_WIDTH - margin), y: rand(margin, ROOM_HEIGHT - margin) },
        type: 'health',
        value: 25,
      });
    }

    if (!isShop) {
      const goldCount = randInt(1, 3);
      for (let g = 0; g < goldCount; g++) {
        pickups.push({
          pos: { x: rand(margin, ROOM_WIDTH - margin), y: rand(margin, ROOM_HEIGHT - margin) },
          type: 'gold',
          value: randInt(1, 3),
        });
      }
    }

    // ---- Chests: reward exploration in normal rooms ----
    const chests: Chest[] = [];
    if (isShop) {
      chests.push({ pos: { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 - 60 }, kind: 'golden', opened: false, bob: 0 });
      if (treasureBonus > 0) {
        chests.push({ pos: { x: ROOM_WIDTH / 2 + 90, y: ROOM_HEIGHT / 2 - 40 }, kind: 'wooden', opened: false, bob: 1 });
      }
    } else if (!isBoss && i > 0) {
      const bonus = chestChanceBonus(loadMeta());
      if (Math.random() < 0.22 + bonus) {
        const golden = Math.random() < 0.18 + floor * 0.05;
        chests.push({
          pos: { x: rand(margin + 40, ROOM_WIDTH - margin - 40), y: rand(margin + 40, ROOM_HEIGHT - margin - 40) },
          kind: golden ? 'golden' : 'wooden',
          opened: false,
          bob: Math.random() * Math.PI * 2,
        });
      }
    }

    const doors: Door[] = [];
    const c = cells[i];
    for (const dir of DIRS) {
      const j = cells.findIndex(o => o.x === c.x + dir.dx && o.y === c.y + dir.dy);
      if (j >= 0) doors.push({ pos: doorPos(dir.name), direction: dir.name, leadsTo: j });
    }

    rooms.push({
      x: 0,
      y: 0,
      width: ROOM_WIDTH,
      height: ROOM_HEIGHT,
      enemies,
      boss: isBoss ? createBoss(floor, diff) : null,
      pickups,
      chests,
      cleared: isShop, // treasure rooms are pre-cleared
      doors,
      walls: (i === 0 || isShop) ? [] : generateWalls(i, floor),
      isBossRoom: isBoss,
      isTreasureRoom: isShop,
      gridX: c.x,
      gridY: c.y,
      visited: i === 0,
    });

  }

  return rooms;
}
