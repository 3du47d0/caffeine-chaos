import React, { useEffect, useState } from 'react';
import { Achievement } from '../../game/types';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onDone: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({ achievement, onDone }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDone, 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onDone]);

  if (!achievement) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
      }`}
    >
      <div className="pixel-border rounded-lg p-3 bg-card flex items-center gap-3 min-w-[200px] max-w-[90vw]">
        <span className="text-2xl">{achievement.icon}</span>
        <div>
          <div className="font-pixel text-primary text-xs">CONQUISTA!</div>
          <div className="font-pixel text-foreground" style={{ fontSize: '9px' }}>
            {achievement.name}
          </div>
          <div className="font-retro text-xs text-muted-foreground">
            🎁 {achievement.rewardName}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;
