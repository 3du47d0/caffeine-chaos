import React from 'react';
import { RunBuff } from '../../game/types';

interface RewardScreenProps {
  choices: RunBuff[];
  onChoose: (buff: RunBuff) => void;
}

const RewardScreen: React.FC<RewardScreenProps> = ({ choices, onChoose }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-2 sm:p-4"
      style={{ background: 'rgba(20, 10, 5, 0.92)' }}>
      {/* Header */}
      <div className="mb-4 sm:mb-8 text-center animate-fade-in">
        <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">☕</div>
        <h2 className="font-pixel text-coffee-gold text-glow text-sm sm:text-xl mb-1 tracking-widest">
          UPGRADE DE MENU
        </h2>
        <p className="font-pixel text-foreground/60" style={{ fontSize: '9px' }}>
          Chefe derrotado! Escolha sua recompensa:
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 px-2 sm:px-4 w-full max-w-lg sm:max-w-none items-center sm:items-stretch sm:justify-center">
        {choices.map((buff, i) => (
          <button
            key={buff.id}
            onClick={() => onChoose(buff)}
            className="group relative flex flex-row sm:flex-col items-center gap-3 p-3 sm:p-5 rounded-xl pixel-border
              bg-coffee-dark hover:bg-coffee-medium transition-all duration-200
              hover:scale-105 active:scale-95 cursor-pointer w-full sm:w-auto"
            style={{
              animationDelay: `${i * 100}ms`,
              minWidth: window.innerWidth >= 640 ? '140px' : undefined,
            }}
          >
            {/* Glow on hover */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ boxShadow: '0 0 20px 4px rgba(212,160,58,0.4)' }} />

            {/* Icon */}
            <div className="text-3xl sm:text-5xl drop-shadow-lg relative flex-shrink-0">{buff.icon}</div>

            {/* Text */}
            <div className="flex-1 sm:text-center">
              <h3 className="font-pixel text-coffee-gold text-xs sm:text-sm leading-tight">
                {buff.name}
              </h3>
              <p className="font-pixel text-foreground/70 leading-relaxed mt-1" style={{ fontSize: '9px' }}>
                {buff.description}
              </p>
            </div>

            {/* Select hint */}
            <div className="px-2 sm:px-3 py-1 rounded pixel-border font-pixel
              text-foreground/50 group-hover:text-coffee-gold group-hover:border-coffee-gold
              transition-colors duration-150 border border-foreground/20 flex-shrink-0"
              style={{ fontSize: '8px' }}>
              ESCOLHER
            </div>
          </button>
        ))}
      </div>

      <p className="mt-4 sm:mt-8 font-pixel text-foreground/30 animate-pulse" style={{ fontSize: '9px' }}>
        Toque ou clique para continuar
      </p>
    </div>
  );
};

export default RewardScreen;
