import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      external: [/\.test\.ts[x]?$/],
    },
  },
  resolve:{
    tsconfigPaths: true
  },
  cacheDir:'./.vitecache',
  plugins: [
    react(),
    babel({ presets: [
      reactCompilerPreset()
    ] }),
  ],
})