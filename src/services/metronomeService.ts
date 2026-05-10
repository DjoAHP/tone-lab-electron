import type { SoundType, SubdivisionType, BeatConfig, PolyTrack, MetronomeServiceState } from "../types";
import { SUBDIVISIONS, createAudioContext, playSound } from "../constants/audio";

// ── Singleton Métroome Service ───────────────────────────
class MetronomeService {
  private static instance: MetronomeService;

  // Audio state (non-serializable, stays in service)
  private audioCtx: AudioContext | null = null;
  private schedulerTimer: ReturnType<typeof setTimeout> | null = null;

  // Runtime state
  private _isPlaying = false;
  private _currentBeat = -1;
  private _currentSub = -1;
  private nextNoteTime = 0;
  private currentBeatCounter = 0;
  private currentSubCounter = 0;

  // Configuration state
  private _bpm = 120;
  private _numerator = 4;
  private _denominator = 4;
  private _subdivision: SubdivisionType = "none";
  private _beats: BeatConfig[] = Array(4).fill(null).map((_, i) => ({ accent: i === 0 ? 2 : 1 } as BeatConfig));
  private _sound: SoundType = "click";
  private _masterVolume = 0.8;
  private _accentVolume = 1.0;
  private _weakVolume = 0.65;
  private _polyTracks: PolyTrack[] = [];

  // Listeners
  private listeners = new Set<(state: MetronomeServiceState) => void>();

  private constructor() {}

  static getInstance(): MetronomeService {
    if (!MetronomeService.instance) {
      MetronomeService.instance = new MetronomeService();
    }
    return MetronomeService.instance;
  }

  getState(): MetronomeServiceState {
    return {
      isPlaying: this._isPlaying,
      currentBeat: this._currentBeat,
      currentSub: this._currentSub,
      bpm: this._bpm,
      numerator: this._numerator,
      denominator: this._denominator,
      subdivision: this._subdivision,
      beats: this._beats,
      sound: this._sound,
      masterVolume: this._masterVolume,
      accentVolume: this._accentVolume,
      weakVolume: this._weakVolume,
      polyTracks: this._polyTracks,
    };
  }

  onStateChange(listener: (state: MetronomeServiceState) => void) {
    this.listeners.add(listener);
    listener(this.getState());
  }

  offStateChange(listener: (state: MetronomeServiceState) => void) {
    this.listeners.delete(listener);
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }

  start() {
    if (this._isPlaying) return;

    if (!this.audioCtx) this.audioCtx = createAudioContext();
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();

    this.currentBeatCounter = 0;
    this.currentSubCounter = 0;
    this.nextNoteTime = this.audioCtx!.currentTime + 0.05;
    this._currentBeat = 0;
    this._currentSub = 0;
    this._isPlaying = true;

    this.scheduler();
    this.notifyListeners();
  }

  stop() {
    if (!this._isPlaying) return;

    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    this._isPlaying = false;
    this._currentBeat = -1;
    this._currentSub = -1;
    this.currentBeatCounter = 0;
    this.currentSubCounter = 0;
    this.notifyListeners();
  }

  toggle() {
    if (this._isPlaying) this.stop();
    else this.start();
  }

  setBpm(bpm: number) {
    this._bpm = Math.min(Math.max(bpm, 20), 300);
    this.notifyListeners();
  }

  setNumerator(n: number) {
    this._numerator = n;
    const newBeats = Array.from({ length: n }, (_, i) =>
      i < this._beats.length ? this._beats[i] : { accent: 1 as 0 | 1 | 2 }
    );
    if (newBeats[0]?.accent !== 2) newBeats[0] = { accent: 2 };
    this._beats = newBeats;
    this.notifyListeners();
  }

  setDenominator(d: number) {
    this._denominator = d;
    this.notifyListeners();
  }

  setSubdivision(sub: SubdivisionType) {
    this._subdivision = sub;
    this.notifyListeners();
  }

  setSound(sound: SoundType) {
    this._sound = sound;
    this.notifyListeners();
  }

  setMasterVolume(v: number) {
    this._masterVolume = v;
    this.notifyListeners();
  }

  setAccentVolume(v: number) {
    this._accentVolume = v;
    this.notifyListeners();
  }

  setWeakVolume(v: number) {
    this._weakVolume = v;
    this.notifyListeners();
  }

  setBeats(beats: BeatConfig[]) {
    this._beats = beats;
    this.notifyListeners();
  }

  setPolyTracks(tracks: PolyTrack[]) {
    this._polyTracks = tracks;
    this.notifyListeners();
  }

  private scheduler() {
    if (!this.audioCtx || !this._isPlaying) return;

    const subRatio = SUBDIVISIONS.find(s => s.id === this._subdivision)!.ratio;
    const secPerBeat = 60.0 / this._bpm;
    const secPerSub = secPerBeat / subRatio;
    const scheduleAhead = 0.1;

    while (this.nextNoteTime < this.audioCtx.currentTime + scheduleAhead) {
      this.scheduleNote();
      this.nextNoteTime += secPerSub;
      this.currentSubCounter++;

      if (this.currentSubCounter >= subRatio) {
        this.currentSubCounter = 0;
        this.currentBeatCounter = (this.currentBeatCounter + 1) % this._numerator;
      }
    }

    this.schedulerTimer = setTimeout(() => this.scheduler(), 25);
  }

  private scheduleNote() {
    const ctx = this.audioCtx!;
    const subRatio = SUBDIVISIONS.find(s => s.id === this._subdivision)!.ratio;
    const isMainBeat = this.currentSubCounter === 0;
    const isSub = !isMainBeat;

    if (isMainBeat) {
      const beatCfg = this._beats[this.currentBeatCounter % this._numerator];
      const isAccent = beatCfg?.accent === 2;
      const isMuted = beatCfg?.accent === 0;

      if (!isMuted) {
        const vol = isAccent
          ? this._accentVolume * this._masterVolume
          : this._weakVolume * this._masterVolume;
        playSound(ctx, this._sound, isAccent, false, vol, this.nextNoteTime);
      }
    } else {
      playSound(ctx, this._sound, false, true, this._masterVolume * 0.3, this.nextNoteTime);
    }

    // Update visual state
    if (isMainBeat) {
      this._currentBeat = this.currentBeatCounter % this._numerator;
    }
    this._currentSub = this.currentSubCounter;
    this.notifyListeners();

    // Poly tracks
    if (isMainBeat) {
      this._polyTracks.forEach((track) => {
        if (!track.active) return;
        const tBeat = this._beats.length > 0 ? this.currentBeatCounter % track.numerator : 0;
        const tCfg = track.beats[tBeat % track.beats.length];
        const isAccent = tCfg?.accent === 2;
        const isMuted = tCfg?.accent === 0;
        if (!isMuted) {
          playSound(ctx, track.sound, isAccent, false, track.volume * this._masterVolume, this.nextNoteTime);
        }
      });
    }
  }

  destroy() {
    this.stop();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.listeners.clear();
  }
}

export default MetronomeService.getInstance();
