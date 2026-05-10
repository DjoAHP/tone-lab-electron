import type { ChronoServiceState } from "../types";

// ── Singleton Chrono Service ───────────────────────────
class ChronoService {
  private static instance: ChronoService;

  // Runtime state (non-serializable stays here)
  private _isRunning = false;
  private startTime = 0;
  private savedMs = 0;
  private rafId = 0;

  // Listeners
  private listeners = new Set<(state: ChronoServiceState) => void>();

  private constructor() {}

  static getInstance(): ChronoService {
    if (!ChronoService.instance) {
      ChronoService.instance = new ChronoService();
    }
    return ChronoService.instance;
  }

  getState(): ChronoServiceState {
    const elapsed = this._isRunning
      ? Date.now() - this.startTime + this.savedMs
      : this.savedMs;

    const totalSec = Math.floor(elapsed / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;

    return {
      isRunning: this._isRunning,
      elapsedMs: elapsed,
      display: { minutes, seconds },
    };
  }

  onUpdate(listener: (state: ChronoServiceState) => void) {
    this.listeners.add(listener);
    listener(this.getState());
  }

  offUpdate(listener: (state: ChronoServiceState) => void) {
    this.listeners.delete(listener);
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }

  start() {
    if (this._isRunning) return;
    this.startTime = Date.now();
    this._isRunning = true;
    this.tick();
    this.notifyListeners();
  }

  stop() {
    if (!this._isRunning) return;
    cancelAnimationFrame(this.rafId);
    this.savedMs = Date.now() - this.startTime + this.savedMs;
    this._isRunning = false;
    this.notifyListeners();
  }

  reset() {
    this.stop();
    this.savedMs = 0;
    this.startTime = 0;
    this.notifyListeners();
  }

  private tick() {
    this.notifyListeners();
    this.rafId = requestAnimationFrame(() => this.tick());
  }

  destroy() {
    this.stop();
    this.listeners.clear();
  }
}

export default ChronoService.getInstance();
