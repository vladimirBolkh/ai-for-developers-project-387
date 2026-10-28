/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import postcssPresetMantine from 'postcss-preset-mantine'
import postcssSimpleVars from 'postcss-simple-vars'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    // PostCSS-конфигурация Mantine (раньше лежала в postcss.config.cjs)
    css: {
      postcss: {
        plugins: [
          postcssPresetMantine({}),
          postcssSimpleVars({
            variables: {
              'mantine-breakpoint-xs': '36em',
              'mantine-breakpoint-sm': '48em',
              'mantine-breakpoint-md': '62em',
              'mantine-breakpoint-lg': '75em',
              'mantine-breakpoint-xl': '88em',
            },
          }),
        ],
      },
    },

    server: {
      // Dev-прокси для API: задайте VITE_API_PROXY в .env (см. .env.example)
      ...(env.VITE_API_PROXY
        ? {
            proxy: {
              '/api': {
                target: env.VITE_API_PROXY,
                changeOrigin: true,
              },
            },
          }
        : {}),
    },

    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./test/setup.ts'],
      css: false,
    },

    build: {
      // 'hidden': карты попадают в dist для отладки, но не связываются с кодом
      // комментарием sourcemap; для публичного деплоя можно выставить false
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          // Отдельные чанки для крупных vendor-библиотек
          manualChunks: (id: string): string | undefined => {
            const path = id.split('\\').join('/')
            if (!path.includes('node_modules/')) return
            if (path.includes('node_modules/@mantine/')) return 'mantine'
            if (path.includes('node_modules/dayjs/')) return 'dayjs'
            if (/node_modules\/(react|react-dom|scheduler)\//.test(path)) return 'react'
            return undefined
          },
        },
      },
    },
  }
})
