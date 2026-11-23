let sharedCtx: AudioContext | null = null;

export function playTesseraChime(freqHz: number, enabled: boolean): void {
  if (!enabled) return;
  try {
    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    if (!sharedCtx) {
      sharedCtx = new AudioCtor();
    }
    if (sharedCtx.state === 'suspended') {
      void sharedCtx.resume();
    }

    const now = sharedCtx.currentTime;
    const osc = sharedCtx.createOscillator();
    const overtone = sharedCtx.createOscillator();
    const gain = sharedCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqHz, now);

    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(freqHz * 2, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    overtone.connect(gain);
    gain.connect(sharedCtx.destination);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 0.3);
    overtone.stop(now + 0.3);
  } catch {
    // Ignore audio context blocks silently
  }
}
