# REVIEW.md — критерии авторевью

Источник критериев для автоматического ревью (`opencode-review`) и для живых ревьюеров.
Воркфлоу `.github/workflows/opencode-review.yml` читает этот файл на каждом PR и ревьюит
диф по нему. Менять критерии — только здесь, воркфлоу править не нужно.

## Уровни важности

| Уровень   | Значение                                                               |
| --------- | ---------------------------------------------------------------------- |
| `blocker` | Сливать нельзя: ломает сборку, тесты, CI или поведение сервиса.        |
| `major`   | Стоит исправить до мержа: риск бага, потери данных, обхода требований. |
| `minor`   | Исправить по возможности: не мешает работе, но ухудшает код.           |
| `nit`     | На усмотрение автора: стиль, именование, микроулучшения.               |

## Формат вывода

Ревью оставляет **один** комментарий к PR:

1. **Вердикт**: `approve` (нет находок уровня `blocker`/`major`) или `needs fixes`.
2. **Находки**: `файл:строка — [уровень] что не так и как исправить`.
3. **Риск и откат**: краткая оценка по разделу «Риск» шаблона PR
   (`.github/PULL_REQUEST_TEMPLATE.md`).

Авторевью только читает и комментирует: ничего не коммитит, не пушит и не создаёт веток.

## 1. Коммиты и заголовок PR

- Каждый коммит — Conventional Commits: `type(scope): subject`, ≤ 100 символов, без точки
  в конце; типы из `@commitlint/config-conventional` (`feat`, `fix`, `chore`, `ci`,
  `refactor`, `test`, `docs`, `perf`, `build`, `style`, `revert`).
- При squash-merge заголовок PR становится итоговым коммитом — он тоже обязан быть
  conventional.
- Один PR — одна тема; изменения вне темы выносятся в отдельный PR.

## 2. Конфигурация и сборка (ловушки проекта)

- Алиас `@ → src` настроен в двух местах и правится всегда вместе: `vite.config.ts`
  (`resolve.alias`) и `tsconfig.app.json` (`paths`). `baseUrl` не добавлять (deprecated
  в TS 6), пути относительные (`./src/...`).
- PostCSS Mantine (`postcss-preset-mantine` + брейкпоинты) живёт инлайн в `vite.config.ts`
  (`css.postcss`) — отдельного `postcss.config.cjs` быть не должно.
- Prettier и commitlint настраиваются ключами `"prettier"` и `"commitlint"` в
  `package.json` — `.prettierrc`/`.commitlintrc` не создавать.
- Vite 8 собирает на rolldown: `build.rollupOptions.output.manualChunks` — только
  функциональная форма, объектная отклоняется типами.
- Первая строка `vite.config.ts` — `/// <reference types="vitest/config" />`; сам файл
  типизируется проектом `tsconfig.node.json`, а не `tsconfig.app.json`.
- Точка входа: `index.html` → `src/main.tsx` → `src/App.tsx`. `createRoot`, `StrictMode`,
  `MantineProvider` и импорт `@mantine/core/styles.css` остаются в `main.tsx`; файла
  `src/main.ts` в проекте нет.
- Node 24+ (`engines` в `package.json`, столько же в CI); версии в CI вниз не снижаются.

## 3. Код и зависимости

- Стек: Vite 8 + React 19 + TypeScript 6 + Mantine 9. Vue не появляется, `@mantine/*` —
  React-библиотеки.
- Новый импорт `@mantine/dates` (DatePicker и т.п.) сопровождается импортом
  `@mantine/dates/styles.css`.
- `react-hooks/rules-of-hooks` — не нарушать; `exhaustive-deps` не подавлять без
  явной причины в комментарии.
- Новый код не дублирует то, что уже есть в `src/`; дублирование — `major`.

## 4. Тесты

- Изменения логики в `src/` сопровождаются тестами в `test/` (вне `src`, но в typecheck
  через `include: ["src", "test"]`).
- Компоненты рендерятся через `render` из `test/test-utils.tsx` (обёртка с
  `MantineProvider`), не голым `@testing-library/react`.
- `describe`/`it`/`expect` — глобальные, импорты не нужны; полифиллы (`window.matchMedia`)
  остаются в `test/setup.ts`.
- Smoke-тест `test/main.test.tsx` монтирует реальную точку входа через `await import('@/main')`
  — ломать его без причины нельзя.

## 5. Сервер (`server/`)

- `server/` не входит в `tsc -b`: правки проверяются дополнительно
  `npx tsc -p server/tsconfig.json`.
- `server/generated/*` не правится руками (`npm run spec:server` пересоздаёт каталог);
  логика живёт в `server/handlers.ts` и `server/store.ts`.
- Маршруты идут под префиксом `/api` через `registerRoutes`, ключуются по `operationId`.
- Изменение контракта (`server/spec`) сопровождается регенерацией `server/generated`
  и согласованием клиента; иначе — `blocker`.

## 6. Домен и терминология

- Термины — из `GLOSSARY.md`: Владелец, Гость, Тип события, Рабочие часы, Слот, Запись,
  Встреча. Синонимы из _Avoid_ (админ, бронирование, booking и т.д.) в новом коде и UI
  не используются.
- Новое доменное понятие отражается в `GLOSSARY.md`; архитектурная развилка — в
  `docs/adr/` (ADR по формату из `docs/adr/`).

## 7. Безопасность и данные

- Секреты и ключи не попадают в коммиты: только GitHub Secrets и локальный `.env`
  (в `.gitignore`), шаблон — `.env.example`.
- Данные dev-бэкенда in-memory (`server/store.ts`): редеплой стирает всё. PR, трогающий
  данные, обязан упомянуть это в разделе «Риск» шаблона PR.
- Входные данные с клиента валидируются на сервере (длина topic, границы слота и т.п.).
- Для публичного PR-разбора в `prompt` воркфлоу не передаются секреты.

## 8. Неприкосновенное

- `.github/workflows/hexlet-check.yml` и `.github/workflows/README.md` (файлы Hexlet)
  не редактируются и не удаляются (запрет прямо в файле, они в `.prettierignore`).
- `AGENTS.md` не дублирует то, что уже описано в конфигах и скриптах.

## Что ревьюер не обязан проверять

- Форматирование — решает Prettier (конфликтующие правила ESLint отключает
  `eslint-config-prettier`); `printWidth: 100` — рекомендация форматтера, не blocker.
- Ссылки на «очевидные» улучшения вне дифа PR — это отдельный issue, а не находка ревью.
