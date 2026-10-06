import React, { useMemo } from 'react';
import { MISSIONS, MISSION_CATEGORY_LABELS, MissionCategory, getMissionStatus } from '../../game/missions';
import { loadMeta } from '../../game/meta';

const CATEGORIES: MissionCategory[] = ['combat', 'exploration', 'survival', 'multiplayer'];

const MissionsPanel: React.FC = () => {
  const meta = useMemo(() => loadMeta(), []);
  const doneCount = MISSIONS.filter(m => getMissionStatus(m, meta) === 'done').length;

  return (
    <div className="pixel-border rounded-lg p-3 sm:p-4 mb-4 bg-card text-left">
      <h2 className="font-pixel text-xs sm:text-sm text-primary mb-1 text-center">MISSÕES</h2>
      <p className="font-pixel text-muted-foreground text-center mb-3" style={{ fontSize: '8px' }}>
        {doneCount}/{MISSIONS.length} concluídas
      </p>
      <div className="max-h-[50dvh] overflow-y-auto space-y-3 pr-1">
        {CATEGORIES.map(cat => (
          <div key={cat}>
            <div className="font-pixel text-xs text-coffee-gold mb-1">{MISSION_CATEGORY_LABELS[cat]}</div>
            <div className="space-y-2">
              {MISSIONS.filter(m => m.category === cat).map(m => {
                const status = getMissionStatus(m, meta);
                const cur = Math.min(m.progress(meta), m.target);
                const pct = Math.round((cur / m.target) * 100);
                const locked = status === 'locked';
                return (
                  <div
                    key={m.id}
                    className={`rounded-lg p-2 pixel-border ${
                      status === 'done' ? 'bg-primary/15' : locked ? 'bg-muted/30 opacity-50' : 'bg-secondary'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-pixel text-foreground" style={{ fontSize: '9px' }}>
                        {locked ? '🔒 ???' : m.title}
                      </span>
                      <span className="font-pixel" style={{ fontSize: '7px' }}>
                        {status === 'done' ? <span className="text-primary">✓ CONCLUÍDA</span>
                          : locked ? <span className="text-muted-foreground">BLOQUEADA</span>
                          : <span className="text-coffee-gold">EM ANDAMENTO</span>}
                      </span>
                    </div>
                    {!locked && (
                      <>
                        <div className="font-pixel text-foreground/60 mt-1" style={{ fontSize: '8px' }}>{m.description}</div>
                        <div className="h-1.5 bg-background rounded mt-1.5 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between font-pixel text-foreground/50 mt-1" style={{ fontSize: '7px' }}>
                          <span>{cur}/{m.target}</span>
                          <span>🔓 {m.reward.label}</span>
                        </div>
                      </>
                    )}
                    {locked && (
                      <div className="font-pixel text-foreground/50 mt-1" style={{ fontSize: '7px' }}>
                        Conclua a missão anterior para revelar.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {cat === 'multiplayer' && (
              <p className="font-pixel text-muted-foreground mt-1" style={{ fontSize: '7px' }}>
                Jogue pela aba MULTIPLAYER para avançar.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MissionsPanel;
