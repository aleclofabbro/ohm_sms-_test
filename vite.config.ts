import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      external: [/\.test\.tsx?$/],
      // external: ['@fontsource/roboto-condensed'],
    },
  },
  optimizeDeps: {
    exclude: ["./public/entities/*"],
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tsconfigPaths(),
    // checker({
    //   typescript: {
    //     tsconfigPath: './tsconfig.app.json',
    //   },
    // })
  ],
})