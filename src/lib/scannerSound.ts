let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const Ctx =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(
  type: OscillatorType,
  freqStart: number,
  freqEnd: number,
  duration: number,
  gain: number,
  startDelay = 0,
): void {
  const ctx = getCtx();
  if (!ctx) return;

  const t = ctx.currentTime + startDelay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  osc.connect(g);
  g.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration * 0.8);

  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.start(t);
  osc.stop(t + duration);
}

export function playScanSuccess(): void {
  tone('sine', 880, 1320, 0.22, 0.28);
  tone('sine', 1100, 1600, 0.18, 0.18, 0.14);
  if ('vibrate' in navigator) navigator.vibrate([40, 60, 40]);
}

export function playScanFail(): void {
  tone('sawtooth', 380, 170, 0.28, 0.22);
  if ('vibrate' in navigator) navigator.vibrate([200]);
}
