import fastifyStatic from '@fastify/static'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import { createHandlers } from './handlers'
import { registerRoutes } from './generated/routes.gen'
import { schemas } from './generated/schemas.gen'
import { createStore } from './store'

// dist/ появляется после `npm run build`. В dev (`npm run server`) его может не
// быть — тогда бэкенд отдаёт только API, а статику раздаёт Vite-прокси.
const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

export function buildServer() {
  const app = Fastify()

  for (const schema of schemas) {
    app.addSchema(schema as Record<string, unknown>)
  }

  // API разворачивается под /api — так его ожидает клиент (baseUrl '/api') и
  // на это рассчитан dev-прокси Vite (пересылает /api/* без переписывания пути).
  app.register(
    async (scope) => {
      registerRoutes(scope, createHandlers(createStore()))
    },
    { prefix: '/api' },
  )

  // Прод-режим (контейнер/деплой): один процесс отдаёт и SPA, и API на одном
  // порту. Клиент ходит в '/api' того же origin, прокси не нужен.
  if (existsSync(join(distDir, 'index.html'))) {
    app.register(fastifyStatic, { root: distDir, wildcard: false })

    // react-router держит маршруты на клиенте (/book, /owner, ...), поэтому
    // любой неизвестный не-API путь отдаём как index.html (SPA-fallback).
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api')) {
        void reply.code(404).send({ message: 'Route not found' })
        return
      }
      void reply.sendFile('index.html')
    })
  }

  return app
}
