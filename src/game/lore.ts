/**
 * Story system — "Fragmentos de História".
 *
 * The narrative is delivered in short pieces discovered while playing.
 * Discovered fragments are permanent progress (localStorage) and can be
 * re-read from the lore menu in the lobby.
 */

export type LoreCategory = 'inicio' | 'cafeteria' | 'frigorifico' | 'fornalha' | 'abismo' | 'verdade';

export interface LoreFragment {
  id: string;
  category: LoreCategory;
  title: string;
  /** one or two short lines — never a wall of text during gameplay */
  text: string;
  /** how the player finds it (shown as a hint while locked) */
  hint: string;
  icon: string;
}

export const LORE_CATEGORIES: Record<LoreCategory, string> = {
  inicio: 'O Turno',
  cafeteria: 'A Cafeteria',
  frigorifico: 'O Frigorífico',
  fornalha: 'A Fornalha',
  abismo: 'O Abismo',
  verdade: 'A Verdade',
};

export const LORE_FRAGMENTS: LoreFragment[] = [
  {
    id: 'intro_1', category: 'inicio', icon: '⏰',
    title: 'O Último Pedido',
    text: 'Você é Léo, barista do turno da madrugada. Fechou a loja às 4h. Às 4h01, a porta dos fundos abriu sozinha.',
    hint: 'Comece sua primeira run',
  },
  {
    id: 'intro_2', category: 'inicio', icon: '🔁',
    title: 'O Turno que Não Acaba',
    text: '"Você já esteve aqui." O relógio marca 4h01. Sempre 4h01. A cada queda, a Cafeteria remonta o turno do zero.',
    hint: 'Termine uma run (morrendo ou vencendo)',
  },
  {
    id: 'cafeteria_1', category: 'cafeteria', icon: '📝',
    title: 'Comanda Esquecida',
    text: 'Rabiscado no verso: "não sirva o pedido da mesa 0". A mesa 0 nunca existiu no salão.',
    hint: 'Limpe 3 salas em uma run',
  },
  {
    id: 'cafeteria_2', category: 'cafeteria', icon: '🥐',
    title: 'A Massa Acordou',
    text: 'Os croissants não são monstros. São clientes. Ficaram tempo demais esperando ser atendidos.',
    hint: 'Derrote 40 inimigos em uma run',
  },
  {
    id: 'cafeteria_3', category: 'cafeteria', icon: '⚙️',
    title: 'O Moedor',
    text: 'A máquina mais antiga da loja. Ela mói grãos, horas e — segundo o manual rasgado — memórias.',
    hint: 'Derrote o primeiro chefe',
  },
  {
    id: 'frigorifico_1', category: 'frigorifico', icon: '❄️',
    title: 'Etiqueta Congelada',
    text: 'Validade: 4h01. Todos os produtos têm a mesma. Inclusive os crachás dos funcionários.',
    hint: 'Alcance o Armazém Frigorífico',
  },
  {
    id: 'frigorifico_2', category: 'frigorifico', icon: '🧊',
    title: 'O Turno Anterior',
    text: 'Há um avental congelado na parede, com seu nome bordado. Ele está mais gasto do que o seu.',
    hint: 'Abra um baú',
  },
  {
    id: 'fornalha_1', category: 'fornalha', icon: '🔥',
    title: 'Ordem de Torra',
    text: '"Torre até o grão esquecer o que era." Está assinado com a sua letra, mas você não lembra de escrever.',
    hint: 'Alcance a Fornalha de Torra',
  },
  {
    id: 'fornalha_2', category: 'fornalha', icon: '📻',
    title: 'Transmissão Quebrada',
    text: '— "...o expediente termina quando alguém chega ao fim do corredor... nenhum de nós chegou..."',
    hint: 'Limpe uma sala sem tomar dano',
  },
  {
    id: 'abismo_1', category: 'abismo', icon: '🌀',
    title: 'Portal de Vapor',
    text: 'Cada portal cheira a café fresco. É assim que a Cafeteria te convence a dar mais um passo.',
    hint: 'Entre em um portal misterioso',
  },
  {
    id: 'abismo_2', category: 'abismo', icon: '👑',
    title: 'O Supremo Expresso',
    text: 'No fundo do Abismo existe o primeiro café já coado nesta loja. Ele nunca foi servido. E está com raiva.',
    hint: 'Alcance o Abismo do Expresso',
  },
  {
    id: 'verdade_1', category: 'verdade', icon: '🗝️',
    title: 'Por que Recomeçar',
    text: 'Morrer não te leva para trás: leva você para o começo do turno com o que aprendeu. A loja não sabe apagar conhecimento.',
    hint: 'Termine 3 runs',
  },
  {
    id: 'verdade_2', category: 'verdade', icon: '🏁',
    title: 'O Fim do Corredor',
    text: 'Servir o pedido da mesa 0 encerra o turno para sempre. Alguém precisa ser o último cliente.',
    hint: 'Vença o jogo',
  },
  {
    id: 'verdade_3', category: 'verdade', icon: '☕',
    title: 'Mesa 0',
    text: 'Você senta. Serve a si mesmo. O relógio finalmente marca 4h02.',
    hint: 'Derrote o Supremo Expresso',
  },
];

const LORE_KEY = 'cafe_chaos_lore';

export function loadDiscoveredLore(): string[] {
  try {
    const raw = localStorage.getItem(LORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function isLoreDiscovered(id: string): boolean {
  return loadDiscoveredLore().includes(id);
}

/** Returns the fragment if it was newly discovered, otherwise null. */
export function discoverLore(id: string): LoreFragment | null {
  const found = LORE_FRAGMENTS.find(f => f.id === id);
  if (!found) return null;
  const list = loadDiscoveredLore();
  if (list.includes(id)) return null;
  list.push(id);
  try { localStorage.setItem(LORE_KEY, JSON.stringify(list)); } catch {}
  return found;
}

export function getLoreFragment(id: string): LoreFragment | undefined {
  return LORE_FRAGMENTS.find(f => f.id === id);
}

export function loreCompletion(): { found: number; total: number } {
  return { found: loadDiscoveredLore().length, total: LORE_FRAGMENTS.length };
}

export function clearLore() {
  try { localStorage.removeItem(LORE_KEY); } catch {}
}
