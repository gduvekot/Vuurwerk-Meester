import { BPM } from '../constants';

class AudioManager {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private nextNoteTime: number = 0;
  private timerID: number | null = null;
  private beatCount: number = 0;
  private lookahead: number = 25.0; 
  private scheduleAheadTime: number = 0.1; 
  private bpm: number = 128;

  public setBpm(newBpm: number) {
    this.bpm = newBpm;
    console.log("BPM gezet op:", this.bpm);
  }

  constructor() {
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public async loadTrack(url: string) {
    this.init();
    if (!this.ctx) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
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

  public pause() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
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
    this.sourceNode = this.ctx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.ctx.destination);
    this.sourceNode.start(0);
    this.nextNoteTime = this.ctx.currentTime;
    this.scheduler();
  }

  public stop() {
    this.isPlaying = false;
    
    if (this.sourceNode) {
        try {
            this.sourceNode.stop();
        } catch(e) {}
        this.sourceNode = null;
    }
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
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat;
    this.beatCount++;
  }

  private scheduleNote(beatNumber: number, time: number) {

  }
}

export const audioManager = new AudioManager();