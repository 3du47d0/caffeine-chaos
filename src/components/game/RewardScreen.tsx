import React from 'react';
import { RunBuff } from '../../game/types';

interface RewardScreenProps {
  choices: RunBuff[];
  onChoose: (buff: RunBuff) => void;
}

const RewardScreen: React.FC<RewardScreenProps> = ({ choices, onChoose }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20"
      style={{ background: 'rgba(20, 10, 5, 0.92)' }}>
      {/* Header */}
      <div className="mb-8 text-center animate-fade-in">
        <div className="text-4xl mb-3">☕</div>
        <h2 className="font-pixel text-coffee-gold text-glow text-xl mb-1 tracking-widest">
          UPGRADE DE MENU
        </h2>
        <p className="font-pixel text-foreground/60 text-xs">
          Chefe derrotado! Escolha sua recompensa:
        </p>
      </div>

      {/* Cards */}
      <div className="flex gap-6 px-4">
        {choices.map((buff, i) => (
          <button
            key={buff.id}
            onClick={() => onChoose(buff)}
            className="group relative flex flex-col items-center gap-3 p-5 rounded-xl pixel-border
              bg-coffee-dark hover:bg-coffee-medium transition-all duration-200
              hover:scale-105 hover:-translate-y-1 cursor-pointer"
            style={{
              animationDelay: `${i * 100}ms`,
              minWidth: '160px',
            }}
          >
            {/* Glow on hover */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ boxShadow: '0 0 20px 4px rgba(212,160,58,0.4)' }} />

            {/* Icon */}
            <div className="text-5xl drop-shadow-lg relative">{buff.icon}</div>

            {/* Name */}
            <h3 className="font-pixel text-coffee-gold text-sm text-center leading-tight">
              {buff.name}
            </h3>

            {/* Description */}
            <p className="font-pixel text-foreground/70 text-xs text-center leading-relaxed">
              {buff.description}
            </p>

            {/* Select hint */}
            <div className="mt-2 px-3 py-1 rounded pixel-border font-pixel text-xs
              text-foreground/50 group-hover:text-coffee-gold group-hover:border-coffee-gold
              transition-colors duration-150 border border-foreground/20">
              ESCOLHER
            </div>
          </button>
        ))}
      </div>

      <p className="mt-8 font-pixel text-foreground/30 text-xs animate-pulse">
        Clique em um item para continuar
      </p>
    </div>
  );
};

export default RewardScreen;
