# calls_calendar

[![CI](https://github.com/vladimirBolkh/ai-for-developers-project-387/actions/workflows/ci.yml/badge.svg)](https://github.com/vladimirBolkh/ai-for-developers-project-387/actions/workflows/ci.yml)
[![hexlet-check](https://github.com/vladimirBolkh/ai-for-developers-project-387/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/vladimirBolkh/ai-for-developers-project-387/actions)

Web-приложение: **Vite + React + TypeScript + Mantine 9** (UI) + **dayjs** (даты, для `@mantine/dates`).

Прод: **https://calls-calendar-387.onrender.com** (Render, авто-деплой по пушу в `master`).

## Команды

```bash
npm install      # установка зависимостей
npm run dev      # dev-сервер Vite
npm test         # прогон тестов (Vitest, однократно)
npm run test:watch # тесты в watch-режиме
npm run build    # type-check (tsc -b) + production-сборка
npm run preview  # предпросмотр production-сборки
```

## Структура

- `index.html` — точка входа, подключает `/src/main.tsx`
- `src/main.tsx` — монтирование приложения + `MantineProvider` (здесь импортируются стили Mantine)
- `src/App.tsx` — корневой компонент
- `vite.config.ts` — плагины, алиас `@ → src`, dev-прокси API, PostCSS Mantine (`css.postcss`: `postcss-preset-mantine` + брейкпоинты), sourcemap и разбивка чанков

## Окружение

Скопируйте `.env.example` в `.env` и укажите адрес бэкенда для dev-прокси:

```
VITE_API_PROXY=http://localhost:8080
```

## Пути

Алиас `@` указывает на `src/`:

```ts
import App from '@/App'
```

## AI-агент (OpenCode)

Репозиторий подключён к [GitHub App `opencode-agent`](https://github.com/apps/opencode-agent) — агент на базе OpenCode запускается прямо в GitHub Actions. Отличие от «классического» self-hosted агента: авторизация идёт через OIDC-обмен (`id-token: write`), который меняет токен воркфлоу на токен установки App. Поэтому агент комментирует и пушит от имени App, а не от `github-actions[bot]`, и для записи не нужен PAT.

- **Файл**: `.github/workflows/opencode.yml`
- **Событие**: комментарий в issue или PR-review с типом `types: [created]`
- **Команды (`mentions`)**: `/opencode`, `/oc` — в начале комментария или после пробела
- **Кто может запустить**: только доверенные участники (`OWNER` / `MEMBER` / `COLLABORATOR`). Команды ботов игнорируются, чтобы избежать зацикливания; недоверенные авторы и форки не проходят условие и не получают секрет
- **Модель**: `opencode/mimo-v2.6-flash-free` (бесплатная, через шлюз OpenCode)
- **Назначение**: отвечать на команду в треде issue/PR, читать репозиторий, предлагать изменения и правки по запросу
- **Результат**: ответ агента появляется комментарием в том же issue/PR; сам прогон виден во вкладке **Actions** → воркфлоу `opencode`. Публикация транскрипта сессии включена (`share: true`)
- **Параллельность и тайм-аут**: не больше одного запуска на конкретный issue/PR (`concurrency`), тайм-аут задачи — 60 минут

**Секрет**: `OPENCODE_API_KEY` (Settings → Secrets and variables → Actions) — ключ шлюза OpenCode, выпущенный в кабинете. Без него запуск падает на аутентификации.

### Конфигурация агента для этого репозитория

Контекст для агента: `AGENTS.md` + `docs/agents/`:

- **Трекер задач** — GitHub Issues через `gh` CLI (`docs/agents/issue-tracker.md`). Метки триажа (`docs/agents/triage-labels.md`): `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.
- **Доменные доки** (`docs/agents/domain.md`) — корневой `GLOSSARY.md` и `docs/adr/` (читать перед исследованием кодовой базы).

**Скиллы** (38 штук, `.opencode/skills/`, вызываются как `/имя-скилла`):

- Планирование и разбор задач: `grilling`, `grill-me`, `grill-with-docs`, `to-spec`, `to-tickets`, `to-questionnaire`, `wayfinder`, `loop-me`, `wait-what`
- Реализация: `implement`, `implement-spec`, `tdd`, `diagnosing-bugs`, `prototype`
- Код-ревью и архитектура: `code-review`, `codebase-design`, `improve-codebase-architecture`, `setup-ts-deep-modules`
- Работа с трекером и процесс: `triage`, `chief-of-staff`, `research`, `pr`, `retro`, `ask-matt`
- Git и безопасность: `git-guardrails-claude-code`, `claude-handoff`, `handoff`
- Настройка окружения: `setup-matt-pocock-skills`, `setup-pre-commit`, `migrate-to-shoehorn`, `scaffold-exercises`
- Документация и домен: `domain-modeling`, `writing-for-agents`
- Преподавание и тексты: `teach`, `writing-beats`, `writing-shape`, `writing-fragments`
- Инфраструктура: `wizard`

### Проверка проекта

Порядок проверки совпадает с CI (`.github/workflows/ci.yml`):

```bash
npm run lint           # ESLint
npm run format:check   # Prettier
npm test               # Vitest
npm run build          # typecheck (tsc -b) + production-сборка
```

Плюс CI-джоба `commitlint` проверяет коммиты по Conventional Commits — сообщения коммитов агента должны быть в формате `type(scope): subject`.

### Аудит приложения (opencode-audit)

- **Файл**: `.github/workflows/opencode-audit.yml`
- **Что делает**: ночной аудит развёрнутого приложения по адресу из переменной репозитория `APP_URL`; плюс ручной запуск кнопкой **Run workflow** (`workflow_dispatch`) с режимом `audit` (обычный аудит) или `readme` (агент дополняет этот раздел README)
- **Расписание**: `cron: '43 3 * * *'` — ежедневно в 03:43 UTC (06:43 MSK)
- **Права и авторизация**: `id-token: write` — OIDC-обмен на токен GitHub App `opencode-agent`, поэтому агент создаёт issues от имени App, без PAT; `contents`/`pull-requests`/`issues` — только на чтение
- **Находки**: агент создаёт issues с меткой `audit` (заголовок `audit: <коротко>`, шаги воспроизведения, вывод, предложение по исправлению). При повторных запусках он сначала ищет существующие issues с меткой `audit` и не создаёт дублей — совпавшие находки упоминаются в отчёте со ссылкой на номер issue. Если реальных находок нет, создаётся одна учебная задача с меткой `audit-training`
- **Результат**: артефакт `audit-report` на странице прогона (**Run → Artifacts**), а также вывод агента в логе шага (и в step summary). В коммиты отчёты не попадают
- **Пример прогона**: https://github.com/vladimirBolkh/ai-for-developers-project-387/actions/runs/40968704962

## Деплой

Прод-сборка запускается в Docker-контейнере на **Render** (web service `calls-calendar`, регион Frankfurt, free-тариф): https://calls-calendar-387.onrender.com

- `Dockerfile` — multi-stage: собирает SPA (`npm run build`) и бандлит dev-бэкенд (`server/main.ts` через esbuild), в рантайм идут только prod-зависимости. Один процесс на порту `PORT` (по умолчанию 8080) отдаёт и статику из `dist/` (с SPA-fallback для react-router), и API под `/api`.
- Локально то же самое: `docker build -t calls-calendar .` → `docker run -p 8080:8080 calls-calendar`.
- **Как деплоить**: push в `master` → Render собирает Dockerfile и выкатывает (auto-deploy). Если авто-деплой не сработал — кнопка _Redeploy_ в дашборде Render или Render MCP (`trigger_deploy`).
- ⚠️ Данные хранятся in-memory (`server/store.ts`): при каждом редеплое/рестарте сервиса записи стираются.

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов. Учебная программа: [ai-for-developers](https://ru.hexlet.io/programs/ai-for-developers).
