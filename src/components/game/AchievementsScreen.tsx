import React from 'react';
import { ACHIEVEMENTS, loadAchievementProgress } from '../../game/achievements';
import { Progress } from '../ui/progress';

interface AchievementsScreenProps {
  onClose: () => void;
}

const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ onClose }) => {
  const progress = loadAchievementProgress();

  const totalUnlocked = ACHIEVEMENTS.filter(a => progress[a.id]?.unlocked).length;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/95 z-50 p-3 overflow-y-auto">
      <div className="max-w-md w-full pixel-border rounded-xl p-4 bg-card mx-2 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-sm text-primary text-glow">🏆 CONQUISTAS</h2>
          <button
            onClick={onClose}
            className="font-pixel text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div className="font-pixel text-xs text-muted-foreground mb-4 text-center">
          {totalUnlocked}/{ACHIEVEMENTS.length} desbloqueadas
        </div>

        <div className="space-y-3">
          {ACHIEVEMENTS.map(achievement => {
            const p = progress[achievement.id] || { current: 0, unlocked: false };
            const percent = Math.min(100, (p.current / achievement.requirement) * 100);

            return (
              <div
                key={achievement.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  p.unlocked
                    ? 'border-primary/60 bg-primary/10'
                    : 'border-muted bg-muted/20'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl flex-shrink-0">{achievement.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-pixel text-xs text-foreground">
                      {achievement.name}
                      {p.unlocked && <span className="ml-1 text-primary">✓</span>}
                    </div>
                    <div className="font-retro text-xs text-muted-foreground mt-0.5">
                      {achievement.description}
                    </div>

                    {!p.unlocked && (
                      <div className="mt-2">
                        <Progress value={percent} className="h-2" />
                        <div className="font-pixel text-muted-foreground mt-1" style={{ fontSize: '7px' }}>
                          {p.current}/{achievement.requirement}
                        </div>
                      </div>
                    )}

                    {p.unlocked && (
                      <div className="mt-1 font-pixel text-primary" style={{ fontSize: '8px' }}>
                        🎁 {achievement.rewardName}: {achievement.rewardDescription}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {totalUnlocked === ACHIEVEMENTS.length && (
          <div className="mt-4 p-3 rounded-lg border-2 border-accent bg-accent/10 text-center">
            <div className="font-pixel text-xs text-accent">🌟 TODAS DESBLOQUEADAS!</div>
            <div className="font-retro text-xs text-muted-foreground mt-1">
              O portal secreto foi revelado...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsScreen;
