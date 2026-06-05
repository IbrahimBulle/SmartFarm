import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { readFileSync } from 'node:fs'

const backendEnvPath = '/home/ibra/workspace/SmartFarmBackend/.env'

function readBackendEnv(name) {
  try {
    const env = readFileSync(backendEnvPath, 'utf8')
    const line = env
      .split('\n')
      .find((item) => item.trim().startsWith(`${name}=`))

    if (!line) return ''

    return line
      .slice(line.indexOf('=') + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
  } catch {
    return ''
  }
}

const weatherApiKey = readBackendEnv('WEATHER_AI_API')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  define: {
    'import.meta.env.VITE_WEATHER_AI_API': JSON.stringify(weatherApiKey),
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL || ''),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/weather-ai': {
        target: 'https://api.weather-ai.co',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/weather-ai/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (weatherApiKey) {
              proxyReq.setHeader('Authorization', `Bearer ${weatherApiKey}`)
            }
          })
        },
      },
    },
  },
})
