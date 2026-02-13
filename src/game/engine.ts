import {
  GameState, Player, Projectile, Particle, Vec2, Enemy, Upgrades,
} from './types';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, PLAYER_SPEED, PLAYER_HP,
  PLAYER_SHOOT_COOLDOWN, PLAYER_DASH_COOLDOWN, PLAYER_DASH_DURATION,
  PLAYER_DASH_SPEED, PLAYER_ULTIMATE_COOLDOWN, PLAYER_INVINCIBLE_AFTER_HIT,
  BEAN_SPEED, BEAN_DAMAGE, BEAN_SIZE, ENEMY_CONFIGS, ROOMS_PER_FLOOR, TOTAL_FLOORS,
} from './constants';
import { generateFloor } from './rooms';

function dist(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function normalize(v: Vec2): Vec2 {
  const d = Math.sqrt(v.x * v.x + v.y * v.y);
  if (d === 0) return { x: 0, y: 0 };
  return { x: v.x / d, y: v.y / d };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function spawnParticles(state: GameState, pos: Vec2, color: string, count: number, speed: number = 3) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * speed;
    state.particles.push({
      pos: { x: pos.x, y: pos.y },
      vel: { x: Math.cos(angle) * spd, y: Math.sin(angle) * spd },
      lifetime: 20 + Math.random() * 20,
      maxLifetime: 40,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

function rectCollision(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function createInitialState(upgrades: Upgrades): GameState {
  const rooms = generateFloor(0, ROOMS_PER_FLOOR);

  const player: Player = {
    pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    vel: { x: 0, y: 0 },
    size: PLAYER_SIZE,
    hp: PLAYER_HP + upgrades.maxHpBonus * 25,
    maxHp: PLAYER_HP + upgrades.maxHpBonus * 25,
    dashCooldown: 0,
    dashTimer: 0,
    ultimateCooldown: 0,
    ultimateTimer: 0,
    invincibleTimer: 0,
    facing: { x: 0, y: -1 },
    shootCooldown: 0,
  };

  return {
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
    screenShake: 0,
    damageFlash: 0,
  };
}

export function update(state: GameState): GameState {
  if (state.phase !== 'playing') return state;

  const { player, keys } = state;
  const room = state.rooms[state.currentRoom];
  const margin = 50;
  const damageMult = 1 + state.upgrades.damageBonus * 0.1;
  const speedMult = 1 + state.upgrades.speedBonus * 0.1;
  const dashCdr = 1 - state.upgrades.dashCdrBonus * 0.15;

  // Player movement
  let dx = 0, dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;

  const moveDir = normalize({ x: dx, y: dy });
  const speed = player.dashTimer > 0 ? PLAYER_DASH_SPEED : PLAYER_SPEED * speedMult;

  if (player.dashTimer > 0) {
    player.pos.x += player.facing.x * speed;
    player.pos.y += player.facing.y * speed;
    player.dashTimer--;
  } else {
    player.pos.x += moveDir.x * speed;
    player.pos.y += moveDir.y * speed;
  }

  // Facing direction (toward mouse)
  const toMouse = normalize({
    x: state.mousePos.x - player.pos.x,
    y: state.mousePos.y - player.pos.y,
  });
  if (toMouse.x !== 0 || toMouse.y !== 0) {
    player.facing = toMouse;
  }

  // Clamp to room bounds
  player.pos.x = clamp(player.pos.x, margin + player.size, CANVAS_WIDTH - margin - player.size);
  player.pos.y = clamp(player.pos.y, margin + player.size, CANVAS_HEIGHT - margin - player.size);

  // Wall collision
  for (const wall of room.walls) {
    const px = player.pos.x, py = player.pos.y, ps = player.size;
    if (rectCollision(px - ps, py - ps, ps * 2, ps * 2, wall.x, wall.y, wall.w, wall.h)) {
      // Push out
      const cx = wall.x + wall.w / 2;
      const cy = wall.y + wall.h / 2;
      const diffX = px - cx;
      const diffY = py - cy;
      if (Math.abs(diffX) > Math.abs(diffY)) {
        player.pos.x = diffX > 0 ? wall.x + wall.w + ps : wall.x - ps;
      } else {
        player.pos.y = diffY > 0 ? wall.y + wall.h + ps : wall.y - ps;
      }
    }
  }

  // Cooldowns
  if (player.shootCooldown > 0) player.shootCooldown--;
  if (player.dashCooldown > 0) player.dashCooldown--;
  if (player.ultimateCooldown > 0) player.ultimateCooldown--;
  if (player.invincibleTimer > 0) player.invincibleTimer--;
  if (state.screenShake > 0) state.screenShake -= 0.5;
  if (state.damageFlash > 0) state.damageFlash--;

  // Dash (space)
  if (keys.has(' ') && player.dashCooldown <= 0 && player.dashTimer <= 0) {
    player.dashTimer = PLAYER_DASH_DURATION;
    player.dashCooldown = Math.floor(PLAYER_DASH_COOLDOWN * dashCdr);
    player.invincibleTimer = PLAYER_DASH_DURATION;
    spawnParticles(state, player.pos, '#87CEEB', 8);

    // Dash damage to nearby enemies
    for (const enemy of room.enemies) {
      if (dist(player.pos, enemy.pos) < player.size + enemy.size + 20) {
        enemy.hp -= 15 * damageMult;
        spawnParticles(state, enemy.pos, '#FFD700', 5);
      }
    }
  }

  // Ultimate (Q key)
  if (keys.has('q') && player.ultimateCooldown <= 0) {
    player.ultimateCooldown = PLAYER_ULTIMATE_COOLDOWN;
    spawnParticles(state, player.pos, '#FFD700', 30, 6);
    spawnParticles(state, player.pos, '#FFF', 20, 5);
    state.screenShake = 8;

    // Damage all enemies in range
    for (const enemy of room.enemies) {
      if (dist(player.pos, enemy.pos) < 200) {
        enemy.hp -= 50 * damageMult;
        spawnParticles(state, enemy.pos, '#D4A03A', 8);
      }
    }
  }

  // Shooting
  if (state.mouseDown && player.shootCooldown <= 0 && player.dashTimer <= 0) {
    player.shootCooldown = PLAYER_SHOOT_COOLDOWN;
    const dir = normalize({ x: state.mousePos.x - player.pos.x, y: state.mousePos.y - player.pos.y });
    state.projectiles.push({
      pos: { x: player.pos.x + dir.x * player.size, y: player.pos.y + dir.y * player.size },
      vel: { x: dir.x * BEAN_SPEED, y: dir.y * BEAN_SPEED },
      size: BEAN_SIZE,
      damage: BEAN_DAMAGE * damageMult,
      friendly: true,
      lifetime: 60,
    });
  }

  // Update enemies
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0) continue;
    const config = ENEMY_CONFIGS[enemy.type];

    // Movement AI
    enemy.moveTimer--;
    if (enemy.moveTimer <= 0) {
      enemy.moveTimer = 40 + Math.random() * 40;
      // Move toward player with some randomness
      const toPlayer = normalize({ x: player.pos.x - enemy.pos.x, y: player.pos.y - enemy.pos.y });
      enemy.targetPos = {
        x: enemy.pos.x + toPlayer.x * 100 + (Math.random() - 0.5) * 80,
        y: enemy.pos.y + toPlayer.y * 100 + (Math.random() - 0.5) * 80,
      };
    }

    const toTarget = normalize({ x: enemy.targetPos.x - enemy.pos.x, y: enemy.targetPos.y - enemy.pos.y });
    enemy.pos.x += toTarget.x * config.speed;
    enemy.pos.y += toTarget.y * config.speed;
    enemy.pos.x = clamp(enemy.pos.x, margin + enemy.size, CANVAS_WIDTH - margin - enemy.size);
    enemy.pos.y = clamp(enemy.pos.y, margin + enemy.size, CANVAS_HEIGHT - margin - enemy.size);

    // Enemy shooting
    enemy.shootTimer--;
    if (enemy.shootTimer <= 0 && (enemy.type === 'angry_cup' || enemy.type === 'drone')) {
      enemy.shootTimer = 60 + Math.random() * 60;
      const dir = normalize({ x: player.pos.x - enemy.pos.x, y: player.pos.y - enemy.pos.y });
      state.projectiles.push({
        pos: { x: enemy.pos.x, y: enemy.pos.y },
        vel: { x: dir.x * 3, y: dir.y * 3 },
        size: 4,
        damage: config.damage,
        friendly: false,
        lifetime: 90,
      });
    }

    // Contact damage
    if (player.invincibleTimer <= 0 && dist(player.pos, enemy.pos) < player.size + enemy.size) {
      player.hp -= config.damage;
      player.invincibleTimer = PLAYER_INVINCIBLE_AFTER_HIT;
      state.screenShake = 5;
      state.damageFlash = 6;
      spawnParticles(state, player.pos, '#C0392B', 8);
    }
  }

  // Update projectiles
  state.projectiles = state.projectiles.filter(proj => {
    proj.pos.x += proj.vel.x;
    proj.pos.y += proj.vel.y;
    proj.lifetime--;

    // Out of bounds or expired
    if (proj.lifetime <= 0 || proj.pos.x < 0 || proj.pos.x > CANVAS_WIDTH || proj.pos.y < 0 || proj.pos.y > CANVAS_HEIGHT) {
      return false;
    }

    // Wall collision
    for (const wall of room.walls) {
      if (proj.pos.x > wall.x && proj.pos.x < wall.x + wall.w && proj.pos.y > wall.y && proj.pos.y < wall.y + wall.h) {
        spawnParticles(state, proj.pos, '#888', 3);
        return false;
      }
    }

    if (proj.friendly) {
      // Hit enemies
      for (const enemy of room.enemies) {
        if (enemy.hp <= 0) continue;
        if (dist(proj.pos, enemy.pos) < proj.size + enemy.size) {
          enemy.hp -= proj.damage;
          spawnParticles(state, proj.pos, '#6F4E37', 5);
          if (enemy.hp <= 0) {
            state.goldCollected += enemy.dropGold;
            spawnParticles(state, enemy.pos, '#FFD700', 12);
          }
          return false;
        }
      }
    } else {
      // Hit player
      if (player.invincibleTimer <= 0 && dist(proj.pos, player.pos) < proj.size + player.size) {
        player.hp -= proj.damage;
        player.invincibleTimer = PLAYER_INVINCIBLE_AFTER_HIT;
        state.screenShake = 4;
        state.damageFlash = 5;
        spawnParticles(state, player.pos, '#C0392B', 6);
        return false;
      }
    }

    return true;
  });

  // Update particles
  state.particles = state.particles.filter(p => {
    p.pos.x += p.vel.x;
    p.pos.y += p.vel.y;
    p.vel.x *= 0.95;
    p.vel.y *= 0.95;
    p.lifetime--;
    return p.lifetime > 0;
  });

  // Remove dead enemies
  room.enemies = room.enemies.filter(e => e.hp > 0);

  // Check room cleared
  if (!room.cleared && room.enemies.length === 0) {
    room.cleared = true;
    state.roomsCleared++;
  }

  // Pickup collision
  room.pickups = room.pickups.filter(pickup => {
    if (dist(player.pos, pickup.pos) < player.size + 12) {
      if (pickup.type === 'health') {
        player.hp = Math.min(player.maxHp, player.hp + pickup.value);
        spawnParticles(state, pickup.pos, '#90EE90', 8);
      } else {
        state.goldCollected += pickup.value;
        spawnParticles(state, pickup.pos, '#FFD700', 6);
      }
      return false;
    }
    return true;
  });

  // Door collision
  if (room.cleared) {
    for (const door of room.doors) {
      if (dist(player.pos, door.pos) < player.size + 20) {
        if (door.leadsTo >= state.rooms.length) {
          // Next floor
          if (state.floor < TOTAL_FLOORS - 1) {
            state.floor++;
            state.rooms = generateFloor(state.floor, ROOMS_PER_FLOOR);
            state.currentRoom = 0;
            player.pos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 80 };
            state.projectiles = [];
          } else {
            state.phase = 'victory';
          }
        } else {
          state.currentRoom = door.leadsTo;
          state.projectiles = [];
          // Position player at opposite door
          if (door.direction === 'north') {
            player.pos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 80 };
          } else if (door.direction === 'south') {
            player.pos = { x: CANVAS_WIDTH / 2, y: 80 };
          }
        }
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
