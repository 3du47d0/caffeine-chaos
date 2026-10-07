/**
 * Co-op simulation (host-authoritative). The host runs the full engine and
 * simulates remote allies from their streamed inputs. All tunables live in COOP_CONFIG.
 */
import { GameState, Vec2 } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, PLAYER_SPEED, PLAYER_HP, BEAN_SPEED, BEAN_DAMAGE, BEAN_SIZE, PLAYER_SHOOT_COOLDOWN, ENEMY_CONFIGS } from './constants';
import { acquireProjectile } from './pool';
import { getCharacter, CharacterId } from './characters';
import { DifficultyConfig } from './difficulty';

export const COOP_CONFIG = {
  maxPlayers: 3,
  /** overall difficulty per player count (1 = 100%) */
  difficultyByPlayers: { 1: 1.0, 2: 1.4, 3: 1.8 } as Record<number, number>,
  /** share of the difficulty bonus applied to each stat */
  hpShare: 1.0,
  countShare: 0.5,
  damageShare: 0.25,
  bossHpShare: 1.0,
  reviveRadius: 46,
  reviveFrames: 150,
  reviveHpFraction: 0.5,
  snapshotHz: 15,
  inputHz: 20,
};

export const ALLY_COLORS = ['#7EC8E3', '#F28FAD', '#B5E48C'];

export interface AllyInput { mx: number; my: number; ax: number; ay: number; shoot: boolean; }

export interface CoopAlly {
  id: string;
  name: string;
  characterId: CharacterId;
  color: string;
  pos: Vec2;
  hp: number;
  maxHp: number;
  downed: boolean;
  reviveProgress: number;
  shootCd: number;
  invincible: number;
  input: AllyInput;
  revivesGiven: number;
}

export function coopScale(players: number): number {
  return COOP_CONFIG.difficultyByPlayers[Math.max(1, Math.min(3, players))] ?? 1;
}

/** Returns a copy of the difficulty scaled progressively by player count. */
export function scaleDifficulty(diff: DifficultyConfig, players: number): DifficultyConfig {
  const bonus = coopScale(players) - 1;
  if (bonus <= 0) return diff;
  return {
    ...diff,
    enemyHpMult: diff.enemyHpMult * (1 + bonus * COOP_CONFIG.hpShare),
    enemyCountMult: diff.enemyCountMult * (1 + bonus * COOP_CONFIG.countShare),
    enemyDamageMult: diff.enemyDamageMult * (1 + bonus * COOP_CONFIG.damageShare),
    bossHpMult: diff.bossHpMult * (1 + bonus * COOP_CONFIG.bossHpShare),
  };
}

export function createAlly(id: string, name: string, characterId: CharacterId, index: number): CoopAlly {
  const ch = getCharacter(characterId);
  const hp = Math.floor(PLAYER_HP * ch.hpMult);
  return {
    id, name, characterId, color: ALLY_COLORS[index % ALLY_COLORS.length],
    pos: { x: CANVAS_WIDTH / 2 + (index === 0 ? -50 : 50), y: CANVAS_HEIGHT / 2 + 40 },
    hp, maxHp: hp, downed: false, reviveProgress: 0, shootCd: 0, invincible: 60,
    input: { mx: 0, my: 0, ax: CANVAS_WIDTH / 2, ay: 0, shoot: false },
    revivesGiven: 0,
  };
}

function d2(a: Vec2, b: Vec2) { const x = a.x - b.x, y = a.y - b.y; return x * x + y * y; }

export function anyAllyAlive(state: GameState): boolean {
  for (const a of state.allies) if (!a.downed) return true;
  return false;
}

function hurtAlly(state: GameState, a: CoopAlly, amount: number) {
  if (a.downed || a.invincible > 0) return;
  const def = getCharacter(a.characterId).defenseMult ?? 1;
  a.hp -= Math.max(1, Math.round(amount * def));
  a.invincible = 30;
  if (a.hp <= 0) { a.hp = 0; a.downed = true; a.reviveProgress = 0; }
}

/** Runs once per physics step on the host. */
export function updateAllies(state: GameState) {
  if (state.allies.length === 0) return;
  const room = state.rooms[state.currentRoom];
  const player = state.player;
  const margin = 50;
  const enemyDmgMult = state._cache?.diffData.enemyDamageMult ?? 1;

  // Snap allies to the host when the room changes.
  if (state.coopLastRoom !== state.currentRoom || state.coopLastFloor !== state.floor) {
    state.coopLastRoom = state.currentRoom; state.coopLastFloor = state.floor;
    // Spread allies around the host (inside the room) so nobody stacks up.
    const offsets = [[-44, 30], [44, 30], [0, 52]];
    state.allies.forEach((a, i) => {
      const [ox, oy] = offsets[i % offsets.length];
      const towardCenterY = player.pos.y > CANVAS_HEIGHT / 2 ? -1 : 1;
      a.pos.x = Math.max(margin, Math.min(CANVAS_WIDTH - margin, player.pos.x + ox));
      a.pos.y = Math.max(margin, Math.min(CANVAS_HEIGHT - margin, player.pos.y + oy * towardCenterY));
      a.invincible = 60;
    });
  }

  for (const a of state.allies) {
    if (a.invincible > 0) a.invincible--;
    if (a.downed) {
      // Revive: any standing teammate nearby (host or ally).
      let helper: CoopAlly | null = null;
      let near = !state.hostDowned && d2(player.pos, a.pos) < COOP_CONFIG.reviveRadius ** 2;
      if (!near) for (const b of state.allies) if (b !== a && !b.downed && d2(b.pos, a.pos) < COOP_CONFIG.reviveRadius ** 2) { near = true; helper = b; break; }
      a.reviveProgress = near ? a.reviveProgress + 1 : Math.max(0, a.reviveProgress - 2);
      if (a.reviveProgress >= COOP_CONFIG.reviveFrames) {
        a.downed = false; a.hp = Math.ceil(a.maxHp * COOP_CONFIG.reviveHpFraction); a.invincible = 90; a.reviveProgress = 0;
        if (helper) helper.revivesGiven++; else state.hostRevives++;
      }
      continue;
    }
    const ch = getCharacter(a.characterId);
    // Movement
    let mx = a.input.mx, my = a.input.my;
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    const sp = PLAYER_SPEED * ch.speedMult;
    let nx = a.pos.x + mx * sp, ny = a.pos.y + my * sp;
    nx = Math.max(margin, Math.min(CANVAS_WIDTH - margin, nx));
    ny = Math.max(margin, Math.min(CANVAS_HEIGHT - margin, ny));
    let blocked = false;
    for (const w of room.walls) {
      if (nx + PLAYER_SIZE > w.x && nx - PLAYER_SIZE < w.x + w.w && ny + PLAYER_SIZE > w.y && ny - PLAYER_SIZE < w.y + w.h) { blocked = true; break; }
    }
    if (!blocked) { a.pos.x = nx; a.pos.y = ny; }

    // Shooting
    if (a.shootCd > 0) a.shootCd--;
    if (a.input.shoot && a.shootCd <= 0) {
      const dx = a.input.ax - a.pos.x, dy = a.input.ay - a.pos.y;
      const l = Math.hypot(dx, dy) || 1;
      const dmg = Math.round(BEAN_DAMAGE * ch.damageMult * (1 + state.runBuffs.torrado * 0.15));
      state.projectiles.push(acquireProjectile(a.pos.x, a.pos.y, (dx / l) * BEAN_SPEED, (dy / l) * BEAN_SPEED, BEAN_SIZE, dmg, true, 80));
      a.shootCd = Math.max(4, Math.floor(PLAYER_SHOOT_COOLDOWN * ch.shootCdMult));
    }

    // Enemy contact
    for (const e of room.enemies) {
      if (e.hp > 0 && d2(e.pos, a.pos) < (e.size + PLAYER_SIZE) ** 2) {
        hurtAlly(state, a, Math.floor(ENEMY_CONFIGS[e.type].damage * enemyDmgMult));
      }
    }
    if (room.boss && room.boss.hp > 0 && d2(room.boss.pos, a.pos) < (room.boss.size + PLAYER_SIZE) ** 2) hurtAlly(state, a, 20);

    // Hostile projectiles
    for (const p of state.projectiles) {
      if (p.friendly || p.lifetime <= 0) continue;
      if (d2(p.pos, a.pos) < (p.size + PLAYER_SIZE) ** 2) {
        hurtAlly(state, a, p.damage);
        if (!p.isBurnZone) p.lifetime = 0;
      }
    }

    // Healing pickups are shared: allies can grab them too.
    for (let i = room.pickups.length - 1; i >= 0; i--) {
      const pk = room.pickups[i];
      if (pk.type === 'health' && d2(pk.pos, a.pos) < (PLAYER_SIZE + 12) ** 2 && a.hp < a.maxHp) {
        a.hp = Math.min(a.maxHp, a.hp + Math.round(pk.value * (ch.healMult ?? 1)));
        room.pickups.splice(i, 1);
      }
    }
  }

  // Host revive by allies
  if (state.hostDowned) {
    let near = false;
    for (const b of state.allies) if (!b.downed && d2(b.pos, player.pos) < COOP_CONFIG.reviveRadius ** 2) { near = true; break; }
    state.hostReviveProgress = near ? state.hostReviveProgress + 1 : Math.max(0, state.hostReviveProgress - 2);
    if (state.hostReviveProgress >= COOP_CONFIG.reviveFrames) {
      state.hostDowned = false; state.hostReviveProgress = 0;
      player.hp = Math.ceil(player.maxHp * COOP_CONFIG.reviveHpFraction);
      player.invincibleTimer = 90;
      for (const b of state.allies) if (!b.downed && d2(b.pos, player.pos) < COOP_CONFIG.reviveRadius ** 2) { b.revivesGiven++; break; }
    } else {
      player.invincibleTimer = Math.max(player.invincibleTimer, 2);
    }
  }
}
