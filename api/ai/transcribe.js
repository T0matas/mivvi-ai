// Vercel Function: speech to text for the chat's microphone, at /api/ai/transcribe.
import { createTranscribeHandler } from '../../server/codevantumAi.mjs'

const handler = createTranscribeHandler({ getKey: () => process.env.GROQ_API_KEY })

export const config = { maxDuration: 30 }

export default function transcribe(req, res) {
  return handler(req, res)
}
