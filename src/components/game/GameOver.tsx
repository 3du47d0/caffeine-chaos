import React from 'react';

interface GameOverProps {
  victory: boolean;
  goldCollected: number;
  onReturnToLobby: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ victory, goldCollected, onReturnToLobby }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10">
      <div className="text-center pixel-border rounded-xl p-8 bg-card max-w-sm">
        {victory ? (
          <>
            <div className="text-5xl mb-4">☕🏆</div>
            <h2 className="font-pixel text-xl text-primary text-glow mb-2">VITÓRIA!</h2>
            <p className="font-retro text-lg text-muted-foreground mb-2">
              O Rei Descafeinado foi derrotado!
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">💀☕</div>
            <h2 className="font-pixel text-xl text-accent mb-2">GAME OVER</h2>
            <p className="font-retro text-lg text-muted-foreground mb-2">
              Você ficou sem cafeína...
            </p>
          </>
        )}

        <div className="font-pixel text-sm text-coffee-gold my-4">
          +{goldCollected} Grãos de Ouro ✦
        </div>

        <button
          onClick={onReturnToLobby}
          className="font-pixel text-sm px-6 py-3 bg-primary text-primary-foreground rounded-lg
                     hover:scale-105 transition-transform pixel-border"
        >
          VOLTAR AO CAFÉ
        </button>
      </div>
    </div>
  );
};

export default GameOver;
