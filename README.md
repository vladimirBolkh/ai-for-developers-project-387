# calls_calendar

[![CI](https://github.com/vladimirBolkh/ai-for-developers-project-387/actions/workflows/ci.yml/badge.svg)](https://github.com/vladimirBolkh/ai-for-developers-project-387/actions/workflows/ci.yml)
[![hexlet-check](https://github.com/vladimirBolkh/ai-for-developers-project-387/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/vladimirBolkh/ai-for-developers-project-387/actions)

Web-приложение: **Vite + React + TypeScript + Mantine 9** (UI) + **dayjs** (даты, для `@mantine/dates`).

Прод: **https://calls-calendar.onrender.com** (Render, авто-деплой по пушу в `master`).

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

## Деплой

Прод-сборка запускается в Docker-контейнере на **Render** (web service `calls-calendar`, регион Frankfurt, free-тариф): https://calls-calendar.onrender.com

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
