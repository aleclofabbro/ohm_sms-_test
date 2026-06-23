import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from 'path'
import { entityFileReader } from './src/fetch-local-fs/entityFileReader.node'
// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      external: [/\.test\.ts[x]?$/],
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  cacheDir: './.vitecache',
  server: {
    fs: { allow: ['..'] },
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    {
      name: 'serve-entites',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/_/')) {
            const basePath = path.resolve(__dirname, '../entities')
            const [name, id] = req.url
              .replace('/_/', '')
              .split('?')[0]
              .split('/')
            const entity = await entityFileReader({ basePath, name, id })
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.write(JSON.stringify(entity))
            res.end()
          }
          next()
        })
      },
    },
  ],
})
