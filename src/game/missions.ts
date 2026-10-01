/**
 * Missions replace the old shop as the main way to unlock content.
 * Progress is derived from persistent meta stats, so it survives death.
 * Config is centralized here — add missions by appending to MISSIONS.
 */
import { loadMeta, MetaProgress } from './meta';

export type MissionCategory = 'combat' | 'exploration' | 'survival' | 'multiplayer';

export interface MissionReward {
  type: 'item' | 'character' | 'none';
  /** item name (from RUN_BUFF_POOL) or character id */
  id: string;
  label: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  target: number;
  progress: (m: MetaProgress) => number;
  reward: MissionReward;
  /** mission hidden as "locked" until this other mission is complete */
  requires?: string;
}

export const MISSION_CATEGORY_LABELS: Record<MissionCategory, string> = {
  combat: '⚔ Combate',
  exploration: '🧭 Exploração',
  survival: '❤ Sobrevivência',
  multiplayer: '👥 Multiplayer',
};

export const MISSIONS: Mission[] = [
  // ---- Combat ----
  { id: 'm_kill_50', title: 'Primeiro Turno', description: 'Derrote 50 inimigos.', category: 'combat', target: 50,
    progress: m => m.totalKills, reward: { type: 'item', id: 'Torra Escura', label: 'Item: Torra Escura' } },
  { id: 'm_kill_250', title: 'Hora do Rush', description: 'Derrote 250 inimigos.', category: 'combat', target: 250, requires: 'm_kill_50',
    progress: m => m.totalKills, reward: { type: 'item', id: 'Grão Vulcânico', label: 'Item: Grão Vulcânico' } },
  { id: 'm_boss_1', title: 'Moedor Moído', description: 'Derrote um chefe.', category: 'combat', target: 1,
    progress: m => m.totalBosses, reward: { type: 'item', id: 'Grão Perfurante', label: 'Item: Grão Perfurante' } },
  { id: 'm_boss_3', title: 'Caçador de Chefes', description: 'Derrote 3 chefes.', category: 'combat', target: 3, requires: 'm_boss_1',
    progress: m => m.totalBosses, reward: { type: 'character', id: 'soldado', label: 'Personagem: Soldado' } },
  { id: 'm_boss_nohit', title: 'Intocável', description: 'Derrote um chefe sem receber dano.', category: 'combat', target: 1,
    progress: m => m.perfectBosses, reward: { type: 'item', id: 'Bala de Expresso', label: 'Item: Bala de Expresso' } },
  { id: 'm_combo_25', title: 'Sequência Quente', description: 'Alcance um combo de 25 acertos.', category: 'combat', target: 25,
    progress: m => m.bestCombo, reward: { type: 'item', id: 'Olho do Torrador', label: 'Item: Olho do Torrador' } },

  // ---- Exploration ----
  { id: 'm_treasure_1', title: 'Cheiro de Tesouro', description: 'Encontre uma Sala de Tesouro.', category: 'exploration', target: 1,
    progress: m => m.treasureRooms, reward: { type: 'item', id: 'Trevo de Café', label: 'Item: Trevo de Café' } },
  { id: 'm_treasure_5', title: 'Mapa do Porão', description: 'Encontre 5 Salas de Tesouro.', category: 'exploration', target: 5, requires: 'm_treasure_1',
    progress: m => m.treasureRooms, reward: { type: 'character', id: 'explorador', label: 'Personagem: Explorador' } },
  { id: 'm_chests_10', title: 'Abre-Latas', description: 'Abra 10 baús.', category: 'exploration', target: 10,
    progress: m => m.chestsOpened, reward: { type: 'item', id: 'Coador Sedento', label: 'Item: Coador Sedento' } },
  { id: 'm_floor_3', title: 'Até o Fundo', description: 'Alcance o andar 3.', category: 'exploration', target: 3,
    progress: m => m.deepestFloor + 1, reward: { type: 'item', id: 'Esquiva Perfeita', label: 'Item: Esquiva Perfeita' } },
  { id: 'm_chests_30', title: 'Colecionador', description: 'Abra 30 baús.', category: 'exploration', target: 30, requires: 'm_chests_10',
    progress: m => m.chestsOpened, reward: { type: 'item', id: 'Grão Dourado', label: 'Item: Grão Dourado' } },

  // ---- Survival ----
  { id: 'm_runs_3', title: 'De Novo, 4:01', description: 'Complete 3 runs (vivo ou não).', category: 'survival', target: 3,
    progress: m => m.runs, reward: { type: 'item', id: 'Infusão Lenta', label: 'Item: Infusão Lenta' } },
  { id: 'm_perfect_rooms', title: 'Mãos Limpas', description: 'Limpe 15 salas sem receber dano.', category: 'survival', target: 15,
    progress: m => m.perfectRooms, reward: { type: 'item', id: 'Avental de Couro', label: 'Item: Avental de Couro' } },
  { id: 'm_heal_20', title: 'Primeiros Socorros', description: 'Use 20 itens de cura.', category: 'survival', target: 20,
    progress: m => m.healsUsed, reward: { type: 'character', id: 'medico', label: 'Personagem: Médico' } },
  { id: 'm_lowhp_win', title: 'Por um Fio', description: 'Vença um chefe com menos de 25% de vida.', category: 'survival', target: 1,
    progress: m => m.lowHpBossKills, reward: { type: 'item', id: 'Último Gole', label: 'Item: Último Gole' } },
  { id: 'm_damage_taken', title: 'Couro Grosso', description: 'Absorva 1500 de dano no total.', category: 'survival', target: 1500,
    progress: m => m.totalDamageTaken, reward: { type: 'character', id: 'tanque', label: 'Personagem: Tanque' } },
  { id: 'm_victory', title: 'O Expediente Acabou', description: 'Vença uma run completa.', category: 'survival', target: 1,
    progress: m => m.victories, reward: { type: 'item', id: 'Elixir Imortal', label: 'Item: Elixir Imortal' } },

  // ---- Multiplayer (enabled in the multiplayer phase) ----
  { id: 'm_coop_2', title: 'Turno em Dupla', description: 'Complete uma partida com 2 jogadores.', category: 'multiplayer', target: 1,
    progress: m => m.coopRuns2, reward: { type: 'item', id: 'Sifão Eterno', label: 'Item: Sifão Eterno' } },
  { id: 'm_coop_3', title: 'Equipe Completa', description: 'Complete uma partida com 3 jogadores.', category: 'multiplayer', target: 1,
    progress: m => m.coopRuns3, reward: { type: 'item', id: 'Essência do Expresso', label: 'Item: Essência do Expresso' } },
  { id: 'm_revive', title: 'Ninguém Fica Pra Trás', description: 'Reviva um aliado.', category: 'multiplayer', target: 1,
    progress: m => m.revives, reward: { type: 'none', id: '', label: 'Título: Anjo da Guarda' } },
];

export type MissionStatus = 'locked' | 'active' | 'done';

export function getMissionStatus(mission: Mission, meta: MetaProgress = loadMeta()): MissionStatus {
  if (mission.progress(meta) >= mission.target) return 'done';
  if (mission.requires) {
    const req = MISSIONS.find(x => x.id === mission.requires);
    if (req && req.progress(meta) < req.target) return 'locked';
  }
  return 'active';
}

export function isMissionComplete(id: string, meta: MetaProgress = loadMeta()): boolean {
  const m = MISSIONS.find(x => x.id === id);
  return !!m && m.progress(meta) >= m.target;
}

export function completedMissionIds(meta: MetaProgress = loadMeta()): Set<string> {
  return new Set(MISSIONS.filter(m => m.progress(meta) >= m.target).map(m => m.id));
}

/** item name -> mission that unlocks it */
const ITEM_LOCKS: Record<string, string> = {};
for (const m of MISSIONS) if (m.reward.type === 'item') ITEM_LOCKS[m.reward.id] = m.id;

export function isItemUnlocked(name: string, done: Set<string>): boolean {
  const req = ITEM_LOCKS[name];
  return !req || done.has(req);
}

export function itemUnlockMission(name: string): Mission | undefined {
  const id = ITEM_LOCKS[name];
  return id ? MISSIONS.find(m => m.id === id) : undefined;
}
