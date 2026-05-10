import type { SoundType, SubdivisionType } from "../types";

export const BPM_MIN = 20;
export const BPM_MAX = 300;

export const SUBDIVISIONS: { id: SubdivisionType; label: string; ratio: number }[] = [
  { id: "none", label: "♩", ratio: 1 },
  { id: "8th", label: "♩♪", ratio: 2 },
  { id: "triplet", label: "3", ratio: 3 },
  { id: "16th", label: "♬", ratio: 4 },
];

export function createAudioContext(): AudioContext {
  return new (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  )();
}

export const TIME_SIGS = [
  { num: 2, den: 4 },
  { num: 3, den: 4 },
  { num: 4, den: 4 },
  { num: 5, den: 4 },
  { num: 6, den: 4 },
  { num: 7, den: 4 },
  { num: 6, den: 8 },
  { num: 7, den: 8 },
  { num: 9, den: 8 },
  { num: 12, den: 8 },
];

export const SOUND_LABELS: Record<SoundType, string> = {
  click: "Clic",
  woodblock: "Wood",
  beep: "Bip",
  sine: "Sine",
  rimshot: "Rim",
};

export function playSound(
  ctx: AudioContext,
  type: SoundType,
  isAccent: boolean,
  isSub: boolean,
  volume: number,
  time: number,
): void {
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  const vol = isSub ? volume * 0.35 : isAccent ? volume * 1.0 : volume * 0.65;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.002);

  if (type === "click" || type === "rimshot") {
    const bufSize = ctx.sampleRate * 0.04;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = isAccent ? "bandpass" : "highpass";
    filter.frequency.value =
      type === "rimshot" ? (isAccent ? 900 : 700) : isAccent ? 1800 : 2400;
    filter.Q.value = isAccent ? 3 : 1.5;
    src.connect(filter);
    filter.connect(gain);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      time + (isAccent ? 0.06 : 0.04),
    );
    src.start(time);
    src.stop(time + 0.08);
  } else if (type === "woodblock") {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(isAccent ? 800 : 600, time);
    osc.frequency.exponentialRampToValueAtTime(
      isAccent ? 400 : 300,
      time + 0.04,
    );
    osc.connect(gain);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    osc.start(time);
    osc.stop(time + 0.08);
  } else if (type === "beep") {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = isAccent ? 1200 : isSub ? 600 : 900;
    osc.connect(gain);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      time + (isAccent ? 0.06 : 0.04),
    );
    osc.start(time);
    osc.stop(time + 0.08);
  } else if (type === "sine") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = isAccent ? 880 : isSub ? 440 : 660;
    osc.connect(gain);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      time + (isAccent ? 0.08 : 0.05),
    );
    osc.start(time);
    osc.stop(time + 0.1);
  }
}
