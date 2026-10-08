import React from 'react';
import { PERF_MODES, PerfMode } from '../../game/perf';

interface Props {
  musicMuted?: boolean;
  onToggleMusic?: () => void;
  perfMode?: PerfMode;
  onPerfMode?: (m: PerfMode) => void;
  onResetRequest: () => void;
}

const SettingsPanel: React.FC<Props> = ({ musicMuted, onToggleMusic, perfMode, onPerfMode, onResetRequest }) => (
  <div className="pixel-border rounded-lg p-3 sm:p-4 mb-4 bg-card">
    <h2 className="font-pixel text-xs sm:text-sm text-primary mb-3">CONFIGURAÇÕES</h2>

    {onToggleMusic && (
      <button
        onClick={onToggleMusic}
        className="w-full font-pixel text-xs px-4 py-3 mb-3 bg-secondary text-secondary-foreground rounded-lg pixel-border"
      >
        {musicMuted ? '🔇 Música: DESLIGADA' : '🔊 Música: LIGADA'}
      </button>
    )}

    {onPerfMode && (
      <>
        <p className="font-pixel text-muted-foreground mb-1.5 text-left" style={{ fontSize: '8px' }}>Qualidade gráfica</p>
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {PERF_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => onPerfMode(m.id)}
              className={`p-2 rounded-lg pixel-border ${perfMode === m.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            >
              <div className="text-base">{m.icon}</div>
              <div className="font-pixel" style={{ fontSize: '7px' }}>{m.name}</div>
            </button>
          ))}
        </div>
      </>
    )}

    <button
      onClick={onResetRequest}
      className="font-pixel text-xs text-destructive/70 hover:text-destructive transition-colors"
    >
      🗑️ Reiniciar Progresso
    </button>
  </div>
);

export default SettingsPanel;
