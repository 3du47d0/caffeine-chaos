/**
 * Online co-op transport over Lovable Cloud realtime channels.
 * Presence = lobby roster, broadcast = start / inputs / snapshots.
 * Host-authoritative: only the host simulates; clients send inputs and render snapshots.
 */
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { COOP_CONFIG, AllyInput } from './coop';
import type { CharacterId } from './characters';
import type { DifficultyId } from './difficulty';

export interface LobbyPlayer {
  id: string;
  name: string;
  characterId: CharacterId;
  ready: boolean;
  host: boolean;
  joinedAt: number;
}

export interface StartPayload {
  difficulty: DifficultyId;
  players: { id: string; name: string; characterId: CharacterId }[];
  hostId: string;
}

type Listener<T> = (v: T) => void;

export function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export function randomRoomCode() {
  return String(1000 + Math.floor(Math.random() * 9000));
}

export class NetSession {
  readonly myId = randomId();
  code = '';
  isHost = false;
  players: LobbyPlayer[] = [];
  private channel: RealtimeChannel | null = null;
  private me: LobbyPlayer | null = null;

  onPlayers: Listener<LobbyPlayer[]> | null = null;
  onStart: Listener<StartPayload> | null = null;
  onInput: ((id: string, input: AllyInput) => void) | null = null;
  onSnapshot: Listener<unknown> | null = null;
  onHostLeft: (() => void) | null = null;
  onPlayerLeft: Listener<string> | null = null;

  async create(name: string, characterId: CharacterId): Promise<void> {
    this.isHost = true;
    await this.connect(randomRoomCode(), name, characterId);
  }

  /** Joins an existing room; rejects if missing or full. */
  async join(code: string, name: string, characterId: CharacterId): Promise<void> {
    this.isHost = false;
    await this.connect(code, name, characterId);
    // wait for presence to settle
    await new Promise(r => setTimeout(r, 1500));
    const others = this.players.filter(p => p.id !== this.myId);
    if (!others.some(p => p.host)) {
      await this.leave();
      throw new Error('Sala não encontrada.');
    }
    const ordered = [...this.players].sort((a, b) => a.joinedAt - b.joinedAt);
    if (ordered.findIndex(p => p.id === this.myId) >= COOP_CONFIG.maxPlayers) {
      await this.leave();
      throw new Error('Sala cheia (máximo 3 jogadores).');
    }
  }

  private connect(code: string, name: string, characterId: CharacterId): Promise<void> {
    this.code = code;
    this.me = { id: this.myId, name: name.slice(0, 14) || 'Barista', characterId, ready: this.isHost, host: this.isHost, joinedAt: Date.now() };
    const ch = supabase.channel(`cafe-chaos-room-${code}`, {
      config: { broadcast: { self: false, ack: false }, presence: { key: this.myId } },
    });
    this.channel = ch;

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<LobbyPlayer>();
      const list: LobbyPlayer[] = [];
      for (const key of Object.keys(state)) {
        const entry = state[key][0];
        if (entry) list.push({ id: entry.id, name: entry.name, characterId: entry.characterId, ready: entry.ready, host: entry.host, joinedAt: entry.joinedAt });
      }
      const prev = this.players;
      this.players = list.sort((a, b) => a.joinedAt - b.joinedAt).slice(0, COOP_CONFIG.maxPlayers);
      for (const p of prev) {
        if (!list.some(q => q.id === p.id)) {
          if (p.host && !this.isHost) this.onHostLeft?.();
          else this.onPlayerLeft?.(p.id);
        }
      }
      this.onPlayers?.(this.players);
    });
    ch.on('broadcast', { event: 'start' }, ({ payload }) => this.onStart?.(payload as StartPayload));
    ch.on('broadcast', { event: 'input' }, ({ payload }) => {
      const p = payload as { id: string; i: AllyInput };
      this.onInput?.(p.id, p.i);
    });
    ch.on('broadcast', { event: 'snap' }, ({ payload }) => this.onSnapshot?.(payload));

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Sem conexão com o servidor.')), 8000);
      ch.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timer);
          await ch.track(this.me!);
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timer);
          reject(new Error('Falha ao conectar na sala.'));
        }
      });
    });
  }

  async update(patch: Partial<Pick<LobbyPlayer, 'ready' | 'characterId'>>) {
    if (!this.me || !this.channel) return;
    this.me = { ...this.me, ...patch };
    await this.channel.track(this.me);
  }

  startMatch(difficulty: DifficultyId): StartPayload {
    const payload: StartPayload = {
      difficulty,
      players: this.players.map(p => ({ id: p.id, name: p.name, characterId: p.characterId })),
      hostId: this.myId,
    };
    this.channel?.send({ type: 'broadcast', event: 'start', payload });
    return payload;
  }

  sendInput(input: AllyInput) {
    this.channel?.send({ type: 'broadcast', event: 'input', payload: { id: this.myId, i: input } });
  }

  sendSnapshot(snap: unknown) {
    this.channel?.send({ type: 'broadcast', event: 'snap', payload: snap });
  }

  async leave() {
    const ch = this.channel;
    this.channel = null;
    if (ch) {
      try { await ch.untrack(); } catch { /* ignore */ }
      await supabase.removeChannel(ch);
    }
    this.players = [];
  }
}
