import {
  GameState, Player, Projectile, Particle, Vec2, Enemy, Upgrades, Boss, RunBuff,
} from './types';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, PLAYER_SPEED, PLAYER_HP,
  PLAYER_SHOOT_COOLDOWN, PLAYER_DASH_COOLDOWN, PLAYER_DASH_DURATION,
  PLAYER_DASH_SPEED, PLAYER_ULTIMATE_COOLDOWN, PLAYER_INVINCIBLE_AFTER_HIT,
  BEAN_SPEED, BEAN_DAMAGE, BEAN_SIZE, ENEMY_CONFIGS, ROOMS_PER_FLOOR, TOTAL_FLOORS,
} from './constants';
import { generateFloor } from './rooms';
import { defaultRunBuffs, drawRewards } from './buffs';

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
  const adjustedCount = Math.max(1, Math.round(count * (state.particleMultiplier ?? 1)));
  for (let i = 0; i < adjustedCount; i++) {
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
    shield: false,
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
    runBuffs: defaultRunBuffs(),
    screenShake: 0,
    damageFlash: 0,
    exitPortal: null,
    clearMessageTimer: 0,
    transitionTimer: 0,
    transitionTarget: null,
    rewardChoices: [],
    runTimer: 0,
    roomTimer: 0,
    roomTimes: [],
    fastBrewTimer: 0,
    particleMultiplier: 1,
  };
}

// Apply a chosen run buff to the game state
export function applyRunBuff(state: GameState, buff: RunBuff): GameState {
  state.runBuffs[buff.id]++;

  // Immediate effects
  switch (buff.id) {
    case 'termo':
      state.player.maxHp += 50;
      state.player.hp = Math.min(state.player.hp + 50, state.player.maxHp);
      break;
    case 'leite_aveia':
      state.player.shield = true;
      break;
  }

  // Spawn transition after reward chosen
  state.phase = 'playing';
  state.rewardChoices = [];

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

  return state;
}

function updateBoss(state: GameState, boss: Boss) {
  const { player } = state;
  const margin = 60;

  boss.angle += 0.04;
  boss.moveTimer--;
  boss.shootTimer--;
  boss.summonTimer--;

  const damageMult = getDamageMult(state);

  switch (boss.type) {
    case 'grinder': {
      // Spin and chase player
      if (boss.moveTimer <= 0) {
        boss.moveTimer = 30;
        const toPlayer = normalize({ x: player.pos.x - boss.pos.x, y: player.pos.y - boss.pos.y });
        boss.pos.x += toPlayer.x * 2.5;
        boss.pos.y += toPlayer.y * 2.5;
      }
      // Shoot shard burst every 80 frames
      if (boss.shootTimer <= 0) {
        boss.shootTimer = 80;
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8 + boss.angle;
          state.projectiles.push({
            pos: { x: boss.pos.x, y: boss.pos.y },
            vel: { x: Math.cos(a) * 3.5, y: Math.sin(a) * 3.5 },
            size: 5,
            damage: 15,
            friendly: false,
            lifetime: 80,
          });
        }
      }
      break;
    }
    case 'steam_king': {
      // Float and place burn zones
      if (boss.moveTimer <= 0) {
        boss.moveTimer = 60;
        const angle = Math.random() * Math.PI * 2;
        boss.pos.x = clamp(boss.pos.x + Math.cos(angle) * 80, margin + boss.size, CANVAS_WIDTH - margin - boss.size);
        boss.pos.y = clamp(boss.pos.y + Math.sin(angle) * 80, margin + boss.size, CANVAS_HEIGHT - margin - boss.size);
      }
      // Burn zone projectiles (stationary)
      if (boss.shootTimer <= 0) {
        boss.shootTimer = 90;
        for (let i = 0; i < 3; i++) {
          const tx = 100 + Math.random() * (CANVAS_WIDTH - 200);
          const ty = 100 + Math.random() * (CANVAS_HEIGHT - 200);
          state.projectiles.push({
            pos: { x: tx, y: ty },
            vel: { x: 0, y: 0 },
            size: 28,
            damage: 8,
            friendly: false,
            lifetime: 120,
            isBurnZone: true,
          });
        }
      }
      // Periodic invisibility: toggle every 150 frames
      if (Math.floor(boss.angle * 10) % 60 === 0) {
        boss.invisibleTimer = boss.invisibleTimer > 0 ? 0 : 60;
      }
      if (boss.invisibleTimer > 0) boss.invisibleTimer--;
      break;
    }
    case 'overflowing_pot': {
      // Static but shoots circular jets
      boss.pos.x = CANVAS_WIDTH / 2;
      boss.pos.y = 170;

      if (boss.shootTimer <= 0) {
        boss.shootTimer = 50;
        boss.phase = (boss.phase + 1) % 2;
        const count = 12;
        for (let i = 0; i < count; i++) {
          const a = (Math.PI * 2 * i) / count + (boss.phase * Math.PI) / count;
          state.projectiles.push({
            pos: { x: boss.pos.x, y: boss.pos.y },
            vel: { x: Math.cos(a) * 2.8, y: Math.sin(a) * 2.8 },
            size: 6,
            damage: 12,
            friendly: false,
            lifetime: 100,
          });
        }
      }
      // Summon mini cups
      if (boss.summonTimer <= 0) {
        boss.summonTimer = 200;
        const room = state.rooms[state.currentRoom];
        for (let i = 0; i < 2; i++) {
          room.enemies.push({
            pos: { x: 150 + Math.random() * 500, y: 150 + Math.random() * 300 },
            vel: { x: 0, y: 0 },
            size: 14,
            hp: 40,
            maxHp: 40,
            type: 'angry_cup',
            shootTimer: 60,
            moveTimer: 30,
            targetPos: { x: player.pos.x, y: player.pos.y },
            dropGold: 2,
          });
        }
      }
      break;
    }
  }

  // Clamp boss position
  boss.pos.x = clamp(boss.pos.x, margin + boss.size, CANVAS_WIDTH - margin - boss.size);
  boss.pos.y = clamp(boss.pos.y, margin + boss.size, CANVAS_HEIGHT - margin - boss.size);

  // Contact damage with player
  if (player.invincibleTimer <= 0 && dist(player.pos, boss.pos) < player.size + boss.size) {
    takeDamage(state, 20);
  }
}

function takeDamage(state: GameState, amount: number) {
  const { player } = state;
  if (player.invincibleTimer > 0) return;

  if (player.shield) {
    player.shield = false; // absorb hit
    spawnParticles(state, player.pos, '#87CEEB', 10, 4);
    player.invincibleTimer = 30;
    return;
  }

  player.hp -= amount;
  player.invincibleTimer = PLAYER_INVINCIBLE_AFTER_HIT;
  state.screenShake = 5;
  state.damageFlash = 6;
  spawnParticles(state, player.pos, '#C0392B', 8);
}

function getDamageMult(state: GameState): number {
  return (1 + state.upgrades.damageBonus * 0.1) * (1 + state.runBuffs.torrado * 0.2);
}

function getSpeedMult(state: GameState): number {
  return (1 + state.upgrades.speedBonus * 0.1) * (1 + state.runBuffs.descaf * 0.2);
}

function getShootCooldown(state: GameState): number {
  const chantillyBonus = 1 - state.runBuffs.chantilly * 0.2;
  return Math.max(4, Math.floor(PLAYER_SHOOT_COOLDOWN * chantillyBonus));
}

export function update(state: GameState): GameState {
  if (state.phase !== 'playing') return state;

  // Handle fade transition
  if (state.transitionTimer > 0) {
    state.transitionTimer--;
    if (state.transitionTimer === 30) {
      const target = state.transitionTarget!;
      if (target.floor !== state.floor) {
        state.floor = target.floor;
        state.rooms = generateFloor(state.floor, ROOMS_PER_FLOOR);
        state.currentRoom = 0;
      } else {
        state.currentRoom = target.room;
      }
      state.player.pos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
      state.projectiles = [];
      state.exitPortal = null;
      state.clearMessageTimer = 0;
      state.roomTimer = 0; // reset room timer for new room
      // Restore shield per room if buff active
      if (state.runBuffs.leite_aveia > 0) {
        state.player.shield = true;
      }
    }
    if (state.transitionTimer === 0) {
      state.transitionTarget = null;
    }
    return state;
  }

  // Timer updates
  state.runTimer++;
  state.roomTimer++;
  if (state.fastBrewTimer > 0) state.fastBrewTimer--;

  const { player, keys } = state;
  const room = state.rooms[state.currentRoom];
  const margin = 50;
  const damageMult = getDamageMult(state);
  const speedMult = getSpeedMult(state);
  const dashCdr = 1 - state.upgrades.dashCdrBonus * 0.15;
  const dashSpeedMult = 1 + state.runBuffs.descaf * 0.2;

  // Player movement
  let dx = 0, dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;

  const moveDir = normalize({ x: dx, y: dy });
  const speed = player.dashTimer > 0 ? PLAYER_DASH_SPEED * dashSpeedMult : PLAYER_SPEED * speedMult;

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

    for (const enemy of room.enemies) {
      if (dist(player.pos, enemy.pos) < player.size + enemy.size + 20) {
        enemy.hp -= 15 * damageMult;
        spawnParticles(state, enemy.pos, '#FFD700', 5);
      }
    }
    if (room.boss && room.boss.hp > 0) {
      if (dist(player.pos, room.boss.pos) < player.size + room.boss.size + 20) {
        room.boss.hp -= 15 * damageMult;
      }
    }
  }

  // Ultimate (Q key)
  if (keys.has('q') && player.ultimateCooldown <= 0) {
    player.ultimateCooldown = PLAYER_ULTIMATE_COOLDOWN;
    spawnParticles(state, player.pos, '#FFD700', 30, 6);
    spawnParticles(state, player.pos, '#FFF', 20, 5);
    state.screenShake = 8;

    for (const enemy of room.enemies) {
      if (dist(player.pos, enemy.pos) < 200) {
        enemy.hp -= 50 * damageMult;
        spawnParticles(state, enemy.pos, '#D4A03A', 8);
      }
    }
    if (room.boss && room.boss.hp > 0 && dist(player.pos, room.boss.pos) < 200) {
      room.boss.hp -= 50 * damageMult;
    }
  }

  // Shooting
  const shootCooldown = getShootCooldown(state);
  if (state.mouseDown && player.shootCooldown <= 0 && player.dashTimer <= 0) {
    player.shootCooldown = shootCooldown;
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

  // Update regular enemies
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0) continue;
    const config = ENEMY_CONFIGS[enemy.type];

    enemy.moveTimer--;
    if (enemy.moveTimer <= 0) {
      enemy.moveTimer = 40 + Math.random() * 40;
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

    if (player.invincibleTimer <= 0 && dist(player.pos, enemy.pos) < player.size + enemy.size) {
      takeDamage(state, config.damage);
    }
  }

  // Update boss
  if (room.boss && room.boss.hp > 0) {
    updateBoss(state, room.boss);
  }

  // Update projectiles
  state.projectiles = state.projectiles.filter(proj => {
    if (!proj.isBurnZone) {
      proj.pos.x += proj.vel.x;
      proj.pos.y += proj.vel.y;
    }
    proj.lifetime--;

    if (proj.lifetime <= 0 || (!proj.isBurnZone && (proj.pos.x < 0 || proj.pos.x > CANVAS_WIDTH || proj.pos.y < 0 || proj.pos.y > CANVAS_HEIGHT))) {
      return false;
    }

    // Wall collision (non-burn zones)
    if (!proj.isBurnZone) {
      for (const wall of room.walls) {
        if (proj.pos.x > wall.x && proj.pos.x < wall.x + wall.w && proj.pos.y > wall.y && proj.pos.y < wall.y + wall.h) {
          spawnParticles(state, proj.pos, '#888', 3);
          return false;
        }
      }
    }

    if (proj.friendly) {
      // Hit regular enemies
      for (const enemy of room.enemies) {
        if (enemy.hp <= 0) continue;
        if (dist(proj.pos, enemy.pos) < proj.size + enemy.size) {
          enemy.hp -= proj.damage;
          // Burn effect from canela buff
          if (state.runBuffs.canela > 0 && Math.random() < 0.25) {
            enemy.hp -= 5; // extra burn tick
            spawnParticles(state, enemy.pos, '#FF6B35', 3);
          }
          spawnParticles(state, proj.pos, '#6F4E37', 5);
          if (enemy.hp <= 0) {
            state.goldCollected += enemy.dropGold;
            spawnParticles(state, enemy.pos, '#FFD700', 12);
          }
          if (!proj.isBurnZone) return false;
        }
      }
      // Hit boss
      if (room.boss && room.boss.hp > 0) {
        if (dist(proj.pos, room.boss.pos) < proj.size + room.boss.size) {
          room.boss.hp -= proj.damage;
          if (state.runBuffs.canela > 0 && Math.random() < 0.25) {
            room.boss.hp -= 5;
            spawnParticles(state, room.boss.pos, '#FF6B35', 3);
          }
          spawnParticles(state, proj.pos, '#6F4E37', 5);
          if (room.boss.hp <= 0) {
            state.goldCollected += room.boss.dropGold;
            spawnParticles(state, room.boss.pos, '#FFD700', 25, 6);
            state.screenShake = 10;
          }
          if (!proj.isBurnZone) return false;
        }
      }
    } else {
      // Burn zones hurt player on overlap
      if (proj.isBurnZone) {
        if (player.invincibleTimer <= 0 && dist(proj.pos, player.pos) < proj.size + player.size * 0.5) {
          takeDamage(state, proj.damage);
          player.invincibleTimer = 20; // shorter cooldown for zones
        }
        return proj.lifetime > 0;
      }
      // Regular enemy projectile hits player
      if (player.invincibleTimer <= 0 && dist(proj.pos, player.pos) < proj.size + player.size) {
        takeDamage(state, proj.damage);
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

  // Check room cleared (no enemies + boss dead or no boss)
  const bossAlive = room.boss !== null && room.boss.hp > 0;
  const allEnemiesDead = room.enemies.length === 0;

  if (!room.cleared && allEnemiesDead && !bossAlive) {
    room.cleared = true;
    state.roomsCleared++;
    state.clearMessageTimer = 120;
    spawnParticles(state, { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }, '#FFD700', 20, 5);

    // Record room time
    const roomTime = state.roomTimer;
    state.roomTimes.push({ room: state.currentRoom, floor: state.floor, timeFrames: roomTime });
    state.roomTimer = 0;

    // Fast Brew! if cleared in under 10 seconds (600 frames)
    if (roomTime < 600) {
      state.fastBrewTimer = 120;
    }

    if (room.isBossRoom) {
      // Show reward screen before portal
      state.rewardChoices = drawRewards(3);
      state.phase = 'reward';
    } else {
      // Spawn exit portal
      const portalX = 100 + Math.random() * (CANVAS_WIDTH - 200);
      const portalY = 100 + Math.random() * (CANVAS_HEIGHT - 200);
      state.exitPortal = { pos: { x: portalX, y: portalY }, active: true };
    }
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

  // Exit portal collision
  if (state.exitPortal?.active && dist(player.pos, state.exitPortal.pos) < player.size + 24) {
    state.exitPortal.active = false;
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

  // Door collision (backward navigation)
  if (room.cleared) {
    for (const door of room.doors) {
      if (door.direction === 'south' && dist(player.pos, door.pos) < player.size + 20) {
        state.currentRoom = door.leadsTo;
        state.projectiles = [];
        player.pos = { x: CANVAS_WIDTH / 2, y: 80 };
        state.exitPortal = null;
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
