/**
 * Object Pooling System — avoids GC pressure from creating/destroying
 * projectiles, particles, and enemies every frame.
 */

import { Projectile, Particle, Vec2 } from './types';

// ---- Generic Pool ----
class Pool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 0) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T) {
    this.reset(obj);
    if (this.pool.length < 500) { // cap pool size
      this.pool.push(obj);
    }
  }

  get size() { return this.pool.length; }
}

// ---- Projectile Pool ----
const defaultProjectile = (): Projectile => ({
  pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 },
  size: 5, damage: 0, friendly: false, lifetime: 0,
});

export const projectilePool = new Pool<Projectile>(
  defaultProjectile,
  (p) => { p.lifetime = 0; p.isBurnZone = undefined; p.isVortex = undefined; },
  64,
);

export function acquireProjectile(
  px: number, py: number, vx: number, vy: number,
  size: number, damage: number, friendly: boolean, lifetime: number,
  opts?: { isBurnZone?: boolean; isVortex?: boolean },
): Projectile {
  const p = projectilePool.acquire();
  p.pos.x = px; p.pos.y = py;
  p.vel.x = vx; p.vel.y = vy;
  p.size = size; p.damage = damage;
  p.friendly = friendly; p.lifetime = lifetime;
  p.isBurnZone = opts?.isBurnZone;
  p.isVortex = opts?.isVortex;
  return p;
}

// ---- Particle Pool ----
const defaultParticle = (): Particle => ({
  pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 },
  lifetime: 0, maxLifetime: 40, color: '#FFF', size: 3,
});

export const particlePool = new Pool<Particle>(
  defaultParticle,
  (p) => { p.lifetime = 0; },
  128,
);

export function acquireParticle(
  px: number, py: number, vx: number, vy: number,
  lifetime: number, color: string, size: number,
): Particle {
  const p = particlePool.acquire();
  p.pos.x = px; p.pos.y = py;
  p.vel.x = vx; p.vel.y = vy;
  p.lifetime = lifetime; p.maxLifetime = lifetime;
  p.color = color; p.size = size;
  return p;
}
