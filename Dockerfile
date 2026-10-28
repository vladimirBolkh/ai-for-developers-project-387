# syntax=docker/dockerfile:1
# ── Stage 1: зависимости для сборки ──────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
# husky в контейнере не нужен (нет .git) — просим его молча пропустить установку
ENV HUSKY=0
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: сборка SPA + бандл dev-бэкенда в один JS ────────────────────────
FROM deps AS build
COPY . .
# SPA: tsc -b && vite build → dist/
RUN npm run build
# API: server/main.ts (точка входа dev-бэкенда) собирается в server-dist/main.js;
# внешние пакеты (fastify, @fastify/static) остаются require/import из node_modules
RUN npx esbuild server/main.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --packages=external \
  --outfile=server-dist/main.js \
  --log-level=warning

# ── Stage 3: рантайм — только prod-зависимости + артефакты сборки ───────────
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
  HUSKY=0 \
  PORT=8080
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
# dist/ ложим в /app/dist — server/index.ts ищет его относительно бандла:
# /app/server-dist/../dist = /app/dist
COPY --from=build /app/dist ./dist
COPY --from=build /app/server-dist ./server-dist
USER node
EXPOSE 8080
CMD ["node", "server-dist/main.js"]
