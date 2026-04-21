/**
 * Tiny Web Audio helpers for kid-friendly ear games (no external sound files).
 * Browsers may start AudioContext suspended until a user gesture — call
 * `resumeAudioContext()` from a click/tap handler before playing.
 */

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("Web Audio requires a browser");
  }
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Play a short sine tone with a quick attack/release to avoid clicks.
 */
export function playTone(freqHz: number, durationMs: number, volume: number): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freqHz;
  const start = ctx.currentTime;
  const dur = durationMs / 1000;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.02);
  gain.gain.linearRampToValueAtTime(volume, start + Math.max(0.03, dur - 0.04));
  gain.gain.linearRampToValueAtTime(0, start + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

export async function playToneSequence(
  parts: { freqHz: number; durationMs: number; volume: number }[],
  gapMs: number,
): Promise<void> {
  await resumeAudioContext();
  for (const p of parts) {
    playTone(p.freqHz, p.durationMs, p.volume);
    await delay(p.durationMs + gapMs);
  }
}
