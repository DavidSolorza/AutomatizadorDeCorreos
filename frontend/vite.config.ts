import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // Dev siempre en / — evita mezclar base de GitHub Pages con localhost
  const base =
    mode === 'development'
      ? env.VITE_BASE_PATH || '/'
      : env.VITE_BASE_PATH || '/AutomatizadorDeCorreos/'

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
    },
  }
})
