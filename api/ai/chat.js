// Vercel Function: Mivvi's AI (the Codevantum tutor on Groq) at /api/ai/chat.
// Same handler as the dev server; GROQ_API_KEY comes from Vercel's env vars.
import { createCodevantumAiHandler } from '../../server/codevantumAi.mjs'

const handler = createCodevantumAiHandler({ getKey: () => process.env.GROQ_API_KEY })

export const config = { maxDuration: 60 }

export default function chat(req, res) {
  return handler(req, res)
}
