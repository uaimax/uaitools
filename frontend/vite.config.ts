import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import tsconfigPaths from 'vite-tsconfig-paths'

// Resolver __dirname para ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin para resolver path aliases do tsconfig.json automaticamente
    // Garante que @/ seja resolvido corretamente em todos os ambientes
    tsconfigPaths({
      // Forçar resolução mesmo se tsconfig não tiver paths
      root: process.cwd(),
    }),
  ],
  resolve: {
    alias: {
      // Alias explícito como fallback
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
})
