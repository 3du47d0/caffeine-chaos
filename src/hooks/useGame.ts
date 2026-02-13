import { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, Upgrades } from '../game/types';
import { createInitialState, update } from '../game/engine';
import { render } from '../game/renderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';

export function useGame(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const stateRef = useRef<GameState | null>(null);
  const animFrameRef = useRef<number>(0);
  const [phase, setPhase] = useState<GameState['phase']>('lobby');
  const [gold, setGold] = useState(0);
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [dashCd, setDashCd] = useState(0);
  const [ultCd, setUltCd] = useState(0);
  const [runGold, setRunGold] = useState(0);
  const [floor, setFloor] = useState(0);

  const savedGoldRef = useRef(0);
  const upgradesRef = useRef<Upgrades>({
    maxHpBonus: 0,
    damageBonus: 0,
    speedBonus: 0,
    dashCdrBonus: 0,
  });

  // Load saved data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cafe_chaos_save');
      if (saved) {
        const data = JSON.parse(saved);
        savedGoldRef.current = data.gold || 0;
        upgradesRef.current = data.upgrades || upgradesRef.current;
        setGold(savedGoldRef.current);
      }
    } catch {}
  }, []);

  const saveData = useCallback(() => {
    localStorage.setItem('cafe_chaos_save', JSON.stringify({
      gold: savedGoldRef.current,
      upgrades: upgradesRef.current,
    }));
  }, []);

  const startRun = useCallback(() => {
    const state = createInitialState(upgradesRef.current);
    stateRef.current = state;
    setPhase('playing');
    setHp(state.player.hp);
    setMaxHp(state.player.maxHp);
  }, []);

  const returnToLobby = useCallback(() => {
    const state = stateRef.current;
    if (state) {
      savedGoldRef.current += state.goldCollected;
      setGold(savedGoldRef.current);
      saveData();
    }
    stateRef.current = null;
    setPhase('lobby');
    setRunGold(0);
  }, [saveData]);

  const buyUpgrade = useCallback((id: keyof Upgrades, cost: number) => {
    if (savedGoldRef.current >= cost) {
      savedGoldRef.current -= cost;
      upgradesRef.current[id]++;
      setGold(savedGoldRef.current);
      saveData();
      return true;
    }
    return false;
  }, [saveData]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = stateRef.current;
      if (state) state.keys.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const state = stateRef.current;
      if (state) state.keys.delete(e.key.toLowerCase());
    };
    const handleMouseMove = (e: MouseEvent) => {
      const state = stateRef.current;
      if (!state) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      state.mousePos = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };
    const handleMouseDown = () => {
      const state = stateRef.current;
      if (state) state.mouseDown = true;
    };
    const handleMouseUp = () => {
      const state = stateRef.current;
      if (state) state.mouseDown = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    let lastPhase = '';

    const loop = () => {
      const state = stateRef.current;
      if (state && state.phase === 'playing') {
        update(state);
        render(ctx, state);

        // Sync React state (throttled)
        setHp(state.player.hp);
        setMaxHp(state.player.maxHp);
        setDashCd(state.player.dashCooldown);
        setUltCd(state.player.ultimateCooldown);
        setRunGold(state.goldCollected);
        setFloor(state.floor);
      }

      if (state && state.phase !== lastPhase) {
        lastPhase = state.phase;
        setPhase(state.phase);
        if (state.phase === 'gameover' || state.phase === 'victory') {
          savedGoldRef.current += state.goldCollected;
          setGold(savedGoldRef.current);
          saveData();
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canvasRef, saveData]);

  return {
    phase, gold, hp, maxHp, dashCd, ultCd, runGold, floor,
    startRun, returnToLobby, buyUpgrade, upgrades: upgradesRef.current,
  };
}
