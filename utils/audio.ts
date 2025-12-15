import { BPM } from '../constants';

class AudioManager {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private nextNoteTime: number = 0;
  private timerID: number | null = null;
  private beatCount: number = 0;
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // s

  constructor() {
    // Lazy init
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public start() {
    this.resume();
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.beatCount = 0;
    // Start slightly in future to avoid glitches
    this.nextNoteTime = this.ctx!.currentTime + 0.1;
    this.scheduler();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerID !== null) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  private scheduler() {
    if (!this.ctx) return;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.beatCount, this.nextNoteTime);
      this.nextNote();
    }

    if (this.isPlaying) {
      this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    }
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / BPM;
    this.nextNoteTime += secondsPerBeat;
    this.beatCount++;
  }

  private scheduleNote(beatNumber: number, time: number) {
    if (!this.ctx) return;

    // Metronome pattern: Kick on 1 & 3, Snare/Hat on 2 & 4
    // 0 = 1st beat
    const beatIndex = beatNumber % 4;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (beatIndex === 0 || beatIndex === 2) {
      // KICK
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      gain.gain.setValueAtTime(0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    } else {
      // SNARE / HAT style
      osc.type = 'triangle'; // rougher sound
      osc.frequency.setValueAtTime(400, time); 
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    }

    osc.start(time);
    osc.stop(time + 0.5);
  }
}

export const audioManager = new AudioManager();