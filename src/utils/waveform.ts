// Generates or normalizes deterministic pseudo-random SoundCloud-style waveform data for tracks
export function getTrackWaveform(trackId: string, barsCount: number = 60): number[] {
  let hash = 0;
  for (let i = 0; i < trackId.length; i++) {
    hash = (hash << 5) - hash + trackId.charCodeAt(i);
    hash |= 0;
  }

  const bars: number[] = [];
  for (let i = 0; i < barsCount; i++) {
    // Generate pseudo-random heights with musical contours (chorus peaks, intro/outro valleys)
    const seed = Math.sin(hash + i * 0.35) * 10000;
    const raw = seed - Math.floor(seed);
    const progress = i / barsCount;
    // Bell curve / structure envelope
    const envelope = Math.sin(progress * Math.PI) * 0.4 + 0.6;
    const height = Math.max(12, Math.min(100, Math.round((raw * 0.7 + 0.3) * envelope * 100)));
    bars.push(height);
  }
  return bars;
}
