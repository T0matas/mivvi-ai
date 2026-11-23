// Kodu, the Codevantum AI tutor. Every call goes through this app's server
// (/api/ai/chat), which holds the Groq key and the system prompts; the browser
// only sends the conversation, a small context and the mode.

export type KoduMode = 'tutor' | 'feedback' | 'exercises' | 'plan'

export interface KoduMessage {
  role: 'user' | 'assistant'
  content: string
  /** Photos (data URLs) the student attached to this turn. */
  images?: string[]
}

export const KODU_NAME = 'Mivvi'
export const KODU_MODEL_LABEL = 'Codevantum AI · gpt-oss'

const ENDPOINT = '/api/ai/chat'

export class KoduError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

interface KoduRequest {
  mode: KoduMode
  messages?: KoduMessage[]
  context?: Record<string, unknown>
  signal?: AbortSignal
}

async function post(body: object, signal?: AbortSignal) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new KoduError(data.error || 'Não foi possível contactar o Mivvi.', response.status)
  }
  return response
}

/** One full answer: { reply } (a JSON string for the feedback and exercises modes). */
export async function askKodu({ mode, messages, context, signal }: KoduRequest): Promise<string> {
  const response = await post({ mode, messages, context }, signal)
  const data = await response.json()
  return data.reply as string
}

/** Streams Kodu's answer token by token; resolves with the whole text. */
export async function streamKodu(
  { messages, context, signal }: Omit<KoduRequest, 'mode'>,
  onToken: (text: string) => void,
): Promise<string> {
  const response = await post({ mode: 'tutor', messages, context, stream: true }, signal)
  if (!response.body) throw new KoduError('Resposta vazia.', 502)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  let text = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    pending += decoder.decode(value, { stream: true })
    let end: number
    while ((end = pending.indexOf('\n\n')) >= 0) {
      const frame = pending.slice(0, end).trim()
      pending = pending.slice(end + 2)
      if (!frame.startsWith('data:')) continue
      const event = JSON.parse(frame.slice(5).trim())
      if (event.error) throw new KoduError(event.error, 502)
      if (event.token) {
        text += event.token
        onToken(text)
      }
    }
  }
  return text
}

/** Speech to text (Whisper on the server), for the chat's microphone. */
export async function transcribeAudio(audio: Blob): Promise<string> {
  const response = await fetch('/api/ai/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': audio.type || 'audio/webm' },
    body: audio,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new KoduError(data.error || 'Não consegui perceber o áudio.', response.status)
  return data.text || ''
}
