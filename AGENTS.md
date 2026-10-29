# AGENTS.md

Одностраничный контекст для агентов. Источник истины — конфиги и скрипты, не эта секция.

## Что это

SPA «calls_calendar»: **Vite 8 + React 19 + TypeScript 6 + Mantine 9** (+ `@mantine/dates`/`dayjs`). Нужен **Node 24+** (`engines` в `package.json`, столько же в CI). Продакшен-бэкенда в репозитории нет, но есть in-memory dev-бэкенд (`npm run server`); клиент ходит в API через dev-прокси Vite, включаемую `VITE_API_PROXY` в `.env` (шаблон: `.env.example`). Дефолтная ветка — **`master`**.

## Commit conventions

Каждый коммит **ОБЯЗАН** следовать Conventional Commits. Заголовок первой строки имеет ровно формат `<type>(scope): <subject>` — **≤ 100 символов**, **без точки в конце**. Разрешённые типы из `@commitlint/config-conventional`: `feat`, `fix`, `chore`, `ci`, `refactor`, `test`, `docs`, `perf`, `build`, `style`, `revert`. Скобки `(scope)` опциональны.

В репозитории включён husky-хук `.husky/commit-msg`, который гоняет `commitlint` на любом `git commit` — и в локальном клоне, и в CI-раннере при работе GitHub-агента. Любой заголовок, не подходящий под формат, **отклоняется** с `[type-empty]` и `[subject-empty]`, и коммит не создаётся.

**Запрещено**:

- `git commit --no-verify` / `git commit -n` / любой обход husky-хуков.
- Пустой заголовок (`""`), заголовок без `:` после типа, заголовок из одних только пробелов, `WIP`, `Update README`, `fix bug`, произвольная фраза на русском/английском без типа.

**Хорошие примеры**:

- `docs: extend opencode workflow section in readme`
- `ci(triage): add opencode-triage workflow for new issues`
- `fix(server): validate meeting topic length`

**Плохие примеры (будет отклонено commitlint)**:

- `Автотриаж issues + README`
- `Update README`
- `WIP`
- `fix bug`

Перед коммитом заголовок проверяется локально: `echo '<заголовок>' | npx commitlint`. Если хочется быстро поправить — `git commit --amend` с новым сообщением; повторно хук отработает.

Это правило действует на **все коммиты**, включая те, что делает GitHub-агент в Actions. Когда агент делает `git commit`, заголовок должен сразу соответствовать формату, иначе ветка не запушится.

## Команды

- `npm run dev` — dev-сервер на `http://localhost:5173`
- `npm run server` — in-memory dev-бэкенд (Fastify на `:8080`, все маршруты под `/api`); чтобы UI ходил в API, задайте `VITE_API_PROXY=http://localhost:8080` в `.env` и перезапустите `npm run dev`
- `npm run dev:all` — клиент и бэкенд одной командой (`concurrently`): поднимает `npm run server` + `npm run dev` с общим `.env`/`VITE_API_PROXY`
- `npm test` — vitest (один файл: `npx vitest run test/main.test.tsx`), `npm run test:watch`
- `npm run lint` / `npm run format:check` / `npm run format`
- `npm run build` — `tsc -b && vite build`, т.е. typecheck + сборка одной командой
- `docker build -t calls-calendar .` / `docker run -p 8080:8080 calls-calendar` — локальный запуск в контейнере (см. «Деплой»)

Порядок проверки такой же, как в CI (`.github/workflows/ci.yml`, Node 24): **lint → format:check → test → build**. Прогнать все четыре, прежде чем считать задачу готовой.

## Подводные камни конфигурации

- Цепочка входа: `index.html` → `src/main.tsx` → `src/App.tsx`. В `main.tsx` живут `createRoot`, `StrictMode`, `MantineProvider` и импорт `@mantine/core/styles.css` — переносить их в `App.tsx` не нужно. Файла `src/main.ts` нет, точка входа именно `.tsx`.
- Алиас `@ → src` прописан в **двух** местах и их надо менять вместе: `vite.config.ts` (`resolve.alias`) и `tsconfig.app.json` (`paths: { "@/*": ["./src/*"] }`). `baseUrl` в TS 6 deprecated — не добавлять, пути обязаны быть относительными (`./src/...`).
- `postcss.config.cjs` не существует: PostCSS Mantine (`postcss-preset-mantine` + брейкпоинты через `postcss-simple-vars`) встроен в `vite.config.ts` → `css.postcss`. Переносить обратно в отдельный файл не нужно.
- Vite 8 собирает на **rolldown**: объектная форма `build.rollupOptions.output.manualChunks` отклоняется типами, рабочая только функциональная (уже стоит в `vite.config.ts`).
- Prettier-конфиг лежит в `package.json` (ключ `"prettier"`): одинарные кавычки, **без точек с запятой**, `printWidth: 100`, `trailingComma: 'all'`. Файла `.prettierrc` нет — не создавать. То же для commitlint (ключ `"commitlint"`).
- PostCSS-плагины и тестовый `test`-блок прописаны в `vite.config.ts`; `/// <reference types="vitest/config" />` в первой строке обязателен для типов `test`-блока. Сам `vite.config.ts` типизируется отдельным проектом `tsconfig.node.json` (не `tsconfig.app.json`).
- `server/` — in-memory Fastify-бэкенд, **не входит в `tsc -b`** (typecheck отдельно: `npx tsc -p server/tsconfig.json`). `server/generated/*` пересоздаются `npm run spec:server`; хендлеры и логика живут вне генерации — в `server/handlers.ts` и `server/store.ts` — и переживают регенерацию. Хендлеры ключуются по `operationId` и инжектируются в `registerRoutes`; сервер оборачивает маршруты в префикс `/api` (см. `server/index.ts`).

## Тесты

- Лежат в `test/` (вне `src`), но включены в typecheck: `tsconfig.app.json` → `include: ["src", "test"]`, `types: ["vite/client", "vitest/globals"]`.
- Vitest настраивается блоком `test` в `vite.config.ts`: `jsdom`, `globals: true`, `setupFiles: ['./test/setup.ts']`, `css: false`.
- `describe`/`it`/`expect` — глобальные, импортировать не нужно; матчеры jest-dom и полифилл `window.matchMedia` (нужен Mantine) подключает `test/setup.ts`.
- Компонентные тесты рендерить через `render` из `test/test-utils.tsx` — обёртка над `@testing-library/react`, добавляющая `MantineProvider` (без него Mantine-компоненты не работают).
- Smoke-тест `test/main.test.tsx` монтирует реальную точку входа через `await import('@/main')`; точку монтирования `<div id="app">` создаёт `test/setup.ts` до всех хуков тестов.

## Линт

- `eslint.config.js` (flat): `typescript-eslint` recommended + `react-hooks` (`rules-of-hooks` — error, `exhaustive-deps` — warn) + `react-refresh/only-export-components` (warn): из файла с компонентом нельзя экспортировать хелперы и прочие не-компоненты (разрешены константы и compound-компоненты).
- `eslint-config-prettier` идёт последним и отключает конфликтующие правила — форматирование всегда решает Prettier.

## Коммиты и релизы (принудительно)

- **Conventional Commits** проверяется дважды: локальный husky-хук `.husky/commit-msg` (ставится через `npm install`, скрипт `prepare`) и CI-джоб `commitlint` (коммиты PR и прямые пуши в `master`). Формат: `type(scope): subject`, до 100 символов; типы — из `@commitlint/config-conventional` (`feat`, `fix`, `chore`, `ci`, `refactor`, `test`, `docs`, `perf`, `build`, `style`, `revert`). Без `type:` коммит не примется ни локально, ни в CI.
- При **squash-merge** итоговый коммит = заголовок PR, значит заголовок PR тоже обязан быть conventional.
- `.github/workflows/release-please.yml` (режим одного пакета, `release-type: node`) на пуше в `master` открывает release-PR с бампом версии в `package.json` и `CHANGELOG.md`; слияние этого PR создаёт тег и GitHub Release. Первый release-PR откроется, когда conventional-коммиты попадут в `master` — тегов пока нет.
- `.github/workflows/hexlet-check.yml` сгенерирован платформой Hexlet: **не редактировать и не удалять** (запрет прямо в файле). Оба файла Hexlet (`hexlet-check.yml`, `README.md`) лежат в `.prettierignore`, чтобы `npm run format` их не трогал.

## Деплой (Docker + Render)

- Контейнер: multi-stage `Dockerfile` (node:24-alpine): сборка SPA + esbuild-бандл `server/main.ts` → рантайм с prod-зависимостями. Один процесс на `PORT` (по умолчанию 8080) отдаёт и `dist/` (SPA-fallback на `index.html` для react-router), и `/api` — см. `server/index.ts`. Статика раздаётся, только если `dist/` существует, поэтому dev-режим (`npm run server` + Vite) не задет.
- Хостинг: **Render**, web service `calls-calendar` (регион Frankfurt, free), собирает Dockerfile из `master` при пуше (auto-deploy). Прод-URL: https://calls-calendar.onrender.com
- Deploy/логи/метрики — через Render MCP (`opencode mcp add render --url https://mcp.render.com/mcp --header "Authorization=Bearer <RENDER_API_KEY>"`); ключ хранить в `opencode.json` (в `.gitignore`), не в репозитории.
- **Данные in-memory** (`server/store.ts`): при редеплое/рестарте сервиса всё стирается. Для демо это ок; постоянное хранение — отдельная задача (Postgres/Key Value на Render).

## Полезно знать

- `npm run preview` — показать production-сборку из `dist/` (sourcemap `'hidden'`: карты в `dist` есть, но не связаны с кодом; vendor разбит на чанки `react` / `mantine` / `dayjs`).
- При первом использовании компонентов `@mantine/dates` (DatePicker и т.п.) нужен импорт `@mantine/dates/styles.css` — сейчас он нигде не подключён.
- `@mantine/*` — React-библиотека; Vue в проекте нет и появляться не должно.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.
