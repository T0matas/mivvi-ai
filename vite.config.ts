import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { createCodevantumAiHandler, createTranscribeHandler } from './server/codevantumAi.mjs'

// Kodu (the Codevantum AI) answers at /api/ai/chat from the dev and preview
// servers. GROQ_API_KEY has no VITE_ prefix, so it never reaches the browser.
function codevantumAi(apiKey: string | undefined): Plugin {
  const handler = createCodevantumAiHandler({ getKey: () => apiKey })
  const transcribe = createTranscribeHandler({ getKey: () => apiKey })
  return {
    name: 'codevantum-ai',
    configureServer(server) {
      server.middlewares.use('/api/ai/chat', handler)
      server.middlewares.use('/api/ai/transcribe', transcribe)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/ai/chat', handler)
      server.middlewares.use('/api/ai/transcribe', transcribe)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), codevantumAi(env.GROQ_API_KEY || process.env.GROQ_API_KEY)],
    server: {
      host: true,
      port: 3001,
      strictPort: true
    }
  }
})
