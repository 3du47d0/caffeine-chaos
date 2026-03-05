/**
 * Procedural chiptune music system using Web Audio API
 */

type MusicMode = 'explore' | 'boss' | 'secret_boss' | 'none';

const NOTES: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25,
};

const EXPLORE_MELODY = ['E4','G4','A4','G4','E4','D4','C4','D4','E4','G4','A4','B4','A4','G4','E4','D4'];
const EXPLORE_BASS = ['C3','C3','G3','G3','A3','A3','E3','E3','F3','F3','C3','C3','G3','G3','C3','C3'];

const BOSS_MELODY = ['E4','E4','E5','E4','D4','C4','B3','C4','E4','G4','E4','C4','D4','E4','D4','C4'];
const BOSS_BASS = ['A3','A3','E3','E3','F3','F3','G3','G3','A3','A3','C4','C4','G3','G3','A3','A3'];

const SECRET_MELODY = ['B4','A4','G4','E4','D4','E4','G4','A4','B4','D5','E5','D5','B4','A4','G4','E4'];
const SECRET_BASS = ['E3','E3','G3','G3','A3','A3','B3','B3','E3','E3','D3','D3','G3','G3','E3','E3'];

export class MusicManager {
  private ctx: AudioContext | null = null;
  private mode: MusicMode = 'none';
  private intervalId: number | null = null;
  private noteIndex = 0;
  private gainNode: GainNode | null = null;
  private volume = 0.15;
  private muted = false;

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.ctx.destination);
    } catch {}
  }

  setMode(mode: MusicMode) {
    if (mode === this.mode) return;
    this.stop();
    this.mode = mode;
    if (mode !== 'none') this.start();
  }

  private start() {
    this.init();
    if (!this.ctx || !this.gainNode) return;

    this.noteIndex = 0;
    const bpm = this.mode === 'explore' ? 140 : this.mode === 'boss' ? 180 : 200;
    const interval = (60 / bpm) * 1000;

    const play = () => {
      if (!this.ctx || !this.gainNode || this.muted) return;

      let melody: string[], bass: string[];
      if (this.mode === 'boss') {
        melody = BOSS_MELODY; bass = BOSS_BASS;
      } else if (this.mode === 'secret_boss') {
        melody = SECRET_MELODY; bass = SECRET_BASS;
      } else {
        melody = EXPLORE_MELODY; bass = EXPLORE_BASS;
      }

      const idx = this.noteIndex % melody.length;
      this.playNote(NOTES[melody[idx]], 0.12, 'square', 0.08);
      this.playNote(NOTES[bass[idx]], 0.2, 'triangle', 0.06);

      // Drum pattern
      if (idx % 4 === 0) this.playDrum(0.06);
      if (idx % 2 === 1) this.playHiHat(0.03);

      this.noteIndex++;
    };

    this.intervalId = window.setInterval(play, interval);
    play();
  }

  private playNote(freq: number, duration: number, type: OscillatorType, vol: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(g);
    g.connect(this.gainNode);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  private playDrum(vol: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(g);
    g.connect(this.gainNode);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.1);
  }

  private playHiHat(vol: number) {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    src.buffer = buffer;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.gainNode);
    src.start(this.ctx.currentTime);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.mode = 'none';
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.gainNode) {
      this.gainNode.gain.value = this.muted ? 0 : this.volume;
    }
    return this.muted;
  }

  isMuted() { return this.muted; }

  destroy() {
    this.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}
