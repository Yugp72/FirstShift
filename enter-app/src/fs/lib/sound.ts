/** A soft service-bell "ding", synthesized so there's no audio file to license. */
let ctx: AudioContext | null = null;

export function bell(): void {
  try {
    ctx = ctx || new AudioContext();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    master.connect(ctx.destination);
    for (const [f, g] of [[1318, 1], [2637, 0.35], [3951, 0.12]] as const) {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      og.gain.value = g;
      o.connect(og).connect(master);
      o.start(now);
      o.stop(now + 1.7);
    }
  } catch {
    /* audio unavailable */
  }
}
