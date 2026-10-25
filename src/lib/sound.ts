// Bell-like chime: sine fundamental + quiet overtones for richness
function playChime(ctx: AudioContext, freq: number, startTime: number, volume: number, duration: number) {
  const harmonics = [1, 2, 3, 5.2]
  const gains = [1, 0.4, 0.2, 0.08]
  for (let h = 0; h < harmonics.length; h++) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = freq * harmonics[h]
    gain.gain.setValueAtTime(volume * gains[h], startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(startTime)
    osc.stop(startTime + duration)
  }
}

export function playWarning(ctx: AudioContext) {
  const now = ctx.currentTime
  // Two bright doorbell-style chimes (E5 → C5), repeated twice
  const pattern = [659, 523, 659, 523]
  for (let i = 0; i < pattern.length; i++) {
    playChime(ctx, pattern[i], now + i * 0.35, 0.9, 0.6)
  }
}

export function playEnd(ctx: AudioContext) {
  const now = ctx.currentTime
  // Urgent ascending melody: C5 → E5 → G5, repeated twice, then high C6 sustain
  const pattern = [523, 659, 784, 523, 659, 784]
  for (let i = 0; i < pattern.length; i++) {
    playChime(ctx, pattern[i], now + i * 0.2, 1.0, 0.4)
  }
  // Final sustained high chime
  playChime(ctx, 1047, now + 1.3, 1.0, 1.5)
}

let sharedContext: AudioContext | null = null

// Must first be called from a tap: browsers only allow sound after a user gesture
export function getAudioContext(): AudioContext | null {
  if (typeof AudioContext === "undefined") return null
  if (!sharedContext) sharedContext = new AudioContext()
  if (sharedContext.state === "suspended") void sharedContext.resume()
  return sharedContext
}
