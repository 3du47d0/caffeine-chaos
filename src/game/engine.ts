import {
  GameState, Player, Projectile, Particle, Vec2, Enemy, Upgrades, Boss, RunBuff, RunStats,
} from './types';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, PLAYER_SPEED, PLAYER_HP,
  PLAYER_SHOOT_COOLDOWN, PLAYER_DASH_COOLDOWN, PLAYER_DASH_DURATION,
  PLAYER_DASH_SPEED, PLAYER_ULTIMATE_COOLDOWN, PLAYER_INVINCIBLE_AFTER_HIT,
  BEAN_SPEED, BEAN_DAMAGE, BEAN_SIZE, ENEMY_CONFIGS, ROOMS_PER_FLOOR, TOTAL_FLOORS,
  IN_RUN_SHOP_ITEMS,
} from './constants';
import { generateFloor } from './rooms';
import { defaultRunBuffs, drawRewards, drawHighRarityRewards } from './buffs';
import { getAchievementBonuses, loadAchievementProgress, allAchievementsUnlocked } from './achievements';
import { acquireProjectile, acquireParticle, projectilePool, particlePool } from './pool';
import { getCharacter, CharacterId, unlockCharacter } from './characters';
import { getDifficulty, DifficultyId, unlockImpossible } from './difficulty';
import { unlockSupremo } from './characters';
import { getFloorTheme } from './floors';

// ---- Pre-allocated reusable vectors to avoid GC ----
const _tmpVec: Vec2 = { x: 0, y: 0 };
const _tmpVec2: Vec2 = { x: 0, y: 0 };
const _tmpNorm: Vec2 = { x: 0, y: 0 };

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// In-place normalize into output vec, returns output
function normalizeInto(v: Vec2, out: Vec2): Vec2 {
  const d = Math.sqrt(v.x * v.x + v.y * v.y);
  if (d === 0) { out.x = 0; out.y = 0; }
  else { out.x = v.x / d; out.y = v.y / d; }
  return out;
}

// Allocating normalize - only use in non-hot paths
function normalize(v: Vec2): Vec2 {
  const d = Math.sqrt(v.x * v.x + v.y * v.y);
  if (d === 0) return { x: 0, y: 0 };
  return { x: v.x / d, y: v.y / d };
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function spawnParticles(state: GameState, pos: Vec2, color: string, count: number, speed: number = 3) {
  const adjustedCount = Math.max(1, Math.round(count * (state.particleMultiplier ?? 1)));
  for (let i = 0; i < adjustedCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * speed;
    const lt = 20 + Math.random() * 20;
    state.particles.push(acquireParticle(
      pos.x, pos.y,
      Math.cos(angle) * spd, Math.sin(angle) * spd,
      lt, color, 2 + Math.random() * 3,
    ));
  }
}

function rectCollision(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function defaultRunStats(): RunStats {
  return {
    enemiesKilled: 0, damageTaken: 0, bossesDefeated: 0, roomsCleared: 0,
    goldCollected: 0, dashesUsed: 0, ultimatesUsed: 0, perfectRooms: 0,
    fastRooms: 0, totalDamageDealt: 0, perfectBoss: false, floorDamageTaken: 0, perfectFloor: false,
  };
}

// ---- Cached per-run computations ----
// These are computed once at run start and cached on state
export interface RunCache {
  achieveBonuses: { damageBonus: number; hpBonus: number; speedBonus: number; goldBonus: number; dashBonus: number };
  charData: ReturnType<typeof getCharacter>;
  diffData: ReturnType<typeof getDifficulty>;
  floorTheme: ReturnType<typeof getFloorTheme>;
}

function buildRunCache(state: GameState): RunCache {
  const progress = loadAchievementProgress();
  return {
    achieveBonuses: getAchievementBonuses(progress),
    charData: getCharacter(state.characterId as CharacterId),
    diffData: getDifficulty(state.difficulty as DifficultyId),
    floorTheme: getFloorTheme(state.floor),
  };
}

export function createInitialState(
  upgrades: Upgrades,
  difficultyId: DifficultyId = 'medium',
  characterId: CharacterId = 'barista',
): GameState {
  const diff = getDifficulty(difficultyId);
  const char = getCharacter(characterId);
  const rooms = generateFloor(0, ROOMS_PER_FLOOR, diff);
  const achieveProgress = loadAchievementProgress();
  const bonuses = getAchievementBonuses(achieveProgress);

  const baseHp = Math.floor((PLAYER_HP + upgrades.maxHpBonus * 25 + bonuses.hpBonus) * char.hpMult);

  const player: Player = {
    pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    vel: { x: 0, y: 0 },
    size: PLAYER_SIZE,
    hp: baseHp,
    maxHp: baseHp,
    dashCooldown: 0,
    dashTimer: 0,
    ultimateCooldown: 0,
    ultimateTimer: 0,
    invincibleTimer: 0,
    facing: { x: 0, y: -1 },
    shootCooldown: 0,
    shield: false,
  };

  const state: GameState = {
    phase: 'playing',
    player,
    rooms,
    currentRoom: 0,
    projectiles: [],
    particles: [],
    goldCollected: 0,
    totalGold: 0,
    roomsCleared: 0,
    totalRooms: ROOMS_PER_FLOOR * TOTAL_FLOORS,
    floor: 0,
    keys: new Set(),
    mousePos: { x: CANVAS_WIDTH / 2, y: 0 },
    mouseDown: false,
    upgrades,
    runBuffs: defaultRunBuffs(),
    screenShake: 0,
    damageFlash: 0,
    exitPortal: null,
    secretPortal: null,
    clearMessageTimer: 0,
    transitionTimer: 0,
    transitionTarget: null,
    rewardChoices: [],
    runTimer: 0,
    roomTimer: 0,
    roomTimes: [],
    fastBrewTimer: 0,
    particleMultiplier: 1,
    runStats: defaultRunStats(),
    roomDamageTaken: 0,
    isBossRoom: false,
    secretBossDefeated: false,
    showSecretPortals: false,
    difficulty: difficultyId,
    characterId,
    restartHoldTimer: 0,
    rewardPortal: null,
    rewardReturnRoom: 0,
    rewardReturnFloor: 0,
    _cache: null as any,
  };

  state._cache = buildRunCache(state);
  return state;
}

export function buyInRunUpgrade(state: GameState, id: keyof Upgrades, cost: number): boolean {
  if (state.goldCollected >= cost) {
    state.goldCollected -= cost;
    state.upgrades[id]++;
    if (id === 'maxHpBonus') {
      state.player.maxHp += 25;
      state.player.hp = Math.min(state.player.hp + 25, state.player.maxHp);
    }
    // Refresh cache since upgrades changed
    state._cache = buildRunCache(state);
    return true;
  }
  return false;
}

export function leaveShop(state: GameState): void {
  state.phase = 'playing';
  const portalX = 100 + Math.random() * (CANVAS_WIDTH - 200);
  const portalY = 100 + Math.random() * (CANVAS_HEIGHT - 200);
  state.exitPortal = { pos: { x: portalX, y: portalY }, active: true };
}

export function applyRunBuff(state: GameState, buff: RunBuff): GameState {
  state.runBuffs[buff.id]++;

  switch (buff.id) {
    case 'termo':
      state.player.maxHp += 50;
      state.player.hp = Math.min(state.player.hp + 50, state.player.maxHp);
      break;
    case 'leite_aveia':
      state.player.shield = true;
      break;
  }

  // Refresh cache since buffs changed
  state._cache = buildRunCache(state);

  // If in reward_room phase, return to playing — no transition needed since player never left
  if (state.phase === 'reward_room') {
    state.phase = 'playing';
    state.rewardChoices = [];
    // Regenerate exit portal since the old one may have been consumed
    const portalX = 100 + Math.random() * (CANVAS_WIDTH - 200);
    const portalY = 100 + Math.random() * (CANVAS_HEIGHT - 200);
    state.exitPortal = { pos: { x: portalX, y: portalY }, active: true };
    return state;
  }

  state.phase = 'playing';
  state.rewardChoices = [];

  const isLastRoom = state.currentRoom >= state.rooms.length - 1;
  if (isLastRoom) {
    if (state.floor >= TOTAL_FLOORS - 1) {
      const progress = loadAchievementProgress();
      if (allAchievementsUnlocked(progress)) {
        state.showSecretPortals = true;
        state.exitPortal = { pos: { x: CANVAS_WIDTH / 2 - 80, y: CANVAS_HEIGHT / 2 }, active: true, type: 'finish' };
        state.secretPortal = { pos: { x: CANVAS_WIDTH / 2 + 80, y: CANVAS_HEIGHT / 2 }, active: true, type: 'secret' };
      } else {
        state.phase = 'victory';
      }
    } else {
      state.transitionTimer = 60;
      state.transitionTarget = { floor: state.floor + 1, room: 0 };
    }
  } else {
    state.transitionTimer = 60;
    state.transitionTarget = { floor: state.floor, room: state.currentRoom + 1 };
  }

  return state;
}

function updateBoss(state: GameState, boss: Boss) {
  const { player } = state;
  const margin = 60;

  boss.angle += 0.04;
  boss.moveTimer--;
  boss.shootTimer--;
  boss.summonTimer--;

  switch (boss.type) {
    case 'grinder': {
      if (boss.moveTimer <= 0) {
        boss.moveTimer = 30;
        _tmpVec.x = player.pos.x - boss.pos.x;
        _tmpVec.y = player.pos.y - boss.pos.y;
        normalizeInto(_tmpVec, _tmpNorm);
        boss.pos.x += _tmpNorm.x * 2.5;
        boss.pos.y += _tmpNorm.y * 2.5;
      }
      if (boss.shootTimer <= 0) {
        boss.shootTimer = 80;
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8 + boss.angle;
          state.projectiles.push(acquireProjectile(
            boss.pos.x, boss.pos.y,
            Math.cos(a) * 3.5, Math.sin(a) * 3.5,
            5, 15, false, 80,
          ));
        }
      }
      break;
    }
    case 'steam_king': {
      if (boss.moveTimer <= 0) {
        boss.moveTimer = 60;
        const angle = Math.random() * Math.PI * 2;
        boss.pos.x = clamp(boss.pos.x + Math.cos(angle) * 80, margin + boss.size, CANVAS_WIDTH - margin - boss.size);
        boss.pos.y = clamp(boss.pos.y + Math.sin(angle) * 80, margin + boss.size, CANVAS_HEIGHT - margin - boss.size);
      }
      if (boss.shootTimer <= 0) {
        boss.shootTimer = 90;
        for (let i = 0; i < 3; i++) {
          const tx = 100 + Math.random() * (CANVAS_WIDTH - 200);
          const ty = 100 + Math.random() * (CANVAS_HEIGHT - 200);
          state.projectiles.push(acquireProjectile(
            tx, ty, 0, 0, 28, 8, false, 120, { isBurnZone: true },
          ));
        }
      }
      if (Math.floor(boss.angle * 10) % 60 === 0) {
        boss.invisibleTimer = boss.invisibleTimer > 0 ? 0 : 60;
      }
      if (boss.invisibleTimer > 0) boss.invisibleTimer--;
      break;
    }
    case 'overflowing_pot': {
      boss.pos.x = CANVAS_WIDTH / 2;
      boss.pos.y = 170;
      if (boss.shootTimer <= 0) {
        boss.shootTimer = 50;
        boss.phase = (boss.phase + 1) % 2;
        const count = 12;
        for (let i = 0; i < count; i++) {
          const a = (Math.PI * 2 * i) / count + (boss.phase * Math.PI) / count;
          state.projectiles.push(acquireProjectile(
            boss.pos.x, boss.pos.y,
            Math.cos(a) * 2.8, Math.sin(a) * 2.8,
            6, 12, false, 100,
          ));
        }
      }
      if (boss.summonTimer <= 0) {
        boss.summonTimer = 200;
        const room = state.rooms[state.currentRoom];
        for (let i = 0; i < 2; i++) {
          room.enemies.push({
            pos: { x: 150 + Math.random() * 500, y: 150 + Math.random() * 300 },
            vel: { x: 0, y: 0 }, size: 14, hp: 40, maxHp: 40, type: 'angry_cup',
            shootTimer: 60, moveTimer: 30,
            targetPos: { x: player.pos.x, y: player.pos.y }, dropGold: 2,
          });
        }
      }
      break;
    }
    case 'secret_boss': {
      const hpRatio = boss.hp / boss.maxHp;

      if (hpRatio > 0.7) {
        if (boss.moveTimer <= 0) {
          boss.moveTimer = 20;
          _tmpVec.x = player.pos.x - boss.pos.x;
          _tmpVec.y = player.pos.y - boss.pos.y;
          normalizeInto(_tmpVec, _tmpNorm);
          boss.pos.x += _tmpNorm.x * 3;
          boss.pos.y += _tmpNorm.y * 3;
        }
        if (boss.shootTimer <= 0) {
          boss.shootTimer = 40;
          for (let i = 0; i < 12; i++) {
            const a = (Math.PI * 2 * i) / 12 + boss.angle;
            state.projectiles.push(acquireProjectile(
              boss.pos.x, boss.pos.y,
              Math.cos(a) * 4, Math.sin(a) * 4,
              5, 18, false, 90,
            ));
          }
        }
      } else if (hpRatio > 0.4) {
        if (boss.moveTimer <= 0) {
          boss.moveTimer = 15;
          _tmpVec.x = player.pos.x - boss.pos.x;
          _tmpVec.y = player.pos.y - boss.pos.y;
          normalizeInto(_tmpVec, _tmpNorm);
          boss.pos.x += _tmpNorm.x * 4;
          boss.pos.y += _tmpNorm.y * 4;
        }
        if (boss.shootTimer <= 0) {
          boss.shootTimer = 30;
          _tmpVec.x = player.pos.x - boss.pos.x;
          _tmpVec.y = player.pos.y - boss.pos.y;
          normalizeInto(_tmpVec, _tmpNorm);
          for (let i = -1; i <= 1; i++) {
            const spread = i * 0.3;
            const cos = Math.cos(spread), sin = Math.sin(spread);
            const vx = _tmpNorm.x * cos - _tmpNorm.y * sin;
            const vy = _tmpNorm.x * sin + _tmpNorm.y * cos;
            state.projectiles.push(acquireProjectile(
              boss.pos.x, boss.pos.y,
              vx * 5, vy * 5,
              6, 20, false, 80,
            ));
          }
        }
        if (boss.summonTimer <= 0) {
          boss.summonTimer = 120;
          for (let i = 0; i < 4; i++) {
            state.projectiles.push(acquireProjectile(
              100 + Math.random() * (CANVAS_WIDTH - 200),
              100 + Math.random() * (CANVAS_HEIGHT - 200),
              0, 0, 35, 10, false, 150, { isBurnZone: true, isVortex: true },
            ));
          }
        }
      } else {
        boss.enrageTimer = (boss.enrageTimer || 0) + 1;
        boss.teleportTimer = (boss.teleportTimer || 0) - 1;

        if (boss.teleportTimer! <= 0) {
          boss.teleportTimer = 90;
          boss.pos.x = 100 + Math.random() * (CANVAS_WIDTH - 200);
          boss.pos.y = 100 + Math.random() * (CANVAS_HEIGHT - 200);
          spawnParticles(state, boss.pos, '#FF00FF', 15, 5);
          state.screenShake = 4;
        }

        if (boss.shootTimer <= 0) {
          boss.shootTimer = 20;
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6 + boss.enrageTimer! * 0.1;
            state.projectiles.push(acquireProjectile(
              boss.pos.x, boss.pos.y,
              Math.cos(a) * 3.5, Math.sin(a) * 3.5,
              5, 15, false, 100,
            ));
          }
          _tmpVec.x = player.pos.x - boss.pos.x;
          _tmpVec.y = player.pos.y - boss.pos.y;
          normalizeInto(_tmpVec, _tmpNorm);
          state.projectiles.push(acquireProjectile(
            boss.pos.x, boss.pos.y,
            _tmpNorm.x * 6, _tmpNorm.y * 6,
            8, 25, false, 60,
          ));
        }
        if (boss.summonTimer <= 0) {
          boss.summonTimer = 150;
          const room = state.rooms[state.currentRoom];
          for (let i = 0; i < 3; i++) {
            room.enemies.push({
              pos: { x: 150 + Math.random() * 500, y: 150 + Math.random() * 300 },
              vel: { x: 0, y: 0 }, size: 14, hp: 50, maxHp: 50, type: 'drone',
              shootTimer: 40, moveTimer: 20,
              targetPos: { x: player.pos.x, y: player.pos.y }, dropGold: 3,
            });
          }
        }
      }
      break;
    }
  }

  boss.pos.x = clamp(boss.pos.x, margin + boss.size, CANVAS_WIDTH - margin - boss.size);
  boss.pos.y = clamp(boss.pos.y, margin + boss.size, CANVAS_HEIGHT - margin - boss.size);

  if (player.invincibleTimer <= 0 && dist(player.pos, boss.pos) < player.size + boss.size) {
    takeDamage(state, 20);
  }
}

function takeDamage(state: GameState, amount: number) {
  const { player } = state;
  if (player.invincibleTimer > 0) return;

  if (player.shield) {
    player.shield = false;
    spawnParticles(state, player.pos, '#87CEEB', 10, 4);
    player.invincibleTimer = 30;
    return;
  }

  player.hp -= amount;
  player.invincibleTimer = PLAYER_INVINCIBLE_AFTER_HIT;
  state.screenShake = 5;
  state.damageFlash = 6;
  state.roomDamageTaken += amount;
  state.runStats.damageTaken += amount;
  spawnParticles(state, player.pos, '#C0392B', 8);
}

function getDamageMult(state: GameState): number {
  const cache = state._cache!;
  return (1 + state.upgrades.damageBonus * 0.1 + cache.achieveBonuses.damageBonus) * (1 + state.runBuffs.torrado * 0.2) * cache.charData.damageMult;
}

function getSpeedMult(state: GameState): number {
  const cache = state._cache!;
  return (1 + state.upgrades.speedBonus * 0.1 + cache.achieveBonuses.speedBonus) * (1 + state.runBuffs.descaf * 0.2) * cache.charData.speedMult;
}

function getShootCooldown(state: GameState): number {
  const cache = state._cache!;
  const chantillyBonus = 1 - state.runBuffs.chantilly * 0.15;
  return Math.max(3, Math.floor(PLAYER_SHOOT_COOLDOWN * chantillyBonus * cache.charData.shootCdMult));
}

// Reward portal chance (2-5%)
const REWARD_PORTAL_CHANCE = 0.04;

export const RESTART_HOLD_FRAMES = 90; // 1.5s at 60fps

// Fixed timestep: physics runs at 60fps regardless of display refresh rate
const FIXED_DT = 1000 / 60;

export function update(state: GameState): GameState {
  if (state.phase !== 'playing' && state.phase !== 'shop' && state.phase !== 'reward_room') return state;
  if (state.phase === 'shop') return state;
  if (state.phase === 'reward_room') return state;

  // Rebuild cache if missing (e.g. after floor transition)
  if (!state._cache) {
    state._cache = buildRunCache(state);
  }

  // Quick restart: hold R
  if (state.keys.has('r')) {
    state.restartHoldTimer++;
    if (state.restartHoldTimer >= RESTART_HOLD_FRAMES) {
      state.phase = 'gameover';
      state.restartHoldTimer = 0;
      (state as any)._quickRestart = true;
      return state;
    }
  } else {
    state.restartHoldTimer = 0;
  }

  if (state.transitionTimer > 0) {
    state.transitionTimer--;
    if (state.transitionTimer === 30) {
      const target = state.transitionTarget!;
      if (target.floor !== state.floor) {
        cleanupRoomData(state);
        state.floor = target.floor;
        state.rooms = generateFloor(state.floor, ROOMS_PER_FLOOR, getDifficulty(state.difficulty as DifficultyId));
        state.currentRoom = 0;
        state._cache = buildRunCache(state);
      } else {
        // Clean up cleared rooms to free memory
        cleanupNonCurrentRooms(state, target.room);
        state.currentRoom = target.room;
      }
      state.player.pos.x = CANVAS_WIDTH / 2;
      state.player.pos.y = CANVAS_HEIGHT / 2;
      // Release projectiles back to pool
      for (let i = 0; i < state.projectiles.length; i++) {
        projectilePool.release(state.projectiles[i]);
      }
      state.projectiles.length = 0;
      // Release particles back to pool
      for (let i = 0; i < state.particles.length; i++) {
        particlePool.release(state.particles[i]);
      }
      state.particles.length = 0;
      state.exitPortal = null;
      state.secretPortal = null;
      state.rewardPortal = null;
      state.clearMessageTimer = 0;
      state.roomTimer = 0;
      state.roomDamageTaken = 0;
      if (state.runBuffs.leite_aveia > 0) {
        state.player.shield = true;
      }
    }
    if (state.transitionTimer === 0) {
      state.transitionTarget = null;
    }
    return state;
  }

  state.runTimer++;
  state.roomTimer++;
  if (state.fastBrewTimer > 0) state.fastBrewTimer--;

  // Fire hazards on furnace floor
  const cache = state._cache!;
  if (cache.floorTheme.fireHazards && state.runTimer % 180 === 0) {
    state.projectiles.push(acquireProjectile(
      80 + Math.random() * (CANVAS_WIDTH - 160),
      80 + Math.random() * (CANVAS_HEIGHT - 160),
      0, 0, 24, 6, false, 150, { isBurnZone: true },
    ));
  }

  const { player, keys } = state;
  const room = state.rooms[state.currentRoom];
  const margin = 50;
  const damageMult = getDamageMult(state);
  const speedMult = getSpeedMult(state);
  const dashCdr = (1 - state.upgrades.dashCdrBonus * 0.15) * (1 - cache.achieveBonuses.dashBonus);
  const dashSpeedMult = 1 + state.runBuffs.descaf * 0.2;
  const diff = cache.diffData;

  state.isBossRoom = room.isBossRoom;

  // Shop rooms trigger shop phase on enter (only once)
  if (room.isShopRoom && state.phase === 'playing' && !room.shopVisited) {
    room.shopVisited = true;
    state.phase = 'shop';
    return state;
  }

  let dx = 0, dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;

  _tmpVec.x = dx; _tmpVec.y = dy;
  normalizeInto(_tmpVec, _tmpNorm);
  const moveDirX = _tmpNorm.x;
  const moveDirY = _tmpNorm.y;
  const speed = player.dashTimer > 0 ? PLAYER_DASH_SPEED * dashSpeedMult : PLAYER_SPEED * speedMult;

  // Icy floor: add momentum/sliding
  const isIcy = cache.floorTheme.icyFloor && player.dashTimer <= 0;

  if (player.dashTimer > 0) {
    player.pos.x += player.facing.x * speed;
    player.pos.y += player.facing.y * speed;
    player.dashTimer--;
  } else if (isIcy) {
    const friction = 0.88;
    const accel = 0.35;
    player.vel.x = player.vel.x * friction + moveDirX * speed * accel;
    player.vel.y = player.vel.y * friction + moveDirY * speed * accel;
    player.pos.x += player.vel.x;
    player.pos.y += player.vel.y;
  } else {
    player.vel.x = moveDirX * speed;
    player.vel.y = moveDirY * speed;
    player.pos.x += player.vel.x;
    player.pos.y += player.vel.y;
  }

  _tmpVec.x = state.mousePos.x - player.pos.x;
  _tmpVec.y = state.mousePos.y - player.pos.y;
  normalizeInto(_tmpVec, _tmpNorm);
  if (_tmpNorm.x !== 0 || _tmpNorm.y !== 0) {
    player.facing.x = _tmpNorm.x;
    player.facing.y = _tmpNorm.y;
  }

  player.pos.x = clamp(player.pos.x, margin + player.size, CANVAS_WIDTH - margin - player.size);
  player.pos.y = clamp(player.pos.y, margin + player.size, CANVAS_HEIGHT - margin - player.size);

  // ---- Smooth wall collision with slide (circle vs AABB) ----
  for (let wi = 0; wi < room.walls.length; wi++) {
    const wall = room.walls[wi];
    const ps = player.size;
    // Find closest point on wall rect to player center
    const closestX = clamp(player.pos.x, wall.x, wall.x + wall.w);
    const closestY = clamp(player.pos.y, wall.y, wall.y + wall.h);
    const distX = player.pos.x - closestX;
    const distY = player.pos.y - closestY;
    const distSq = distX * distX + distY * distY;

    if (distSq < ps * ps && distSq > 0) {
      const d = Math.sqrt(distSq);
      const overlap = ps - d;
      const nx = distX / d;
      const ny = distY / d;
      player.pos.x += nx * overlap;
      player.pos.y += ny * overlap;
      // Cancel velocity into wall for smooth sliding
      const dot = player.vel.x * nx + player.vel.y * ny;
      if (dot < 0) {
        player.vel.x -= dot * nx;
        player.vel.y -= dot * ny;
      }
    } else if (distSq === 0) {
      // Player center inside wall — push out on shortest axis
      const cx = wall.x + wall.w / 2;
      const cy = wall.y + wall.h / 2;
      const dx2 = player.pos.x - cx;
      const dy2 = player.pos.y - cy;
      const halfW = wall.w / 2 + ps;
      const halfH = wall.h / 2 + ps;
      const overlapX = halfW - Math.abs(dx2);
      const overlapY = halfH - Math.abs(dy2);
      if (overlapX < overlapY) {
        player.pos.x += dx2 > 0 ? overlapX : -overlapX;
        player.vel.x = 0;
      } else {
        player.pos.y += dy2 > 0 ? overlapY : -overlapY;
        player.vel.y = 0;
      }
    }
  }

  if (player.shootCooldown > 0) player.shootCooldown--;
  if (player.dashCooldown > 0) player.dashCooldown--;
  if (player.ultimateCooldown > 0) player.ultimateCooldown--;
  if (player.invincibleTimer > 0) player.invincibleTimer--;
  if (state.screenShake > 0) state.screenShake -= 0.5;
  if (state.damageFlash > 0) state.damageFlash--;

  // Dash
  if (keys.has(' ') && player.dashCooldown <= 0 && player.dashTimer <= 0) {
    player.dashTimer = PLAYER_DASH_DURATION;
    player.dashCooldown = Math.floor(PLAYER_DASH_COOLDOWN * dashCdr);
    player.invincibleTimer = PLAYER_DASH_DURATION;
    state.runStats.dashesUsed++;
    spawnParticles(state, player.pos, '#87CEEB', 8);

    for (let ei = 0; ei < room.enemies.length; ei++) {
      const enemy = room.enemies[ei];
      if (dist(player.pos, enemy.pos) < player.size + enemy.size + 20) {
        const dmg = 15 * damageMult;
        enemy.hp -= dmg;
        state.runStats.totalDamageDealt += dmg;
        spawnParticles(state, enemy.pos, '#FFD700', 5);
      }
    }
    if (room.boss && room.boss.hp > 0) {
      if (dist(player.pos, room.boss.pos) < player.size + room.boss.size + 20) {
        const dmg = 15 * damageMult;
        room.boss.hp -= dmg;
        state.runStats.totalDamageDealt += dmg;
      }
    }
  }

  // Ultimate
  if (keys.has('q') && player.ultimateCooldown <= 0) {
    player.ultimateCooldown = PLAYER_ULTIMATE_COOLDOWN;
    state.runStats.ultimatesUsed++;
    spawnParticles(state, player.pos, '#FFD700', 30, 6);
    spawnParticles(state, player.pos, '#FFF', 20, 5);
    state.screenShake = 8;

    for (let ei = 0; ei < room.enemies.length; ei++) {
      const enemy = room.enemies[ei];
      if (dist(player.pos, enemy.pos) < 200) {
        const dmg = 50 * damageMult;
        enemy.hp -= dmg;
        state.runStats.totalDamageDealt += dmg;
        spawnParticles(state, enemy.pos, '#D4A03A', 8);
      }
    }
    if (room.boss && room.boss.hp > 0 && dist(player.pos, room.boss.pos) < 200) {
      const dmg = 50 * damageMult;
      room.boss.hp -= dmg;
      state.runStats.totalDamageDealt += dmg;
    }
  }

  // Shooting
  const shootCooldown = getShootCooldown(state);
  if (state.mouseDown && player.shootCooldown <= 0 && player.dashTimer <= 0) {
    player.shootCooldown = shootCooldown;
    _tmpVec.x = state.mousePos.x - player.pos.x;
    _tmpVec.y = state.mousePos.y - player.pos.y;
    normalizeInto(_tmpVec, _tmpNorm);
    state.projectiles.push(acquireProjectile(
      player.pos.x + _tmpNorm.x * player.size,
      player.pos.y + _tmpNorm.y * player.size,
      _tmpNorm.x * BEAN_SPEED, _tmpNorm.y * BEAN_SPEED,
      BEAN_SIZE, BEAN_DAMAGE * damageMult, true, 60,
    ));
  }

  // Update enemies with new abilities
  const enemySpeedMult = diff.enemySpeedMult;
  const enemyDmgMult = diff.enemyDamageMult;
  const abilityChance = diff.enemyAbilityChance;

  for (let ei = 0; ei < room.enemies.length; ei++) {
    const enemy = room.enemies[ei];
    if (enemy.hp <= 0) continue;
    const config = ENEMY_CONFIGS[enemy.type];
    const isMiniBoss = enemy.isMiniBoss;

    enemy.moveTimer--;
    if (enemy.moveTimer <= 0) {
      enemy.moveTimer = 40 + Math.random() * 40;
      _tmpVec.x = player.pos.x - enemy.pos.x;
      _tmpVec.y = player.pos.y - enemy.pos.y;
      normalizeInto(_tmpVec, _tmpNorm);

      // Ability: Dash toward player
      if (abilityChance > 0 && Math.random() < abilityChance * 0.3) {
        enemy.pos.x += _tmpNorm.x * 60;
        enemy.pos.y += _tmpNorm.y * 60;
        spawnParticles(state, enemy.pos, '#FF4444', 4, 2);
      } else {
        enemy.targetPos.x = enemy.pos.x + _tmpNorm.x * 100 + (Math.random() - 0.5) * 80;
        enemy.targetPos.y = enemy.pos.y + _tmpNorm.y * 100 + (Math.random() - 0.5) * 80;
      }
    }

    _tmpVec.x = enemy.targetPos.x - enemy.pos.x;
    _tmpVec.y = enemy.targetPos.y - enemy.pos.y;
    normalizeInto(_tmpVec, _tmpNorm);
    enemy.pos.x += _tmpNorm.x * config.speed * enemySpeedMult;
    enemy.pos.y += _tmpNorm.y * config.speed * enemySpeedMult;
    enemy.pos.x = clamp(enemy.pos.x, margin + enemy.size, CANVAS_WIDTH - margin - enemy.size);
    enemy.pos.y = clamp(enemy.pos.y, margin + enemy.size, CANVAS_HEIGHT - margin - enemy.size);

    enemy.shootTimer--;
    if (enemy.shootTimer <= 0 && (enemy.type === 'angry_cup' || enemy.type === 'drone' || isMiniBoss)) {
      enemy.shootTimer = isMiniBoss ? 40 + Math.random() * 30 : 60 + Math.random() * 60;
      _tmpVec.x = player.pos.x - enemy.pos.x;
      _tmpVec.y = player.pos.y - enemy.pos.y;
      normalizeInto(_tmpVec, _tmpNorm);
      const dmg = Math.floor(config.damage * enemyDmgMult);

      // Ability: Spread shot for mini-bosses or high-ability enemies
      if (isMiniBoss || (abilityChance > 0 && Math.random() < abilityChance * 0.4)) {
        for (let s = -1; s <= 1; s++) {
          const spread = s * 0.25;
          const cos = Math.cos(spread), sin = Math.sin(spread);
          const vx = _tmpNorm.x * cos - _tmpNorm.y * sin;
          const vy = _tmpNorm.x * sin + _tmpNorm.y * cos;
          state.projectiles.push(acquireProjectile(
            enemy.pos.x, enemy.pos.y,
            vx * 3.5, vy * 3.5,
            4, dmg, false, 90,
          ));
        }
      } else {
        state.projectiles.push(acquireProjectile(
          enemy.pos.x, enemy.pos.y,
          _tmpNorm.x * 3, _tmpNorm.y * 3,
          4, dmg, false, 90,
        ));
      }
    }

    // Contact damage
    if (player.invincibleTimer <= 0 && dist(player.pos, enemy.pos) < player.size + enemy.size) {
      takeDamage(state, Math.floor(config.damage * enemyDmgMult));
    }
  }

  // Update boss
  if (room.boss && room.boss.hp > 0) {
    updateBoss(state, room.boss);
  }

  // Update projectiles — in-place compaction instead of .filter()
  let writeIdx = 0;
  for (let i = 0; i < state.projectiles.length; i++) {
    const proj = state.projectiles[i];
    if (!proj.isBurnZone) {
      proj.pos.x += proj.vel.x;
      proj.pos.y += proj.vel.y;
    }
    proj.lifetime--;

    let alive = true;

    if (proj.lifetime <= 0 || (!proj.isBurnZone && (proj.pos.x < 0 || proj.pos.x > CANVAS_WIDTH || proj.pos.y < 0 || proj.pos.y > CANVAS_HEIGHT))) {
      alive = false;
    }

    if (alive && !proj.isBurnZone) {
      for (let wi = 0; wi < room.walls.length; wi++) {
        const wall = room.walls[wi];
        if (proj.pos.x > wall.x && proj.pos.x < wall.x + wall.w && proj.pos.y > wall.y && proj.pos.y < wall.y + wall.h) {
          spawnParticles(state, proj.pos, '#888', 3);
          alive = false;
          break;
        }
      }
    }

    if (alive && proj.friendly) {
      for (let ei = 0; ei < room.enemies.length; ei++) {
        const enemy = room.enemies[ei];
        if (enemy.hp <= 0) continue;
        if (dist(proj.pos, enemy.pos) < proj.size + enemy.size) {
          enemy.hp -= proj.damage;
          state.runStats.totalDamageDealt += proj.damage;
          if (state.runBuffs.canela > 0 && Math.random() < 0.25) {
            enemy.hp -= 5;
            spawnParticles(state, enemy.pos, '#FF6B35', 3);
          }
          spawnParticles(state, proj.pos, '#6F4E37', 5);
          if (enemy.hp <= 0) {
            state.goldCollected += enemy.dropGold + cache.achieveBonuses.goldBonus;
            state.runStats.enemiesKilled++;
            spawnParticles(state, enemy.pos, '#FFD700', 12);
          }
          if (!proj.isBurnZone) { alive = false; break; }
        }
      }
      if (alive && room.boss && room.boss.hp > 0) {
        if (dist(proj.pos, room.boss.pos) < proj.size + room.boss.size) {
          room.boss.hp -= proj.damage;
          state.runStats.totalDamageDealt += proj.damage;
          if (state.runBuffs.canela > 0 && Math.random() < 0.25) {
            room.boss.hp -= 5;
            spawnParticles(state, room.boss.pos, '#FF6B35', 3);
          }
          spawnParticles(state, proj.pos, '#6F4E37', 5);
          if (room.boss.hp <= 0) {
            state.goldCollected += room.boss.dropGold;
            state.runStats.bossesDefeated++;
            spawnParticles(state, room.boss.pos, '#FFD700', 25, 6);
            state.screenShake = 10;

            if (room.boss.type === 'secret_boss') {
              state.secretBossDefeated = true;
              if (state.difficulty === 'hard') {
                unlockImpossible();
              }
              if (state.difficulty === 'impossible') {
                unlockSupremo();
              }
            }
          }
          if (!proj.isBurnZone) alive = false;
        }
      }
    } else if (alive && !proj.friendly) {
      if (proj.isBurnZone) {
        if (player.invincibleTimer <= 0 && dist(proj.pos, player.pos) < proj.size + player.size * 0.5) {
          takeDamage(state, proj.damage);
          player.invincibleTimer = 20;
        }
        // keep alive based on lifetime (already decremented)
      } else {
        if (player.invincibleTimer <= 0 && dist(proj.pos, player.pos) < proj.size + player.size) {
          takeDamage(state, proj.damage);
          alive = false;
        }
      }
    }

    if (alive) {
      state.projectiles[writeIdx++] = proj;
    } else {
      projectilePool.release(proj);
    }
  }
  state.projectiles.length = writeIdx;

  // Update particles — in-place compaction
  writeIdx = 0;
  for (let i = 0; i < state.particles.length; i++) {
    const p = state.particles[i];
    p.pos.x += p.vel.x;
    p.pos.y += p.vel.y;
    p.vel.x *= 0.95;
    p.vel.y *= 0.95;
    p.lifetime--;
    if (p.lifetime > 0) {
      state.particles[writeIdx++] = p;
    } else {
      particlePool.release(p);
    }
  }
  state.particles.length = writeIdx;

  // Remove dead enemies — in-place compaction
  writeIdx = 0;
  for (let i = 0; i < room.enemies.length; i++) {
    if (room.enemies[i].hp > 0) {
      room.enemies[writeIdx++] = room.enemies[i];
    }
  }
  room.enemies.length = writeIdx;

  // Check room cleared
  const bossAlive = room.boss !== null && room.boss.hp > 0;
  const allEnemiesDead = room.enemies.length === 0;

  if (!room.cleared && allEnemiesDead && !bossAlive) {
    room.cleared = true;
    state.roomsCleared++;
    state.runStats.roomsCleared++;
    state.clearMessageTimer = 120;
    spawnParticles(state, { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }, '#FFD700', 20, 5);

    const roomTime = state.roomTimer;
    state.roomTimes.push({ room: state.currentRoom, floor: state.floor, timeFrames: roomTime });
    state.roomTimer = 0;

    if (state.roomDamageTaken === 0) {
      state.runStats.perfectRooms++;
    }
    state.roomDamageTaken = 0;

    if (roomTime < 600) {
      state.fastBrewTimer = 120;
      state.runStats.fastRooms++;
    }

    if (room.isBossRoom) {
      if (room.isSecretBossRoom && state.secretBossDefeated) {
        state.phase = 'secret_victory';
      } else {
        state.rewardChoices = drawRewards(3);
        state.phase = 'reward';
      }
    } else {
      const portalX = 100 + Math.random() * (CANVAS_WIDTH - 200);
      const portalY = 100 + Math.random() * (CANVAS_HEIGHT - 200);
      state.exitPortal = { pos: { x: portalX, y: portalY }, active: true };

      // RNG: 2-5% chance of reward portal
      if (Math.random() < REWARD_PORTAL_CHANCE) {
        const rpX = 100 + Math.random() * (CANVAS_WIDTH - 200);
        const rpY = 100 + Math.random() * (CANVAS_HEIGHT - 200);
        state.rewardPortal = { pos: { x: rpX, y: rpY }, active: true, type: 'reward' };
      }
    }
  }

  // Pickup collision — in-place compaction
  writeIdx = 0;
  for (let i = 0; i < room.pickups.length; i++) {
    const pickup = room.pickups[i];
    if (dist(player.pos, pickup.pos) < player.size + 12) {
      if (pickup.type === 'health') {
        player.hp = Math.min(player.maxHp, player.hp + pickup.value);
        spawnParticles(state, pickup.pos, '#90EE90', 8);
      } else {
        state.goldCollected += pickup.value;
        state.runStats.goldCollected += pickup.value;
        spawnParticles(state, pickup.pos, '#FFD700', 6);
      }
    } else {
      room.pickups[writeIdx++] = pickup;
    }
  }
  room.pickups.length = writeIdx;

  // Exit portal collision
  if (state.exitPortal?.active && dist(player.pos, state.exitPortal.pos) < player.size + 24) {
    state.exitPortal.active = false;

    if (state.exitPortal.type === 'finish') {
      state.phase = 'victory';
    } else if (state.exitPortal.type === 'secret') {
      enterSecretBossRoom(state);
    } else {
      const isLastRoom = state.currentRoom >= state.rooms.length - 1;
      if (isLastRoom) {
        if (state.floor >= TOTAL_FLOORS - 1) {
          state.phase = 'victory';
        } else {
          state.transitionTimer = 60;
          state.transitionTarget = { floor: state.floor + 1, room: 0 };
        }
      } else {
        state.transitionTimer = 60;
        state.transitionTarget = { floor: state.floor, room: state.currentRoom + 1 };
      }
    }
  }

  // Secret portal collision
  if (state.secretPortal?.active && dist(player.pos, state.secretPortal.pos) < player.size + 24) {
    state.secretPortal.active = false;
    if (state.secretPortal.type === 'secret') {
      enterSecretBossRoom(state);
    } else {
      state.phase = 'victory';
    }
  }

  // Reward portal collision
  if (state.rewardPortal?.active && dist(player.pos, state.rewardPortal.pos) < player.size + 24) {
    state.rewardPortal.active = false;
    enterRewardRoom(state);
  }

  // Door collision (backward navigation)
  if (room.cleared) {
    for (let di = 0; di < room.doors.length; di++) {
      const door = room.doors[di];
      if (door.direction === 'south' && dist(player.pos, door.pos) < player.size + 20) {
        state.currentRoom = door.leadsTo;
        state.projectiles.length = 0;
        player.pos.x = CANVAS_WIDTH / 2;
        player.pos.y = 80;
        state.exitPortal = null;
        state.rewardPortal = null;
        break;
      }
    }
  }

  // Player death
  if (player.hp <= 0) {
    state.phase = 'gameover';
    spawnParticles(state, player.pos, '#C0392B', 20, 5);
  }

  return state;
}

// Clean up old room data to prevent memory leaks during floor transitions
function cleanupRoomData(state: GameState) {
  for (let i = 0; i < state.particles.length; i++) {
    particlePool.release(state.particles[i]);
  }
  state.particles.length = 0;
  for (let i = 0; i < state.projectiles.length; i++) {
    projectilePool.release(state.projectiles[i]);
  }
  state.projectiles.length = 0;
  // Free all room data
  for (let i = 0; i < state.rooms.length; i++) {
    const r = state.rooms[i];
    r.enemies.length = 0;
    r.pickups.length = 0;
    r.walls.length = 0;
  }
  state.rooms.length = 0;
}

// Clean up cleared rooms that aren't current to reduce memory
function cleanupNonCurrentRooms(state: GameState, targetRoom: number) {
  for (let i = 0; i < state.rooms.length; i++) {
    if (i === targetRoom) continue;
    const r = state.rooms[i];
    if (r.cleared) {
      r.enemies.length = 0;
      r.pickups.length = 0;
    }
  }
}

function enterRewardRoom(state: GameState) {
  state.rewardReturnRoom = state.currentRoom;
  state.rewardReturnFloor = state.floor;
  state.rewardChoices = drawHighRarityRewards(3);
  state.phase = 'reward_room';
}

function enterSecretBossRoom(state: GameState) {
  const secretBossHp = Math.floor(800 * 1.7);
  const secretRoom = {
    x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
    enemies: [],
    boss: {
      pos: { x: CANVAS_WIDTH / 2, y: 160 },
      vel: { x: 0, y: 0 }, size: 42, hp: secretBossHp, maxHp: secretBossHp,
      type: 'secret_boss' as const,
      shootTimer: 30, moveTimer: 15, phase: 0, angle: 0,
      invisibleTimer: 0, summonTimer: 100, dropGold: 100,
      enrageTimer: 0, teleportTimer: 60, shieldActive: false, shieldHp: 0,
    },
    pickups: [
      { pos: { x: 150, y: 450 }, type: 'health' as const, value: 50 },
      { pos: { x: 650, y: 450 }, type: 'health' as const, value: 50 },
    ],
    cleared: false,
    doors: [],
    walls: [],
    isBossRoom: true,
    isSecretBossRoom: true,
  };

  state.rooms.push(secretRoom);
  state.currentRoom = state.rooms.length - 1;
  state.player.pos.x = CANVAS_WIDTH / 2;
  state.player.pos.y = CANVAS_HEIGHT - 100;
  state.projectiles.length = 0;
  state.particles.length = 0;
  state.exitPortal = null;
  state.rewardPortal = null;
}
