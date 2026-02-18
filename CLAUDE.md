# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Live concert ticket lottery app (ライブ抽選アプリ) used as hands-on training material. Users browse events, submit lottery applications, and admins execute random drawings to select winners.

## Commands

```bash
# First-time setup (install all three package.json deps)
npm install && cd backend && npm install && cd ../frontend && npm install && cd ..

# Reset DB and seed sample data
cd backend && rm -f lottery.db && npm run seed

# Run full stack (backend + frontend concurrently)
npm run dev

# Run individually
npm run dev:backend    # Express on :3000 (nodemon + ts-node)
npm run dev:frontend   # Vue CLI dev server on :8080

# Build frontend for production
npm run build

# Lint and format
npm run lint
npm run format
npm run format:check
```

No test framework is configured in this project.

## Architecture

Monorepo with three `package.json` files (root, `backend/`, `frontend/`). Root uses `concurrently` to run both servers.

### Backend (`backend/src/`)

Express + TypeScript server (port 3000). Uses **better-sqlite3** with a local file `backend/lottery.db` (gitignored, regenerated via seed).

**Database schema** — two tables with FK relationship:
- `events` — id, title, artist, venue, capacity, lottery_executed (0/1), created_at
- `applications` — id, event_id (FK→events), name, email, status (pending/won/lost), applied_at

Key files:
- `database.ts` — DB singleton with schema init, foreign keys enabled
- `routes/api.ts` — All API routes mounted at `/api/events`. Lottery uses Fisher-Yates shuffle in a transaction: first `capacity` shuffled applicants win, rest lose
- `seed.ts` — Standalone seeder (`ts-node src/seed.ts`) populating 5 sample events + 8 demo applicants on event #1
- In production, Express serves the built frontend static files from `frontend/dist/`

### Frontend (`frontend/src/`)

Vue 3 + TypeScript via **Vue CLI** (not Vite). Styled with Bootstrap 5. Dev server proxies `/api` requests to backend port 3000 (configured in `vue.config.js`).

- `services/api.ts` — Axios wrapper for all backend endpoints
- `router/index.ts` — Four routes: `/` (event list), `/events/:id` (detail + apply), `/events/:id/results` (lottery results), `/admin` (run lotteries)
- Types are defined separately in both `backend/src/types/` and `frontend/src/types/` (not shared)

### API Endpoints (all under `/api/events`)

- `GET /` — list events with application counts
- `GET /:id` — event detail
- `POST /:id/apply` — submit application `{ name, email }`
- `GET /:id/applications` — list applicants for event
- `POST /:id/lottery` — execute lottery drawing
- `GET /:id/results` — lottery results (winners + losers)
- `GET /api/health` — health check (on root router)

## Code Style

- **Prettier**: single quotes, semicolons, trailing commas (`all`), 100-char line width
- **ESLint**: flat config — typescript-eslint + eslint-plugin-vue + eslint-config-prettier
- `vue/multi-word-component-names` is off
- Unused function args prefixed with `_` are allowed (`argsIgnorePattern: '^_'`)
- All UI text and code comments are in Japanese
