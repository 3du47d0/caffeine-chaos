/**
 * Compact host -> client world snapshots. Only what the renderer needs;
 * other rooms are sent as map stubs (shape + visited only).
 */
import { GameState, Room, Projectile } from './types';
import type { CoopAlly } from './coop';

const r1 = (n: number) => Math.round(n * 10) / 10;

export interface Snapshot {
  ph: GameState['phase'];
  fl: number;
  cr: number;
  rt: number;
  cm: number;
  ss: number;
  tt: number;
  hd: boolean;
  hrp: number;
  hn: string;
  map: { gx?: number; gy?: number; v?: boolean; c: boolean; d: Room['doors'] }[];
  room: Room;
  p: { x: number; y: number; hp: number; mhp: number; inv: number; fx: number; fy: number; ch: number; sh: boolean };
  a: Omit<CoopAlly, 'input'>[];
  pr: [number, number, number, number, number, number][];
  ep: GameState['exitPortal'];
  sp: GameState['secretPortal'];
  rp: GameState['rewardPortal'];
  dn: GameState['damageNumbers'];
  cc: number;
  bn: GameState['banner'];
}

export function makeSnapshot(state: GameState, hostName: string): Snapshot {
  const room = state.rooms[state.currentRoom];
  const flags = (p: Projectile) => (p.friendly ? 1 : 0) | (p.charged ? 2 : 0) | (p.crit ? 4 : 0) | (p.isBurnZone ? 8 : 0) | (p.isVortex ? 16 : 0);
  return {
    ph: state.phase, fl: state.floor, cr: state.currentRoom, rt: state.runTimer,
    cm: state.clearMessageTimer, ss: state.screenShake, tt: state.transitionTimer,
    hd: state.hostDowned, hrp: state.hostReviveProgress, hn: hostName,
    map: state.rooms.map(r => ({ gx: r.gridX, gy: r.gridY, v: r.visited, c: r.cleared, d: r.doors })),
    room: {
      ...room,
      enemies: room.enemies.map(e => ({ ...e, pos: { x: r1(e.pos.x), y: r1(e.pos.y) } })),
    },
    p: {
      x: r1(state.player.pos.x), y: r1(state.player.pos.y), hp: state.player.hp, mhp: state.player.maxHp,
      inv: state.player.invincibleTimer, fx: r1(state.player.facing.x), fy: r1(state.player.facing.y),
      ch: state.player.chargeTimer, sh: state.player.shield,
    },
    a: state.allies.map(({ input: _i, ...rest }) => rest),
    pr: state.projectiles.map(p => [r1(p.pos.x), r1(p.pos.y), r1(p.vel.x), r1(p.vel.y), p.size, flags(p)]),
    ep: state.exitPortal, sp: state.secretPortal, rp: state.rewardPortal,
    dn: state.damageNumbers.slice(-20),
    cc: state.comboCount,
    bn: state.banner ?? null,
  };
}

// ---- Client-side smoothing: render positions glide toward the latest snapshot ----
type P = { x: number; y: number };
const targets = { player: null as P | null, allies: new Map<string, P>(), enemies: [] as P[], boss: null as P | null };

/** Call once per rendered frame on clients. */
export function tickClient(state: GameState) {
  const k = 0.35;
  const lerp = (o: P, t: P | null | undefined) => {
    if (!t) return;
    const dx = t.x - o.x, dy = t.y - o.y;
    if (dx * dx + dy * dy > 200 * 200) { o.x = t.x; o.y = t.y; return; }
    o.x += dx * k; o.y += dy * k;
  };
  lerp(state.player.pos, targets.player);
  for (const a of state.allies) lerp(a.pos, targets.allies.get(a.id));
  const room = state.rooms[state.currentRoom];
  if (room) {
    room.enemies.forEach((e, i) => lerp(e.pos, targets.enemies[i]));
    if (room.boss) lerp(room.boss.pos, targets.boss);
  }
  for (const p of state.projectiles) { p.pos.x += p.vel.x; p.pos.y += p.vel.y; }
}

/** Writes a snapshot into a local (render-only) state owned by a client. */
export function applySnapshot(state: GameState, s: Snapshot) {
  const sameRoom = state.currentRoom === s.cr && state.floor === s.fl;
  const prevPlayer = { x: state.player.pos.x, y: state.player.pos.y };
  const prevAllies = new Map(state.allies.map(a => [a.id, { x: a.pos.x, y: a.pos.y }]));
  const prevRoom = state.rooms[state.currentRoom];
  const prevEnemies = sameRoom && prevRoom ? prevRoom.enemies.map(e => ({ x: e.pos.x, y: e.pos.y })) : [];
  const prevBoss = sameRoom && prevRoom?.boss ? { x: prevRoom.boss.pos.x, y: prevRoom.boss.pos.y } : null;
  applyRaw(state, s);
  // Record targets, then rewind rendered positions to where they were drawn last frame.
  targets.player = { x: s.p.x, y: s.p.y };
  if (sameRoom) { state.player.pos.x = prevPlayer.x; state.player.pos.y = prevPlayer.y; }
  targets.allies.clear();
  for (const a of state.allies) {
    targets.allies.set(a.id, { x: a.pos.x, y: a.pos.y });
    const pv = prevAllies.get(a.id);
    if (pv && sameRoom) { a.pos = { x: pv.x, y: pv.y }; }
  }
  const room = state.rooms[state.currentRoom];
  targets.enemies = room.enemies.map(e => ({ x: e.pos.x, y: e.pos.y }));
  room.enemies.forEach((e, i) => { if (prevEnemies[i] && prevEnemies.length === room.enemies.length) e.pos = { ...prevEnemies[i] }; });
  targets.boss = room.boss ? { x: room.boss.pos.x, y: room.boss.pos.y } : null;
  if (room.boss && prevBoss) room.boss.pos = { ...prevBoss };
}

function applyRaw(state: GameState, s: Snapshot) {
  if (state.floor !== s.fl) state._cache = null;
  state.phase = s.ph;
  state.floor = s.fl;
  state.currentRoom = s.cr;
  state.runTimer = s.rt;
  state.clearMessageTimer = s.cm;
  state.screenShake = s.ss;
  state.transitionTimer = s.tt;
  state.hostDowned = s.hd;
  state.hostReviveProgress = s.hrp;
  state.hostName = s.hn;
  state.rooms = s.map.map((m, i) => (i === s.cr ? s.room : {
    x: 0, y: 0, width: 800, height: 600, enemies: [], boss: null, pickups: [], chests: [],
    cleared: m.c, doors: m.d, walls: [], isBossRoom: false, gridX: m.gx, gridY: m.gy, visited: m.v,
  }));
  const pl = state.player;
  pl.pos.x = s.p.x; pl.pos.y = s.p.y; pl.hp = s.p.hp; pl.maxHp = s.p.mhp;
  pl.invincibleTimer = s.p.inv; pl.facing.x = s.p.fx; pl.facing.y = s.p.fy;
  pl.chargeTimer = s.p.ch; pl.shield = s.p.sh;
  state.allies = s.a.map(a => ({ ...a, input: { mx: 0, my: 0, ax: 0, ay: 0, shoot: false } }));
  state.projectiles = s.pr.map(([x, y, vx, vy, size, f]) => ({
    pos: { x, y }, vel: { x: vx, y: vy }, size, damage: 0, lifetime: 1,
    friendly: !!(f & 1), charged: !!(f & 2), crit: !!(f & 4), isBurnZone: !!(f & 8), isVortex: !!(f & 16),
  }));
  state.exitPortal = s.ep;
  state.secretPortal = s.sp;
  state.rewardPortal = s.rp;
  state.damageNumbers = s.dn;
  state.comboCount = s.cc;
  state.banner = s.bn;
  state.isBossRoom = s.room.isBossRoom;
}
