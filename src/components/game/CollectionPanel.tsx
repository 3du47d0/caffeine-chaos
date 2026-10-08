import React, { useMemo } from 'react';
import { RUN_BUFF_POOL, RARITY_COLORS, RARITY_LABELS } from '../../game/buffs';
import { completedMissionIds, isItemUnlocked, itemUnlockMission } from '../../game/missions';
import type { BuffCategory } from '../../game/types';

/** Collection groups shown to the player (mapped from item categories). */
const GROUPS: { id: BuffCategory | 'consumable'; label: string }[] = [
  { id: 'offensive', label: '⚔ Armas' },
  { id: 'defensive', label: '🛡 Equipamentos' },
  { id: 'consumable', label: '🧪 Consumíveis' },
  { id: 'mobility', label: '💨 Passivos' },
  { id: 'special', label: '🌟 Itens Especiais' },
];

const CONSUMABLES = [
  { name: 'Xícara de Cura', icon: '❤', description: 'Recupera vida ao ser coletada.' },
  { name: 'Grão de Ouro', icon: '✦', description: 'Moeda coletada durante a run.' },
  { name: 'Baú de Madeira', icon: '📦', description: 'Escolha 1 de 3 itens.' },
  { name: 'Baú Dourado', icon: '🎁', description: 'Itens raros ou melhores.' },
];

const CollectionPanel: React.FC = () => {
  const done = useMemo(() => completedMissionIds(), []);
  const unlockedCount = RUN_BUFF_POOL.filter(b => isItemUnlocked(b.name, done)).length;

  return (
    <div className="pixel-border rounded-lg p-3 sm:p-4 mb-4 bg-card text-left">
      <h2 className="font-pixel text-xs sm:text-sm text-primary mb-1 text-center">COLEÇÃO</h2>
      <p className="font-pixel text-muted-foreground text-center mb-3" style={{ fontSize: '8px' }}>
        {unlockedCount}/{RUN_BUFF_POOL.length} itens desbloqueados
      </p>
      <div className="max-h-[50dvh] overflow-y-auto space-y-3 pr-1">
        {GROUPS.map(g => (
          <div key={g.id}>
            <div className="font-pixel text-xs text-coffee-gold mb-1.5">{g.label}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {g.id === 'consumable'
                ? CONSUMABLES.map(c => (
                    <div key={c.name} className="rounded-lg p-2 bg-secondary pixel-border">
                      <div className="font-pixel text-foreground" style={{ fontSize: '8px' }}>{c.icon} {c.name}</div>
                      <div className="font-pixel text-foreground/50 mt-1" style={{ fontSize: '7px' }}>{c.description}</div>
                    </div>
                  ))
                : RUN_BUFF_POOL.filter(b => b.category === g.id).map(b => {
                    const unlocked = isItemUnlocked(b.name, done);
                    const mission = itemUnlockMission(b.name);
                    return (
                      <div
                        key={b.name}
                        className={`rounded-lg p-2 pixel-border ${unlocked ? 'bg-secondary' : 'bg-muted/30 opacity-60'}`}
                        style={unlocked ? { borderColor: RARITY_COLORS[b.rarity] } : undefined}
                      >
                        <div className="font-pixel text-foreground truncate" style={{ fontSize: '8px' }}>
                          {unlocked ? `${b.icon} ${b.name}` : '🔒 ???'}
                        </div>
                        {unlocked ? (
                          <>
                            <div className="font-pixel mt-0.5" style={{ fontSize: '7px', color: RARITY_COLORS[b.rarity] }}>
                              {RARITY_LABELS[b.rarity]}
                            </div>
                            <div className="font-pixel text-foreground/50 mt-0.5" style={{ fontSize: '7px' }}>{b.description}</div>
                          </>
                        ) : (
                          <div className="font-pixel text-foreground/50 mt-1" style={{ fontSize: '7px' }}>
                            Missão: {mission?.description ?? '???'}
                          </div>
                        )}
                      </div>
                    );
                  })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollectionPanel;
