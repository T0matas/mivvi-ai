// Sistema de sons para feedback do usuário

class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('mivvi_soundEnabled') !== 'false'
    }
  }

  init() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      if (!this.audioContext) {
        this.audioContext = new AudioContext()
      }
    }
  }

  toggleSound() {
    this.enabled = !this.enabled
    localStorage.setItem('mivvi_soundEnabled', this.enabled.toString())
    return this.enabled
  }

  isEnabled() {
    return this.enabled
  }

  private async loadSound(frequency: number, duration: number, type: 'sine' | 'square' | 'sawtooth' = 'sine'): Promise<AudioBuffer> {
    if (!this.enabled) return null as any

    if (!this.audioContext) {
      this.init()
      if (!this.audioContext) return null as any
    }

    const sampleRate = this.audioContext.sampleRate
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate
      let value = 0

      if (type === 'sine') {
        value = Math.sin(2 * Math.PI * frequency * t)
      } else if (type === 'square') {
        value = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1
      } else if (type === 'sawtooth') {
        value = 2 * (t * frequency - Math.floor(t * frequency + 0.5))
      }

      // Envelope suave para evitar clicks
      const attack = Math.min(t / 0.05, 1) // Attack suave de 50ms
      const release = Math.min((duration - t) / 0.1, 1) // Release suave de 100ms
      const envelope = attack * release
      // Volume reduzido e mais suave (0.05 ao invés de 0.15)
      data[i] = value * envelope * 0.05
    }

    return buffer
  }

  async playSound(frequency: number, duration: number, type: 'sine' | 'square' | 'sawtooth' = 'sine') {
    if (!this.enabled) return

    if (!this.audioContext) {
      this.init()
      if (!this.audioContext) return
    }

    try {
      const buffer = await this.loadSound(frequency, duration, type)
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(this.audioContext.destination)
      source.start(0)
    } catch (error) {
      console.log('Sound playback not available')
    }
  }

  playClick() {
    if (!this.enabled) return

    if (!this.audioContext) {
      this.init()
      if (!this.audioContext) return
    }

    // "Soft Low Tap" - No high pitch
    const t = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, t)
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.05)

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.15, t + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)

    osc.start(t)
    osc.stop(t + 0.05)

    osc.connect(gain)
    gain.connect(this.audioContext.destination)
  }

  playSuccess() {
    if (!this.enabled) return

    // "Ding" - Pleasant Major Chord
    if (!this.audioContext) { this.init(); if (!this.audioContext) return; }
    const now = this.audioContext.currentTime

    // Play a tight chord (C, E, G)
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq

      // Stagger slightly for "strum" effect (very fast)
      const start = now + (i * 0.03)

      osc.start(start)
      osc.stop(start + 0.3)

      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.08, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3)

      osc.connect(gain)
      gain.connect(this.audioContext!.destination)
    })
  }

  playError() {
    if (!this.enabled) return

    // "Bonk" - Soft low thud
    if (!this.audioContext) { this.init(); if (!this.audioContext) return; }
    const t = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(120, t)
    osc.frequency.linearRampToValueAtTime(80, t + 0.15)

    osc.start(t)
    osc.stop(t + 0.15)

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.1, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)

    osc.connect(gain)
    gain.connect(this.audioContext.destination)
  }

  playHover() {
    if (!this.enabled) return
    // Very subtle low bubble/thud
    if (!this.audioContext) { this.init(); if (!this.audioContext) return; }

    const t = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(200, t)

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.03, t + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03)

    osc.connect(gain)
    gain.connect(this.audioContext.destination)
    osc.start(t)
    osc.stop(t + 0.03)
  }

  playLevelUp() {
    if (!this.enabled) return

    // Victory Fanfare - Short
    if (!this.audioContext) { this.init(); if (!this.audioContext) return; }
    const now = this.audioContext.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio

    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq

      const time = now + (i * 0.08)

      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(0.1, time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3)

      osc.connect(gain)
      gain.connect(this.audioContext!.destination)
      osc.start(time)
      osc.stop(time + 0.3)
    })
  }

  playTap() {
    this.playClick()
  }

  playBack() {
    if (!this.enabled) return
    if (!this.audioContext) { this.init(); if (!this.audioContext) return; }

    // "Retreat" - Low, descending slide (Soft)
    const t = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, t)
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.1)

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.1, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)

    osc.start(t)
    osc.stop(t + 0.1)

    osc.connect(gain)
    gain.connect(this.audioContext.destination)
  }

  playStart() {
    if (!this.enabled) return
    if (!this.audioContext) { this.init(); if (!this.audioContext) return; }

    // "Engage" - Rising swoosh (Soft)
    const t = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(200, t) // Low start
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.2) // Rise up

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(400, t)
    filter.frequency.linearRampToValueAtTime(2000, t + 0.2) // Opening filter

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.1, t + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.audioContext.destination)

    osc.start(t)
    osc.stop(t + 0.25)
  }

  playSelect() {
    if (!this.enabled) return
    if (!this.audioContext) { this.init(); if (!this.audioContext) return; }

    // "Select" - Clean double-tone (Soft)
    const t = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, t)
    osc.frequency.linearRampToValueAtTime(440, t + 0.03)
    osc.frequency.setValueAtTime(554, t + 0.03) // Major 3rd up

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.08, t + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)

    osc.start(t)
    osc.stop(t + 0.06)

    osc.connect(gain)
    gain.connect(this.audioContext.destination)
  }

  playToggle() {
    if (!this.enabled) return
    if (!this.audioContext) { this.init(); if (!this.audioContext) return; }

    // "Switch" - Woodblock-ish
    const t = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(350, t)

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.08, t + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)

    osc.start(t)
    osc.stop(t + 0.04)

    osc.connect(gain)
    gain.connect(this.audioContext.destination)
  }
}

export const soundManager = new SoundManager()

