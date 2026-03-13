import React, { useState } from 'react';
import { CHARACTERS, isCharacterUnlocked, CharacterId } from '../../game/characters';
import { DIFFICULTIES, isDifficultyUnlocked, DifficultyId } from '../../game/difficulty';
import AchievementsScreen from './AchievementsScreen';

interface LobbyProps {
  gold: number;
  onStartRun: (difficulty: DifficultyId, character: CharacterId) => void;
  hasGamepad?: boolean;
  isTouchDevice?: boolean;
  onToggleMusic?: () => void;
  musicMuted?: boolean;
}

const Lobby: React.FC<LobbyProps> = ({ gold, onStartRun, hasGamepad, isTouchDevice, onToggleMusic, musicMuted }) => {
  const [showAchievements, setShowAchievements] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyId>('medium');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('barista');
  const [tab, setTab] = useState<'main' | 'characters'>('main');

  const visibleDifficulties = DIFFICULTIES.filter(d => !d.hidden || isDifficultyUnlocked(d.id));

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-lg w-full text-center px-2">
        <h1 className="font-pixel text-lg sm:text-2xl md:text-3xl text-primary text-glow mb-2 leading-relaxed">
          ☕ CAFE CHAOS
        </h1>
        <p className="font-pixel text-xs text-muted-foreground mb-3 sm:mb-4">The Morning Rush</p>

        <div className="font-pixel text-sm text-coffee-gold mb-4">
          Grãos de Ouro: {gold} ✦
        </div>

        {/* Tab buttons */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setTab('main')}
            className={`font-pixel text-xs px-4 py-2 rounded-lg pixel-border transition-all ${
              tab === 'main' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            ⚔ JOGAR
          </button>
          <button
            onClick={() => setTab('characters')}
            className={`font-pixel text-xs px-4 py-2 rounded-lg pixel-border transition-all ${
              tab === 'characters' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            👤 PERSONAGENS
          </button>
        </div>

        {tab === 'main' && (
          <>
            {/* Difficulty Selector */}
            <div className="pixel-border rounded-lg p-3 sm:p-4 mb-4 bg-card">
              <h2 className="font-pixel text-xs sm:text-sm text-primary mb-3">DIFICULDADE</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {visibleDifficulties.map((diff) => {
                  const unlocked = isDifficultyUnlocked(diff.id);
                  const selected = selectedDifficulty === diff.id;
                  return (
                    <button
                      key={diff.id}
                      onClick={() => unlocked && setSelectedDifficulty(diff.id)}
                      disabled={!unlocked}
                      className={`p-2 rounded-lg pixel-border text-center transition-all ${
                        !unlocked
                          ? 'bg-muted/30 opacity-40 cursor-not-allowed'
                          : selected
                          ? 'bg-primary text-primary-foreground scale-105'
                          : 'bg-secondary text-secondary-foreground hover:scale-[1.02] cursor-pointer'
                      }`}
                    >
                      <div className="text-lg mb-1">{diff.icon}</div>
                      <div className="font-pixel text-xs">{diff.name}</div>
                      <div className="font-pixel text-foreground/50 mt-0.5" style={{ fontSize: '7px' }}>
                        {unlocked ? diff.description : '🔒 ???'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected character preview */}
            {(() => {
              const char = CHARACTERS.find(c => c.id === selectedCharacter);
              if (!char) return null;
              return (
                <div className="pixel-border rounded-lg p-3 mb-4 bg-card">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{char.icon}</span>
                    <div className="text-left">
                      <div className="font-pixel text-xs text-primary">{char.name}</div>
                      <div className="font-pixel text-foreground/60" style={{ fontSize: '8px' }}>{char.special}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mb-4">
              <button
                onClick={() => onStartRun(selectedDifficulty, selectedCharacter)}
                className="font-pixel text-xs sm:text-sm px-6 py-3 bg-primary text-primary-foreground rounded-lg
                           hover:scale-105 active:scale-95 transition-transform pixel-border
                           hover:shadow-[0_0_30px_hsl(var(--coffee-gold)/0.4)]"
              >
                ▶ INICIAR RUN
              </button>
              <button
                onClick={() => setShowAchievements(true)}
                className="font-pixel text-xs px-4 py-2 sm:py-3 bg-secondary text-secondary-foreground rounded-lg
                           hover:scale-105 active:scale-95 transition-transform pixel-border"
              >
                🏆 CONQUISTAS
              </button>
            </div>
          </>
        )}

        {tab === 'characters' && (
          <div className="pixel-border rounded-lg p-3 sm:p-4 mb-4 bg-card">
            <h2 className="font-pixel text-xs sm:text-sm text-primary mb-3">PERSONAGENS</h2>
            <div className="grid grid-cols-1 gap-2">
              {CHARACTERS.map((char) => {
                const unlocked = isCharacterUnlocked(char.id);
                const selected = selectedCharacter === char.id;
                return (
                  <button
                    key={char.id}
                    onClick={() => unlocked && setSelectedCharacter(char.id)}
                    disabled={!unlocked}
                    className={`flex items-center gap-3 p-3 rounded-lg pixel-border text-left transition-all ${
                      !unlocked
                        ? 'bg-muted/30 opacity-50 cursor-not-allowed'
                        : selected
                        ? 'bg-primary/20 border-primary scale-[1.02]'
                        : 'bg-secondary hover:bg-secondary/80 cursor-pointer'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl">{unlocked ? char.icon : '🔒'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-pixel text-xs text-foreground">{unlocked ? char.name : '???'}</div>
                      <div className="font-pixel text-foreground/60" style={{ fontSize: '8px' }}>
                        {unlocked ? char.description : 'Desbloqueie derrotando desafios secretos'}
                      </div>
                      {unlocked && (
                        <div className="flex gap-2 mt-1 font-pixel text-foreground/40" style={{ fontSize: '7px' }}>
                          <span>HP: {Math.round(char.hpMult * 100)}%</span>
                          <span>VEL: {Math.round(char.speedMult * 100)}%</span>
                          <span>DMG: {Math.round(char.damageMult * 100)}%</span>
                        </div>
                      )}
                    </div>
                    {selected && unlocked && (
                      <span className="font-pixel text-xs text-primary">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-3 font-retro text-xs text-muted-foreground space-y-1">
          {isTouchDevice ? (
            <>
              <p>🕹️ Joystick Esquerdo - Mover</p>
              <p>🎯 Joystick Direito - Mirar e Atirar</p>
              <p>💨 Dash | ☕ Ultimate</p>
            </>
          ) : (
            <>
              <p>WASD - Mover | Mouse - Mirar e Atirar</p>
              <p>Espaço - Espresso Shot (Dash) | Q - Chuva de Cappuccino</p>
            </>
          )}
          {hasGamepad && (
            <p className="text-primary mt-2">🎮 Controle detectado!</p>
          )}
        </div>

        {onToggleMusic && (
          <button
            onClick={onToggleMusic}
            className="mt-3 font-pixel text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {musicMuted ? '🔇 Música OFF' : '🔊 Música ON'}
          </button>
        )}
      </div>

      {showAchievements && (
        <AchievementsScreen onClose={() => setShowAchievements(false)} />
      )}
    </div>
  );
};

export default Lobby;
