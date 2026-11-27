// Mivvi's voice for listening exercises: Piper, an open-source (MIT) speech
// engine that runs in the student's browser (WebAssembly). Each language's
// voice is downloaded once (from Hugging Face) and kept in the browser's
// storage, so after the first time it plays straight away, even offline.
// Anything that fails falls back to the browser's own voice.

/** One natural voice per language the app teaches in. */
const VOICES: Record<string, string> = {
  'pt-PT': 'pt_PT-tugão-medium',
  'pt-BR': 'pt_BR-faber-medium',
  en: 'en_GB-alba-medium',
  es: 'es_ES-davefx-medium',
  fr: 'fr_FR-siwis-medium',
  de: 'de_DE-thorsten-medium',
  it: 'it_IT-riccardo-x_low',
}

/** Foreign-language subjects are heard in their own language. */
const SUBJECT_LANGUAGE: Record<string, string> = { ingles: 'en', frances: 'fr', espanhol: 'es', alemao: 'de', italiano: 'it' }

export const voiceLanguage = (subject: string, uiLanguage: string) => SUBJECT_LANGUAGE[subject] || uiLanguage

const voiceFor = (lang: string) => VOICES[lang] || VOICES[lang.split('-')[0]] || VOICES['pt-PT']

// Loaded only when a voice is needed (keeps it out of the app's first load).
const engine = () => import('@mintplex-labs/piper-tts-web')

const supported = () => typeof window !== 'undefined' && typeof WebAssembly === 'object' && !!navigator.storage?.getDirectory

/** 0–1 while a voice downloads (for "A preparar a voz…"). */
export type VoiceProgress = (fraction: number) => void

const ready = new Map<string, Promise<void>>()

/** Downloads a language's voice in the background, if it isn't stored yet. */
export function preloadVoice(lang: string, onProgress?: VoiceProgress): Promise<void> {
  if (!supported()) return Promise.resolve()
  const id = voiceFor(lang)
  if (!ready.has(id)) {
    ready.set(id, (async () => {
      const tts = await engine()
      if ((await tts.stored()).includes(id)) return
      await tts.download(id, (p) => onProgress?.(p.total ? p.loaded / p.total : 0))
    })().catch((e) => { ready.delete(id); throw e }))
  }
  return ready.get(id)!
}

// Spoken sentences, so "Ouvir" again is instant.
const clips = new Map<string, Promise<string>>()

async function clip(text: string, lang: string, onProgress?: VoiceProgress): Promise<string> {
  const id = voiceFor(lang)
  const key = `${id}\n${text}`
  if (!clips.has(key)) {
    clips.set(key, (async () => {
      await preloadVoice(lang, onProgress)
      const tts = await engine()
      const wav = await tts.predict({ text, voiceId: id })
      return URL.createObjectURL(wav)
    })().catch((e) => { clips.delete(key); throw e }))
  }
  return clips.get(key)!
}

let playing: HTMLAudioElement | null = null

export function stopPiper() {
  playing?.pause()
  playing = null
}

/**
 * Says `text` with Piper. Resolves when it finishes; rejects when Piper isn't
 * available (the caller then uses the browser's voice).
 */
export async function speakPiper(text: string, lang: string, opts: { rate?: number; onProgress?: VoiceProgress; onStart?: () => void } = {}): Promise<void> {
  if (!supported()) throw new Error('Piper not supported here')
  const url = await clip(text, lang, opts.onProgress)
  stopPiper()
  const audio = new Audio(url)
  audio.playbackRate = opts.rate ?? 1
  playing = audio
  await new Promise<void>((resolve, reject) => {
    audio.onended = () => resolve()
    audio.onerror = () => reject(new Error('could not play'))
    audio.play().then(() => opts.onStart?.(), reject)
  })
}
