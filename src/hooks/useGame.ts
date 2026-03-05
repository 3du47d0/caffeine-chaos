import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { GameState, Upgrades, RunBuff, RoomTime, Achievement } from '../game/types';
import { createInitialState, update, applyRunBuff } from '../game/engine';
import { render } from '../game/renderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { InputManager, getPerformanceTier, getParticleMultiplier } from '../game/input';
import { MusicManager } from '../game/music';
import {
  ACHIEVEMENTS, loadAchievementProgress, saveAchievementProgress, checkAndUnlock,
} from '../game/achievements';

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
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [isBossRoom, setIsBossRoom] = useState(false);

  const savedGoldRef = useRef(0);
  const upgradesRef = useRef<Upgrades>({
    maxHpBonus: 0, damageBonus: 0, speedBonus: 0, dashCdrBonus: 0,
  });

  const inputManager = useMemo(() => new InputManager(), []);
  const musicManager = useMemo(() => new MusicManager(), []);
  const perfTier = useMemo(() => getPerformanceTier(), []);
  const particleMult = useMemo(() => getParticleMultiplier(perfTier), [perfTier]);

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
    return () => { musicManager.destroy(); };
  }, [musicManager]);

  const saveData = useCallback(() => {
    localStorage.setItem('cafe_chaos_save', JSON.stringify({
      gold: savedGoldRef.current,
      upgrades: upgradesRef.current,
    }));
  }, []);

  const updateAchievements = useCallback((state: GameState) => {
    const progress = loadAchievementProgress();

    // Update cumulative progress
    progress['first_blood'] = progress['first_blood'] || { current: 0, unlocked: false };
    progress['first_blood'].current = Math.max(progress['first_blood'].current, state.runStats.enemiesKilled);

    progress['gold_rush'] = progress['gold_rush'] || { current: 0, unlocked: false };
    progress['gold_rush'].current += state.runStats.goldCollected;

    progress['speed_demon'] = progress['speed_demon'] || { current: 0, unlocked: false };
    progress['speed_demon'].current += state.runStats.fastRooms;

    progress['untouchable'] = progress['untouchable'] || { current: 0, unlocked: false };
    progress['untouchable'].current += state.runStats.perfectRooms;

    progress['boss_slayer'] = progress['boss_slayer'] || { current: 0, unlocked: false };
    progress['boss_slayer'].current += state.runStats.bossesDefeated;

    progress['massacre'] = progress['massacre'] || { current: 0, unlocked: false };
    progress['massacre'].current += state.runStats.enemiesKilled;

    if (state.phase === 'victory' || state.phase === 'secret_victory') {
      progress['victory_lap'] = progress['victory_lap'] || { current: 0, unlocked: false };
      progress['victory_lap'].current = 1;
    }

    const newlyUnlocked = checkAndUnlock(progress);
    saveAchievementProgress(progress);

    if (newlyUnlocked.length > 0) {
      const achievement = ACHIEVEMENTS.find(a => a.id === newlyUnlocked[0]);
      if (achievement) setUnlockedAchievement(achievement);
    }
  }, []);

  const startRun = useCallback(() => {
    const state = createInitialState(upgradesRef.current);
    state.particleMultiplier = particleMult;
    stateRef.current = state;
    setPhase('playing');
    setHp(state.player.hp);
    setMaxHp(state.player.maxHp);
    setRewardChoices([]);
    setPlayerShield(false);
    musicManager.init();
    musicManager.setMode('explore');
  }, [particleMult, musicManager]);

  const returnToLobby = useCallback(() => {
    const state = stateRef.current;
    if (state) {
      savedGoldRef.current += state.goldCollected;
      setGold(savedGoldRef.current);
      updateAchievements(state);
      saveData();
    }
    stateRef.current = null;
    setPhase('lobby');
    setRunGold(0);
    setRewardChoices([]);
    musicManager.stop();
  }, [saveData, updateAchievements, musicManager]);

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

  const toggleMusic = useCallback(() => {
    return musicManager.toggleMute();
  }, [musicManager]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    inputManager.attach(canvas, CANVAS_WIDTH, CANVAS_HEIGHT);

    let lastPhase = '';
    let wasBossRoom = false;

    const loop = () => {
      const state = stateRef.current;
      if (state && state.phase === 'playing') {
        const input = inputManager.getInput(state.player.pos);
        state.keys.clear();
        if (input.moveX < -0.3) state.keys.add('a');
        if (input.moveX > 0.3) state.keys.add('d');
        if (input.moveY < -0.3) state.keys.add('w');
        if (input.moveY > 0.3) state.keys.add('s');
        if (input.dash) state.keys.add(' ');
        if (input.ultimate) state.keys.add('q');
        state.mousePos = { x: input.aimX, y: input.aimY };
        state.mouseDown = input.shoot;

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
        setIsBossRoom(state.isBossRoom);

        // Music mode based on room type
        const currentRoom = state.rooms[state.currentRoom];
        const isNowBoss = currentRoom?.isBossRoom && currentRoom.boss && currentRoom.boss.hp > 0;
        const isSecretBoss = currentRoom?.isSecretBossRoom;
        if (isSecretBoss && isNowBoss) {
          musicManager.setMode('secret_boss');
        } else if (isNowBoss && !wasBossRoom) {
          musicManager.setMode('boss');
        } else if (!isNowBoss && wasBossRoom) {
          musicManager.setMode('explore');
        }
        wasBossRoom = !!isNowBoss;
      }

      if (state && state.phase === 'reward') {
        render(ctx, state);
      }

      if (state && state.phase !== lastPhase) {
        lastPhase = state.phase;
        setPhase(state.phase);
        if (state.phase === 'reward') {
          setRewardChoices([...state.rewardChoices]);
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
        if (state.phase === 'gameover' || state.phase === 'victory' || state.phase === 'secret_victory') {
          savedGoldRef.current += state.goldCollected;
          if (state.phase === 'secret_victory') {
            savedGoldRef.current += 50; // bonus gold for secret boss
          }
          setGold(savedGoldRef.current);
          updateAchievements(state);
          saveData();
          musicManager.stop();
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      inputManager.detach();
    };
  }, [canvasRef, saveData, inputManager, musicManager, updateAchievements]);

  return {
    phase, gold, hp, maxHp, dashCd, ultCd, runGold, floor, rewardChoices, playerShield,
    runTimer, roomTimes, inputManager, isBossRoom,
    startRun, returnToLobby, buyUpgrade, chooseBuff, toggleMusic,
    upgrades: upgradesRef.current,
    unlockedAchievement, clearAchievementNotification: () => setUnlockedAchievement(null),
    musicMuted: musicManager.isMuted(),
  };
}
