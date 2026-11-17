# Analog Slack

- `apps/web` — Next.js, TanStack Query, Zustand, shadcn/ui + Tailwind, RHF + Zod, socket.io-client, dnd-kit, Sentry, Vitest + RTL, Storybook
- `packages/shared` — общие zod-схемы, типы и имена socket-событий (`@app/shared`)
- `packages/api` — клиент авторизации и хуки TanStack Query на основе OpenAPI NestJS (`@packages/api`)
- `apps/api` — NestJS, Prisma + PostgreSQL, Redis + BullMQ, Socket.IO, Swagger, OpenAI, S3 (RustFS локально), Sentry

## Требования

- Node.js 22.12+ (`nvm use`)
- pnpm 10 (`npm i -g pnpm@10`)
- Docker

## Запуск

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Запишите результат следующей команды в AUTH_JWT_SECRET в apps/api/.env
node -p "require('node:crypto').randomBytes(32).toString('hex')"
docker compose up -d
pnpm --filter api db:migrate
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/health, Swagger: http://localhost:4000/docs
- S3-консоль (RustFS): http://localhost:9001/rustfs/console/ (minioadmin / minioadmin), бакет `uploads` создать в консоли
- Структура таблиц и порядок работы с миграциями: [docs/database.md](docs/database.md)

## Авторизация

- `/register` создаёт аккаунт по имени пользователя, почте и паролю. `/login` открывает сессию. `/profile` показывает данные аккаунта и позволяет выйти.
- `CORS_ORIGIN` должен совпадать с origin фронтенда. Браузер обращается к `/api/auth/*` на домене приложения. Middleware проксирует эти запросы в NestJS через `AUTH_API_URL` или `NEXT_PUBLIC_API_URL`.
- Middleware проверяет наличие refresh-cookie перед загрузкой `/profile`. Действительность сессии проверяет NestJS.
- При входе и регистрации NestJS выставляет `accessToken` и `refreshToken` как HttpOnly cookies. При обновлении сессии сервер заменяет `accessToken`. Выход отзывает сессию и удаляет обе cookies.
- В продакшене используйте HTTPS, задайте `NODE_ENV=production` для API и передайте публичный адрес API через `NEXT_PUBLIC_API_URL` при сборке фронтенда.
- Обновление клиента после изменения контракта: `pnpm --filter api build`, `pnpm --filter api openapi:export`, `pnpm --filter @packages/api generate`.

## Команды

- `pnpm lint | typecheck | test | build`
- `pnpm --filter web storybook`
- `cd apps/web && pnpm dlx shadcn@latest add input` — добавить компонент shadcn

## Прод

```bash
POSTGRES_PASSWORD=secret docker compose -f docker-compose.prod.yml up -d --build
```

## Общий код (`@app/shared`)

- Код в `packages/shared/src`, собирается `tsc` в `dist` (нужно для Nest/CommonJS).
- Собирается автоматически при `pnpm install` и `pnpm dev` (в dev работает `tsc --watch`).
- Импорт: `import { mySchema, type MyType } from '@app/shared'`.
- После изменений в shared Nest нужно перезапустить (он следит только за своим `src`).
