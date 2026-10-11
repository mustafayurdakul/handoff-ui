import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// The UI calls /api; Vite forwards it to the handoff server, in `npm run dev` and in `npm run preview`.
export default defineConfig(({ mode }) => {
  const api = loadEnv(mode, process.cwd(), '').HANDOFF_API || 'http://127.0.0.1:8765'
  const server = { port: 5173, proxy: { '/api': api } }
  return { plugins: [react()], server, preview: server }
})
