import { BPM } from '../constants';

class AudioManager {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  
  // New: Variables for the MP3 file
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;

  // Timing variables (We keep these to sync the game visuals!)
  private nextNoteTime: number = 0;
  private timerID: number | null = null;
  private beatCount: number = 0;
  private lookahead: number = 25.0; 
  private scheduleAheadTime: number = 0.1; 

  constructor() {
    // Lazy init
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // --- NEW: Load the MP3 file ---
  public async loadTrack(url: string) {
    this.init();
    if (!this.ctx) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      // Decode the MP3 data so the browser can play it perfectly
      this.audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      console.log("Track loaded!");
    } catch (error) {
      console.error("Error loading track:", error);
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
    if (!this.audioBuffer || !this.ctx) {
        console.warn("No audio loaded! Call loadTrack() first.");
        return;
    }
    
    this.isPlaying = true;
    this.beatCount = 0;

    // 1. Play the actual Music (The MP3)
    this.sourceNode = this.ctx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.ctx.destination);
    this.sourceNode.start(0);

    // 2. Start the "Silent Metronome" 
    // This runs in the background so your game logic knows exactly 
    // which beat we are on (for scoring/fireworks).
    this.nextNoteTime = this.ctx.currentTime;
    this.scheduler();
  }

  public stop() {
    this.isPlaying = false;
    
    // Stop the music
    if (this.sourceNode) {
        try {
            this.sourceNode.stop();
        } catch(e) { /* ignore if already stopped */ }
        this.sourceNode = null;
    }

    // Stop the scheduler
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
    // --- CHANGED ---
    // We removed the Oscillator/Gain code here.
    // The music is handled by the MP3 now.
    
    // If you need to trigger visuals (like a flashing light on the beat),
    // you can emit an event here.
    // Example: document.dispatchEvent(new CustomEvent('beat', { detail: beatNumber }));
    
    // For now, it just counts silently.
  }
}

export const audioManager = new AudioManager();