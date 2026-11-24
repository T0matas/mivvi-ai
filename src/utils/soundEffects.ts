// Mivvi's sounds: one small, soft palette synthesised with Web Audio (no files).
// Rounded sine/triangle tones with a quick attack and a gentle tail, a touch
// of "glass" overtone, never loud or buzzy, so they sit with the quiet dark UI.

type Wave = OscillatorType

interface Tone {
  freq: number
  /** Seconds after "now". */
  at?: number
  dur?: number
  gain?: number
  wave?: Wave
  /** Glide to this frequency over the tone. */
  to?: number
}

class SoundManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private enabled = true
  private lastClick = 0

  constructor() {
    if (typeof window !== 'undefined') this.enabled = localStorage.getItem('mivvi_soundEnabled') !== 'false'
  }

  init() {
    if (typeof window === 'undefined') return
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    if (!this.ctx) {
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.55
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { /* needs a gesture */ })
  }

  toggleSound() {
    this.enabled = !this.enabled
    localStorage.setItem('mivvi_soundEnabled', String(this.enabled))
    return this.enabled
  }

  isEnabled() {
    return this.enabled
  }

  private play(tones: Tone[]) {
    if (!this.enabled) return
    this.init()
    const ctx = this.ctx
    if (!ctx || !this.master) return
    const now = ctx.currentTime + 0.005
    for (const t of tones) {
      const start = now + (t.at || 0)
      const dur = t.dur ?? 0.18
      const peak = t.gain ?? 0.12
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = t.wave || 'sine'
      osc.frequency.setValueAtTime(t.freq, start)
      if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, start + dur)
      g.gain.setValueAtTime(0.0001, start)
      g.gain.exponentialRampToValueAtTime(peak, start + 0.008)
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
      osc.connect(g)
      g.connect(this.master)
      osc.start(start)
      osc.stop(start + dur + 0.02)
    }
  }

  /** A soft note with a quiet octave overtone: the "glass" voice of the app. */
  private bell(freq: number, at = 0, dur = 0.32, gain = 0.1): Tone[] {
    return [
      { freq, at, dur, gain, wave: 'sine' },
      { freq: freq * 2, at, dur: dur * 0.6, gain: gain * 0.25, wave: 'sine' },
    ]
  }

  /** Tiny tap for buttons and options. */
  playClick() {
    const t = performance.now()
    if (t - this.lastClick < 40) return
    this.lastClick = t
    this.play([{ freq: 880, to: 620, dur: 0.05, gain: 0.07, wave: 'triangle' }])
  }

  playTap() { this.playClick() }
  playHover() { /* silent on purpose: hover sounds get tiring */ }

  /** Picking an option: a slightly brighter tap. */
  playSelect() {
    this.play([{ freq: 990, to: 760, dur: 0.06, gain: 0.07, wave: 'triangle' }, ...this.bell(1320, 0.015, 0.12, 0.03)])
  }

  playToggle() { this.playSelect() }

  /** Going back or closing. */
  playBack() {
    this.play([{ freq: 660, to: 440, dur: 0.08, gain: 0.07, wave: 'triangle' }])
  }

  /** Right answer: two rising glass notes (a major third). */
  playSuccess() {
    this.play([...this.bell(784, 0, 0.26, 0.09), ...this.bell(988, 0.07, 0.36, 0.09)])
  }

  /** Wrong answer: a low, rounded "mm-mm", never harsh. */
  playError() {
    this.play([
      { freq: 311, to: 294, dur: 0.14, gain: 0.09, wave: 'triangle' },
      { freq: 262, to: 247, at: 0.11, dur: 0.2, gain: 0.08, wave: 'triangle' },
    ])
  }

  /** Starting a lesson or the app. */
  playStart() {
    this.play([...this.bell(523, 0, 0.22, 0.07), ...this.bell(659, 0.06, 0.22, 0.07), ...this.bell(784, 0.12, 0.34, 0.08)])
  }

  /** Lesson finished well: a short arpeggio that lands on the octave. */
  playLevelUp() {
    this.play([
      ...this.bell(523, 0, 0.3, 0.07),
      ...this.bell(659, 0.08, 0.3, 0.07),
      ...this.bell(784, 0.16, 0.3, 0.08),
      ...this.bell(1047, 0.26, 0.6, 0.09),
    ])
  }

  /** Page turn in the lesson explanation. */
  playPage() {
    this.play([{ freq: 520, to: 700, dur: 0.07, gain: 0.05, wave: 'sine' }])
  }

  /** A chat message arrives. */
  playMessage() {
    this.play([...this.bell(1175, 0, 0.16, 0.06), ...this.bell(1568, 0.06, 0.24, 0.05)])
  }

  /** You sent a message. */
  playSend() {
    this.play([{ freq: 600, to: 1100, dur: 0.09, gain: 0.06, wave: 'sine' }])
  }

  /** A friend request or other notification. */
  playNotify() {
    this.play([...this.bell(880, 0, 0.2, 0.07), ...this.bell(1319, 0.09, 0.3, 0.07)])
  }

  /** One ring of an incoming call (repeat it while ringing). */
  playRing() {
    this.play([...this.bell(880, 0, 0.35, 0.08), ...this.bell(1109, 0.12, 0.35, 0.08), ...this.bell(880, 0.6, 0.35, 0.08), ...this.bell(1109, 0.72, 0.4, 0.08)])
  }

  /** Waiting for the other person to pick up. */
  playDialTone() {
    this.play([{ freq: 440, dur: 0.9, gain: 0.04 }, { freq: 480, dur: 0.9, gain: 0.04 }])
  }

  /** Call ended. */
  playHangup() {
    this.play([...this.bell(659, 0, 0.18, 0.07), ...this.bell(440, 0.12, 0.3, 0.07)])
  }

  /** Kept for older callers. */
  async playSound(frequency: number, duration: number, type: Wave = 'sine') {
    this.play([{ freq: frequency, dur: duration, gain: 0.06, wave: type }])
  }
}

export const soundManager = new SoundManager()
