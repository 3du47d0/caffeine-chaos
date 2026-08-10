/**
 * Performance / Optimization system.
 *
 * Three quality tiers plus a manual "Otimizar Jogo" routine that can be run
 * mid-match. The routine only touches cosmetic/expired objects — it never
 * removes enemies, pickups, chests or projectiles that can still hit someone.
 */

import { GameState } from './types';
import { particlePool, projectilePool } from './pool';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

export type PerfMode = 'performance' | 'balanced' | 'quality';

export interface PerfConfig {
  id: PerfMode;
  name: string;
  description: string;
  icon: string;
  /** multiplier applied to every particle burst */
  particleMult: number;
  /** hard cap of simultaneous particles */
  maxParticles: number;
  /** secondary visual effects (glows, gradients, ambient decor) */
  fancyEffects: boolean;
  /** floor ambient decorations */
  ambientDecor: boolean;
  /** entity drop shadows */
  shadows: boolean;
  /** particles are culled this many px outside the room */
  cullMargin: number;
}

export const PERF_MODES: PerfConfig[] = [
  {
    id: 'performance',
    name: 'Desempenho Máximo',
    description: 'Menos efeitos, FPS estável',
    icon: '🚀',
    particleMult: 0.35,
    maxParticles: 90,
    fancyEffects: false,
    ambientDecor: false,
    shadows: false,
    cullMargin: 0,
  },
  {
    id: 'balanced',
    name: 'Balanceado',
    description: 'Equilíbrio entre visual e FPS',
    icon: '⚖️',
    particleMult: 0.7,
    maxParticles: 220,
    fancyEffects: true,
    ambientDecor: true,
    shadows: true,
    cullMargin: 40,
  },
  {
    id: 'quality',
    name: 'Qualidade',
    description: 'Todos os efeitos visuais',
    icon: '✨',
    particleMult: 1,
    maxParticles: 420,
    fancyEffects: true,
    ambientDecor: true,
    shadows: true,
    cullMargin: 120,
  },
];

export function getPerfConfig(mode: PerfMode): PerfConfig {
  return PERF_MODES.find(m => m.id === mode) ?? PERF_MODES[1];
}

const PERF_KEY = 'cafe_chaos_perf_mode';

export function loadPerfMode(): PerfMode {
  try {
    const saved = localStorage.getItem(PERF_KEY);
    if (saved === 'performance' || saved === 'balanced' || saved === 'quality') return saved;
  } catch {}
  return 'balanced';
}

export function savePerfMode(mode: PerfMode) {
  try { localStorage.setItem(PERF_KEY, mode); } catch {}
}

/**
 * Adaptive step executed every frame by the engine.
 * Keeps particle count inside the budget and drops cosmetic objects that left
 * the playable area. Gameplay objects are never touched here.
 */
export function enforceParticleBudget(state: GameState) {
  const cfg = getPerfConfig(state.perfMode);
  const particles = state.particles;

  // Cull particles that drifted outside the visible area (purely cosmetic).
  const m = cfg.cullMargin;
  let write = 0;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const outside =
      p.pos.x < -m || p.pos.x > CANVAS_WIDTH + m ||
      p.pos.y < -m || p.pos.y > CANVAS_HEIGHT + m;
    if (outside) {
      particlePool.release(p);
    } else {
      particles[write++] = p;
    }
  }
  particles.length = write;

  // Hard cap: drop the oldest particles first.
  const excess = particles.length - cfg.maxParticles;
  if (excess > 0) {
    for (let i = 0; i < excess; i++) particlePool.release(particles[i]);
    particles.copyWithin(0, excess);
    particles.length = particles.length - excess;
  }
}

export interface OptimizeReport {
  particlesRemoved: number;
  projectilesRemoved: number;
  numbersRemoved: number;
}

/**
 * Manual "Otimizar Jogo" routine. Safe to call at any moment.
 * - clears cosmetic particles and floating numbers
 * - releases expired / out-of-bounds projectiles back to the pool
 * - drops references from rooms already cleared
 */
export function optimizeNow(state: GameState | null): OptimizeReport {
  const report: OptimizeReport = { particlesRemoved: 0, projectilesRemoved: 0, numbersRemoved: 0 };
  if (!state) return report;

  // 1. Particles: keep only the freshest half of the budget.
  const cfg = getPerfConfig(state.perfMode);
  const keep = Math.floor(cfg.maxParticles / 3);
  if (state.particles.length > keep) {
    const remove = state.particles.length - keep;
    for (let i = 0; i < remove; i++) particlePool.release(state.particles[i]);
    state.particles.copyWithin(0, remove);
    state.particles.length = keep;
    report.particlesRemoved = remove;
  }

  // 2. Projectiles: only remove ones that are already dead weight —
  //    expired lifetime or fully outside the room. Anything that can still
  //    reach the player or an enemy is preserved.
  let write = 0;
  for (let i = 0; i < state.projectiles.length; i++) {
    const p = state.projectiles[i];
    const outside = !p.isBurnZone && (
      p.pos.x < -20 || p.pos.x > CANVAS_WIDTH + 20 ||
      p.pos.y < -20 || p.pos.y > CANVAS_HEIGHT + 20
    );
    if (p.lifetime <= 0 || outside) {
      projectilePool.release(p);
      report.projectilesRemoved++;
    } else {
      state.projectiles[write++] = p;
    }
  }
  state.projectiles.length = write;

  // 3. Floating damage numbers are pure UI.
  report.numbersRemoved = state.damageNumbers.length;
  state.damageNumbers.length = 0;

  // 4. Free memory held by rooms that are already cleared and not current.
  for (let i = 0; i < state.rooms.length; i++) {
    if (i === state.currentRoom) continue;
    const r = state.rooms[i];
    if (r.cleared) {
      r.enemies.length = 0;
      r.pickups.length = 0;
    }
  }

  return report;
}
