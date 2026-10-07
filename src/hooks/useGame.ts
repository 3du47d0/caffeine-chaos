import { toast } from 'sonner';
import { MISSIONS, completedMissionIds } from '../game/missions';
import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { GameState, Upgrades, RunBuff, RoomTime, Achievement } from '../game/types';
import { createInitialState, update, applyRunBuff } from '../game/engine';
import { render } from '../game/renderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { InputManager, getPerformanceTier, getParticleMultiplier } from '../game/input';
import { unlockCharacter } from '../game/characters';
import { MusicManager } from '../game/music';
import {
  ACHIEVEMENTS, loadAchievementProgress, saveAchievementProgress, checkAndUnlock,
} from '../game/achievements';
import { DifficultyId } from '../game/difficulty';
import { CharacterId } from '../game/characters';
import { loadMeta, saveMeta } from '../game/meta';
import { loadPerfMode, savePerfMode, optimizeNow, PerfMode } from '../game/perf';
import { discoverLore } from '../game/lore';
import { NetSession, StartPayload } from '../game/net';
import { createAlly, COOP_CONFIG } from '../game/coop';
import { makeSnapshot, applySnapshot, tickClient, Snapshot } from '../game/snapshot';

// Fixed timestep constants
const FIXED_DT = 1000 / 60; // 16.67ms
const MAX_STEPS_PER_FRAME = 3; // Cap to prevent spiral of death

export function useGame(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const stateRef = useRef<GameState | null>(null);
  const netRef = useRef<{ session: NetSession; role: 'host' | 'client'; lastSnap: number; lastInput: number; myName: string } | null>(null);
  const [isCoop, setIsCoop] = useState(false);
  const [isCoopClient, setIsCoopClient] = useState(false);
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
  const [roomTimesVersion, setRoomTimesVersion] = useState(0);
  const [perfMode, setPerfModeState] = useState<PerfMode>(() => loadPerfMode());

  /** Records permanent (meta) progression at the end of a run. */
  const recordMeta = useCallback((state: GameState) => {
    const meta = loadMeta();
    const before = completedMissionIds(meta);
    const rs = state.runStats;
    meta.runs += 1;
    meta.chestsOpened += rs.chestsOpened;
    meta.treasureRooms += rs.treasureRoomsFound;
    meta.perfectBosses += rs.perfectBossKills;
    meta.lowHpBossKills += rs.lowHpBossKills;
    meta.perfectRooms += rs.perfectRooms;
    meta.healsUsed += rs.healsUsed;
    meta.totalDamageTaken += rs.damageTaken;
    meta.bestCombo = Math.max(meta.bestCombo, state.bestCombo);
    if (state.phase === 'victory' || state.phase === 'secret_victory') meta.victories += 1;
    if (state.coopPlayers === 2) meta.coopRuns2 += 1;
    if (state.coopPlayers >= 3) meta.coopRuns3 += 1;
    const net = netRef.current;
    if (net?.role === 'host') meta.revives += state.hostRevives;
    else if (net?.role === 'client') meta.revives += state.allies.find(a => a.id === net.session.myId)?.revivesGiven ?? 0;
    meta.totalKills += state.runStats.enemiesKilled;
    meta.totalBosses += state.runStats.bossesDefeated;
    meta.deepestFloor = Math.max(meta.deepestFloor, state.floor);
    if (state.phase === 'victory' || state.phase === 'secret_victory') {
      if (meta.bestRunFrames === 0 || state.runTimer < meta.bestRunFrames) {
        meta.bestRunFrames = state.runTimer;
      }
    }
    saveMeta(meta);
    const after = completedMissionIds(meta);
    for (const m of MISSIONS) {
      if (after.has(m.id) && !before.has(m.id)) {
        toast.success(`MISSÃO CONCLUÍDA: ${m.title}`, { description: `Recompensa: ${m.reward.label}` });
      }
    }
    discoverLore('intro_2');
    if (meta.runs >= 3) discoverLore('verdade_1');
    if (state.phase === 'victory' || state.phase === 'secret_victory') discoverLore('verdade_2');
  }, []);

  const setPerfMode = useCallback((mode: PerfMode) => {
    savePerfMode(mode);
    setPerfModeState(mode);
    if (stateRef.current) stateRef.current.perfMode = mode;
  }, []);

  /** Manual "Otimizar Jogo" — safe to trigger mid-run. */
  const optimizeGame = useCallback(() => optimizeNow(stateRef.current), []);

  const savedGoldRef = useRef(0);
  const upgradesRef = useRef<Upgrades>({
    maxHpBonus: 0, damageBonus: 0, speedBonus: 0, dashCdrBonus: 0,
  });

  // Track previous values to avoid unnecessary React state updates
  const prevValsRef = useRef({
    hp: -1, maxHp: -1, dashCd: -1, ultCd: -1, runGold: -1,
    floor: -1, shield: false, runTimer: -1, isBossRoom: false,
    roomTimesLen: 0,
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
    try {
      const existing = localStorage.getItem('cafe_chaos_save');
      const parsed = existing ? JSON.parse(existing) : {};
      parsed.gold = savedGoldRef.current;
      parsed.upgrades = upgradesRef.current;
      localStorage.setItem('cafe_chaos_save', JSON.stringify(parsed));
    } catch {}
  }, []);

  const updateAchievements = useCallback((state: GameState) => {
    const progress = loadAchievementProgress();

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

    if ((state.phase === 'victory' || state.phase === 'secret_victory') && state.runTimer < 18000) {
      progress['speedrunner'] = progress['speedrunner'] || { current: 0, unlocked: false };
      progress['speedrunner'].current = 1;
    }

    if (state.runStats.perfectBoss) {
      progress['perfect_boss'] = progress['perfect_boss'] || { current: 0, unlocked: false };
      progress['perfect_boss'].current = 1;
    }

    if (state.runStats.perfectFloor) {
      progress['no_hit_floor'] = progress['no_hit_floor'] || { current: 0, unlocked: false };
      progress['no_hit_floor'].current = 1;
    }

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

  const startRun = useCallback((difficulty: DifficultyId = 'medium', character: CharacterId = 'barista', players = 1) => {
    const state = createInitialState(upgradesRef.current, difficulty, character, players);
    state.perfMode = perfMode;
    state.particleMultiplier = particleMult;
    stateRef.current = state;
    if (import.meta.env.DEV) (window as unknown as { __cafeState?: GameState }).__cafeState = state;
    setPhase('playing');
    setHp(state.player.hp);
    setMaxHp(state.player.maxHp);
    setRewardChoices([]);
    setPlayerShield(false);
    // Reset prev vals
    const pv = prevValsRef.current;
    pv.hp = state.player.hp; pv.maxHp = state.player.maxHp;
    pv.dashCd = 0; pv.ultCd = 0; pv.runGold = 0; pv.floor = 0;
    pv.shield = false; pv.runTimer = 0; pv.isBossRoom = false; pv.roomTimesLen = 0;
    musicManager.init();
    musicManager.setMode('explore');
  }, [particleMult, musicManager, perfMode]);

  const returnToLobby = useCallback(() => {
    const state = stateRef.current;
    if (state) {
      savedGoldRef.current += state.goldCollected;
      setGold(savedGoldRef.current);
      updateAchievements(state);
      recordMeta(state);
      saveData();
    }
    stateRef.current = null;
    const net = netRef.current;
    netRef.current = null;
    if (net) { net.session.leave(); setIsCoop(false); setIsCoopClient(false); }
    setPhase('lobby');
    setRunGold(0);
    setRewardChoices([]);
    musicManager.stop();
  }, [saveData, updateAchievements, recordMeta, musicManager]);

  /** Starts an online co-op run for host or client from the lobby start payload. */
  const startCoop = useCallback((session: NetSession, payload: StartPayload) => {
    const me = payload.players.find(p => p.id === session.myId);
    if (!me) return;
    const n = payload.players.length;
    startRun(payload.difficulty, me.characterId, n);
    const state = stateRef.current!;
    const host = payload.players.find(p => p.id === payload.hostId);
    state.hostName = host?.name;
    const role = session.isHost ? 'host' : 'client';
    netRef.current = { session, role, lastSnap: 0, lastInput: 0, myName: me.name };
    setIsCoop(true);
    setIsCoopClient(role === 'client');
    if (role === 'host') {
      state.allies = payload.players.filter(p => p.id !== session.myId).map((p, i) => createAlly(p.id, p.name, p.characterId, i));
      session.onInput = (id, input) => {
        const ally = stateRef.current?.allies.find(a => a.id === id);
        if (ally) ally.input = input;
      };
      session.onPlayerLeft = (id) => {
        const st = stateRef.current;
        if (!st) return;
        const leaver = st.allies.find(a => a.id === id);
        st.allies = st.allies.filter(a => a.id !== id);
        if (leaver) toast(`${leaver.name} saiu da partida.`);
      };
    } else {
      state.localAllyId = session.myId;
      session.onSnapshot = (snap) => {
        const st = stateRef.current;
        if (st) applySnapshot(st, snap as Snapshot);
      };
      session.onHostLeft = () => {
        toast.error('O anfitrião saiu. A partida terminou.');
        const st = stateRef.current;
        if (st && st.phase !== 'gameover' && st.phase !== 'victory' && st.phase !== 'secret_victory') st.phase = 'gameover';
      };
    }
  }, [startRun]);

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

  const hardReset = useCallback(() => {
    localStorage.removeItem('cafe_chaos_save');
    localStorage.removeItem('cafe_chaos_achievements');
    localStorage.removeItem('cafe_chaos_meta');
    localStorage.removeItem('cafe_chaos_lore');
    savedGoldRef.current = 0;
    upgradesRef.current = { maxHpBonus: 0, damageBonus: 0, speedBonus: 0, dashCdrBonus: 0 };
    setGold(0);
    stateRef.current = null;
    setPhase('lobby');
  }, []);

  // Game loop with fixed timestep
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    inputManager.attach(canvas, CANVAS_WIDTH, CANVAS_HEIGHT);

    let lastPhase = '';
    let wasBossRoom = false;
    let accumulator = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(now - lastTime, 100); // cap delta to 100ms to prevent spiral
      lastTime = now;

      const state = stateRef.current;
      const net = netRef.current;

      // ---- Online client: send inputs, render host snapshots ----
      if (state && net?.role === 'client') {
        const me = state.allies.find(a => a.id === net.session.myId);
        const input = inputManager.getInput(me?.pos ?? state.player.pos);
        if (state.phase === 'playing' && now - net.lastInput > 1000 / COOP_CONFIG.inputHz) {
          net.session.sendInput({ mx: input.moveX, my: input.moveY, ax: input.aimX, ay: input.aimY, shoot: input.shoot });
          net.lastInput = now;
        }
        if (state.phase === 'playing') tickClient(state);
        if (state.phase === 'playing' || state.phase === 'reward' || state.phase === 'reward_room') render(ctx, state);
        const pv = prevValsRef.current;
        if (me) {
          if (me.hp !== pv.hp) { setHp(me.hp); pv.hp = me.hp; }
          if (me.maxHp !== pv.maxHp) { setMaxHp(me.maxHp); pv.maxHp = me.maxHp; }
        }
        if (state.floor !== pv.floor) { setFloor(state.floor); pv.floor = state.floor; }
        if (Math.floor(state.runTimer / 60) !== Math.floor(pv.runTimer / 60)) { setRunTimer(state.runTimer); pv.runTimer = state.runTimer; }
      }

      if (state && net?.role !== 'client' && (state.phase === 'playing' || ((state as any)._quickRestart))) {
        // Sync input once per frame (not per physics step)
        const input = inputManager.getInput(state.player.pos);
        state.keys.clear();
        if (input.moveX < -0.3) state.keys.add('a');
        if (input.moveX > 0.3) state.keys.add('d');
        if (input.moveY < -0.3) state.keys.add('w');
        if (input.moveY > 0.3) state.keys.add('s');
        if (input.dash) state.keys.add(' ');
        if (input.ultimate) state.keys.add('q');
        if (inputManager.keys.has('r') && !net) state.keys.add('r');
        if (state.hostDowned) { state.keys.clear(); input.shoot = false; }
        state.mousePos.x = input.aimX;
        state.mousePos.y = input.aimY;
        state.mouseDown = input.shoot;

        if ((state as any)._quickRestart) {
          (state as any)._quickRestart = false;
          startRun(state.difficulty as any, state.characterId as any);
          animFrameRef.current = requestAnimationFrame(loop);
          return;
        }

        // Fixed timestep physics updates
        accumulator += dt;
        let steps = 0;
        while (accumulator >= FIXED_DT && steps < MAX_STEPS_PER_FRAME) {
          update(state);
          accumulator -= FIXED_DT;
          steps++;
        }
        // Discard excess accumulator to prevent spiral
        if (steps >= MAX_STEPS_PER_FRAME) {
          accumulator = 0;
        }

        // Render once per frame
        render(ctx, state);

        if (net?.role === 'host' && now - net.lastSnap > 1000 / COOP_CONFIG.snapshotHz) {
          net.session.sendSnapshot(makeSnapshot(state, net.myName));
          net.lastSnap = now;
        }

        // Only update React state when values actually change
        const pv = prevValsRef.current;
        if (state.player.hp !== pv.hp) { setHp(state.player.hp); pv.hp = state.player.hp; }
        if (state.player.maxHp !== pv.maxHp) { setMaxHp(state.player.maxHp); pv.maxHp = state.player.maxHp; }
        if (state.player.dashCooldown !== pv.dashCd) { setDashCd(state.player.dashCooldown); pv.dashCd = state.player.dashCooldown; }
        if (state.player.ultimateCooldown !== pv.ultCd) { setUltCd(state.player.ultimateCooldown); pv.ultCd = state.player.ultimateCooldown; }
        if (state.goldCollected !== pv.runGold) { setRunGold(state.goldCollected); pv.runGold = state.goldCollected; }
        if (state.floor !== pv.floor) { setFloor(state.floor); pv.floor = state.floor; }
        if (state.player.shield !== pv.shield) { setPlayerShield(state.player.shield); pv.shield = state.player.shield; }
        // Only update timer once per second (every 60 frames)
        if (Math.floor(state.runTimer / 60) !== Math.floor(pv.runTimer / 60)) { setRunTimer(state.runTimer); pv.runTimer = state.runTimer; }
        if (state.isBossRoom !== pv.isBossRoom) { setIsBossRoom(state.isBossRoom); pv.isBossRoom = state.isBossRoom; }
        // Only update roomTimes when a new entry is added
        if (state.roomTimes.length !== pv.roomTimesLen) {
          setRoomTimes(state.roomTimes.slice());
          pv.roomTimesLen = state.roomTimes.length;
        }

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

      if (state && (state.phase === 'reward' || state.phase === 'reward_room')) {
        render(ctx, state);
      }

      if (state && state.phase !== lastPhase) {
        lastPhase = state.phase;
        if (net?.role === 'host') { net.session.sendSnapshot(makeSnapshot(state, net.myName)); net.lastSnap = now; }
        setPhase(state.phase);
        if (state.phase === 'reward' || state.phase === 'reward_room') {
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
            savedGoldRef.current += 50;
          }
          setGold(savedGoldRef.current);
          updateAchievements(state);
          recordMeta(state);

          if (state.phase === 'victory' || state.phase === 'secret_victory') {
            if (state.floor >= 2 && state.runStats.floorDamageTaken === 0) {
              unlockCharacter('unlock_french_press');
            }
            if (state.difficulty === 'hard' && state.runTimer < 18000) {
              unlockCharacter('unlock_grao_torrado');
            }
            if (state.runStats.bossesDefeated >= 3 && state.runStats.dashesUsed === 0) {
              unlockCharacter('unlock_mocha');
            }
          }

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
  }, [canvasRef, saveData, inputManager, musicManager, updateAchievements, recordMeta, perfMode]);

  return {
    phase, gold, hp, maxHp, dashCd, ultCd, runGold, floor, rewardChoices, playerShield,
    runTimer, roomTimes, inputManager, isBossRoom,
    startRun, startCoop, isCoop, isCoopClient, returnToLobby, chooseBuff, toggleMusic,
    hardReset,
    perfMode, setPerfMode, optimizeGame,
    upgrades: upgradesRef.current,
    unlockedAchievement, clearAchievementNotification: () => setUnlockedAchievement(null),
    musicMuted: musicManager.isMuted(),
  };
}
