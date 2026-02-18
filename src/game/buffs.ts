import { RunBuff, RunBuffId } from './types';

export const RUN_BUFF_POOL: RunBuff[] = [
  {
    id: 'torrado',
    name: 'Grão Torrado',
    description: '+20% dano em todos os ataques',
    icon: '🔥',
  },
  {
    id: 'leite_aveia',
    name: 'Leite de Aveia',
    description: 'Escudo que absorve 1 acerto por sala',
    icon: '🛡️',
  },
  {
    id: 'chantilly',
    name: 'Chantilly Extra',
    description: '+20% velocidade de ataque',
    icon: '🍦',
  },
  {
    id: 'termo',
    name: 'Termo Térmico',
    description: '+50 vida máxima',
    icon: '☕',
  },
  {
    id: 'canela',
    name: 'Canela em Pó',
    description: '25% chance de queimar inimigos',
    icon: '✨',
  },
  {
    id: 'descaf',
    name: 'Descafeinado Gelado',
    description: '+20% velocidade e alcance do dash',
    icon: '💨',
  },
];

export function drawRewards(count: number = 3): RunBuff[] {
  const pool = [...RUN_BUFF_POOL];
  const result: RunBuff[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

export function defaultRunBuffs() {
  return {
    torrado: 0,
    leite_aveia: 0,
    chantilly: 0,
    termo: 0,
    canela: 0,
    descaf: 0,
  };
}
