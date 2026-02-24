import { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, Upgrades, RunBuff, RoomTime } from '../game/types';
import { createInitialState, update, applyRunBuff } from '../game/engine';
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
  const [rewardChoices, setRewardChoices] = useState<RunBuff[]>([]);
  const [playerShield, setPlayerShield] = useState(false);
  const [runTimer, setRunTimer] = useState(0);
  const [roomTimes, setRoomTimes] = useState<RoomTime[]>([]);

  const savedGoldRef = useRef(0);
  const upgradesRef = useRef<Upgrades>({
    maxHpBonus: 0,
    damageBonus: 0,
    speedBonus: 0,
    dashCdrBonus: 0,
  });

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
    setRewardChoices([]);
    setPlayerShield(false);
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
    setRewardChoices([]);
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

  const chooseBuff = useCallback((buff: RunBuff) => {
    const state = stateRef.current;
    if (!state) return;
    applyRunBuff(state, buff);
    setRewardChoices([]);
    setPhase(state.phase);
    // Play a simple ding sound via AudioContext if available
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, []);

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

        setHp(state.player.hp);
        setMaxHp(state.player.maxHp);
        setDashCd(state.player.dashCooldown);
        setUltCd(state.player.ultimateCooldown);
        setRunGold(state.goldCollected);
        setFloor(state.floor);
        setPlayerShield(state.player.shield);
        setRunTimer(state.runTimer);
        setRoomTimes([...state.roomTimes]);

      // Also render on reward phase (paused)
      if (state && state.phase === 'reward') {
        render(ctx, state);
      }

      if (state && state.phase !== lastPhase) {
        lastPhase = state.phase;
        setPhase(state.phase);
        if (state.phase === 'reward') {
          setRewardChoices([...state.rewardChoices]);
          // Ding sound on reward screen open
          try {
            const ac = new AudioContext();
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.frequency.setValueAtTime(660, ac.currentTime);
            osc.frequency.setValueAtTime(990, ac.currentTime + 0.15);
            gain.gain.setValueAtTime(0.25, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
            osc.start(ac.currentTime);
            osc.stop(ac.currentTime + 0.5);
          } catch {}
        }
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
    phase, gold, hp, maxHp, dashCd, ultCd, runGold, floor, rewardChoices, playerShield,
    runTimer, roomTimes,
    startRun, returnToLobby, buyUpgrade, chooseBuff, upgrades: upgradesRef.current,
  };
}
