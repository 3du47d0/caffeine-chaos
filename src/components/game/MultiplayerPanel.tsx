import React, { useEffect, useRef, useState } from 'react';
import { NetSession, LobbyPlayer, StartPayload } from '../../game/net';
import { CHARACTERS, isCharacterUnlocked, CharacterId } from '../../game/characters';
import { DifficultyId } from '../../game/difficulty';
import { COOP_CONFIG, coopScale } from '../../game/coop';

interface Props {
  difficulty: DifficultyId;
  onStart: (session: NetSession, payload: StartPayload) => void;
}

const NAME_KEY = 'cafe_chaos_player_name';

const MultiplayerPanel: React.FC<Props> = ({ difficulty, onStart }) => {
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '');
  const [code, setCode] = useState('');
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [character, setCharacter] = useState<CharacterId>('barista');
  const sessionRef = useRef<NetSession | null>(null);
  const startedRef = useRef(false);
  const [, force] = useState(0);

  // Leave the room if the panel closes before the match starts.
  useEffect(() => () => {
    if (!startedRef.current) sessionRef.current?.leave();
  }, []);

  const attach = (s: NetSession) => {
    s.onPlayers = (list) => setPlayers([...list]);
    s.onHostLeft = () => {
      setError('O anfitrião fechou a sala.');
      s.leave();
      sessionRef.current = null;
      setPlayers([]);
      force(n => n + 1);
    };
    s.onStart = (payload) => {
      startedRef.current = true;
      onStart(s, payload);
    };
  };

  const playerName = () => {
    const n = name.trim() || 'Barista';
    localStorage.setItem(NAME_KEY, n);
    return n;
  };

  const create = async () => {
    setBusy(true); setError('');
    const s = new NetSession();
    attach(s);
    try {
      await s.create(playerName(), character);
      sessionRef.current = s;
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const join = async () => {
    if (!/^\d{4}$/.test(code)) { setError('Digite o código de 4 números.'); return; }
    setBusy(true); setError('');
    const s = new NetSession();
    attach(s);
    try {
      await s.join(code, playerName(), character);
      sessionRef.current = s;
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  const leave = async () => {
    await sessionRef.current?.leave();
    sessionRef.current = null;
    setPlayers([]);
  };

  const s = sessionRef.current;
  const me = players.find(p => p.id === s?.myId);
  const allReady = players.length > 0 && players.every(p => p.ready);
  const pickCharacter = (id: CharacterId) => {
    setCharacter(id);
    s?.update({ characterId: id });
  };

  const characterPicker = (
    <div className="flex flex-wrap justify-center gap-1.5 mb-3">
      {CHARACTERS.filter(c => isCharacterUnlocked(c.id)).map(c => (
        <button
          key={c.id}
          onClick={() => pickCharacter(c.id)}
          title={c.name}
          className={`w-9 h-9 rounded-lg pixel-border text-lg ${character === c.id ? 'bg-primary' : 'bg-secondary'}`}
        >
          {c.icon}
        </button>
      ))}
    </div>
  );

  if (!s) {
    return (
      <div className="pixel-border rounded-lg p-3 sm:p-4 mb-4 bg-card">
        <h2 className="font-pixel text-xs sm:text-sm text-primary mb-3">MULTIPLAYER</h2>
        <input
          value={name}
          onChange={e => setName(e.target.value.slice(0, 14))}
          placeholder="Seu nome"
          className="w-full mb-3 px-3 py-2 rounded-lg bg-background text-foreground font-pixel text-xs pixel-border outline-none"
        />
        <p className="font-pixel text-muted-foreground mb-1.5" style={{ fontSize: '8px' }}>Personagem</p>
        {characterPicker}
        <button
          onClick={create}
          disabled={busy}
          className="w-full font-pixel text-xs px-4 py-3 mb-3 bg-primary text-primary-foreground rounded-lg pixel-border disabled:opacity-50"
        >
          ➕ CRIAR SALA
        </button>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Código"
            inputMode="numeric"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-background text-foreground font-pixel text-xs pixel-border outline-none text-center tracking-widest"
          />
          <button
            onClick={join}
            disabled={busy}
            className="font-pixel text-xs px-4 py-2 bg-secondary text-secondary-foreground rounded-lg pixel-border disabled:opacity-50"
          >
            ENTRAR
          </button>
        </div>
        {busy && <p className="font-pixel text-muted-foreground mt-3" style={{ fontSize: '8px' }}>Conectando...</p>}
        {error && <p className="font-pixel text-destructive mt-3" style={{ fontSize: '8px' }}>{error}</p>}
        <p className="font-pixel text-muted-foreground mt-3" style={{ fontSize: '7px' }}>
          Até {COOP_CONFIG.maxPlayers} jogadores. Mais jogadores = inimigos mais fortes.
        </p>
      </div>
    );
  }

  const slots = Array.from({ length: COOP_CONFIG.maxPlayers }, (_, i) => players[i]);

  return (
    <div className="pixel-border rounded-lg p-3 sm:p-4 mb-4 bg-card">
      <h2 className="font-pixel text-xs sm:text-sm text-primary mb-1">MULTIPLAYER</h2>
      <p className="font-pixel text-foreground mb-1" style={{ fontSize: '10px' }}>Sala: Sobreviventes #{s.code}</p>
      <p className="font-pixel text-muted-foreground mb-3" style={{ fontSize: '7px' }}>
        Compartilhe o código {s.code} com seus amigos
      </p>
      <div className="space-y-1.5 mb-3 text-left">
        {slots.map((p, i) => {
          const ch = p ? CHARACTERS.find(c => c.id === p.characterId) : null;
          return (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary pixel-border">
              <span className="font-pixel text-foreground truncate" style={{ fontSize: '9px' }}>
                {p ? `${ch?.icon ?? ''} ${p.name}${p.id === s.myId ? ' (você)' : ''}${p.host ? ' 👑' : ''}` : `Vaga ${i + 1}`}
              </span>
              <span className="font-pixel" style={{ fontSize: '8px' }}>
                {!p ? <span className="text-muted-foreground">Aguardando...</span>
                  : p.ready ? <span className="text-primary">Pronto</span>
                  : <span className="text-coffee-gold">Escolhendo...</span>}
              </span>
            </div>
          );
        })}
      </div>
      <p className="font-pixel text-muted-foreground mb-1.5" style={{ fontSize: '8px' }}>Seu personagem</p>
      {characterPicker}
      <p className="font-pixel text-muted-foreground mb-3" style={{ fontSize: '7px' }}>
        {players.length} jogador(es) · dificuldade {Math.round(coopScale(players.length) * 100)}%
      </p>
      <div className="flex flex-col gap-2">
        {!s.isHost && (
          <button
            onClick={() => s.update({ ready: !me?.ready })}
            className={`font-pixel text-xs px-4 py-3 rounded-lg pixel-border ${me?.ready ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`}
          >
            {me?.ready ? '✖ CANCELAR PRONTO' : '✔ ESTOU PRONTO'}
          </button>
        )}
        {s.isHost && (
          <button
            onClick={() => { const payload = s.startMatch(difficulty); startedRef.current = true; onStart(s, payload); }}
            disabled={!allReady}
            className="font-pixel text-xs px-4 py-3 bg-primary text-primary-foreground rounded-lg pixel-border disabled:opacity-40"
          >
            ▶ INICIAR PARTIDA
          </button>
        )}
        {s.isHost && !allReady && (
          <p className="font-pixel text-muted-foreground" style={{ fontSize: '7px' }}>Aguardando todos ficarem prontos.</p>
        )}
        <button onClick={leave} className="font-pixel text-xs text-muted-foreground hover:text-foreground">
          ← Sair da sala
        </button>
      </div>
    </div>
  );
};

export default MultiplayerPanel;
