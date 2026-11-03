import { describe, it, expect } from 'vitest';
import { getEliteChance } from '../game/rooms';
describe('elite chance', () => {
  it('no elites on first floor', () => expect(getEliteChance(0)).toBe(0));
  it('12% on second floor', () => expect(getEliteChance(1)).toBeCloseTo(0.12));
  it('capped at 35%', () => expect(getEliteChance(10)).toBe(0.35));
});
