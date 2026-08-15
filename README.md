# chesster

A chess survival game. Outlast a Stockfish AI running entirely in your browser across 8 difficulty levels, then claim your score on the global leaderboard.

## Stack

| Layer  | Tech |
| ------ | ---- |
| Client | React 19, Vite 7, TypeScript, chess.js, react-chessboard, stockfish (Web Worker) |
| Server | Express 5, better-sqlite3 (SQLite, WAL mode), TypeScript |
| Repo   | npm workspaces monorepo (`client/`, `server/`) |

## Prerequisites

- Node.js 20 LTS or newer (`npm` included)
- For a from-scratch install of the native `better-sqlite3` module (only if no prebuilt binary matches your platform/Node version): a build toolchain (`python3`, `make`, `g++`)

## Quick start (development)

```sh
npm install
npm run dev
```

- API: http://localhost:3001
- Web: http://localhost:5173 (Vite dev server proxies `/api` → :3001)

The SQLite database is created automatically on first run (default: `<repo>/data/chesster.db`).

## Scripts

Run from the repo root (applies to both workspaces):

| Command           | What it does |
| ----------------- | ------------ |
| `npm run dev`     | API (tsx watch, :3001) + client (Vite, :5173) concurrently |
| `npm run build`   | Typecheck, then build client → `client/dist` and server → `server/dist` |
| `npm start`       | Run the built server (`node server/dist/index.js`) |
| `npm test`        | `vitest run` in server and client |
| `npm run typecheck` | `tsc --noEmit` in server and client |

Per-workspace commands (run from root with `-w`):

| Client (`-w client`) | Server (`-w server`) |
| -------------------- | -------------------- |
| `npm run dev -w client` (Vite dev server) | `npm run dev -w server` (tsx watch) |
| `npm run build -w client` (typecheck + `vite build`) | `npm run build -w server` (`tsc` → `server/dist`) |
| `npm test -w client` (Vitest) | `npm start -w server` (production) |

## Testing

```sh
npm test            # all tests (server + client)
npm run typecheck   # strict TypeScript across both workspaces
```

Tests are unit tests: game logic (`client/src/lib/game.test.ts`) and score verification (`server/src/verify.test.ts`).

## Deploying

chesster ships as a single Node process: the Express API also serves the built client (SPA fallback to `index.html`) when `client/dist` exists.

1. **Install & build on the target machine**

   ```sh
   npm install
   npm run build
   ```

   Use the same Node major version as development — `better-sqlite3` is a native module and its binary must match the runtime.

2. **Run**

   ```sh
   PORT=3001 node server/dist/index.js
   ```

   Health check: `GET /api/health` → `{"ok":true,"service":"chesster"}`

3. **Environment variables**

   | Variable | Default | Purpose |
   | -------- | ------- | ------- |
   | `PORT` | `3001` | API listen port |
   | `CHESSTER_DATA_DIR` | `<repo>/data` | Directory for `chesster.db` (created automatically) |

4. **Process management** — keep it running with any supervisor, e.g.:

   ```sh
   pm2 start server/dist/index.js --name chesster
   ```

   or a systemd unit with `ExecStart=/usr/bin/node /opt/chesster/server/dist/index.js`.

5. **Behind a reverse proxy**

   - The app already trusts a single reverse-proxy hop (`app.set('trust proxy', 1)`), so the score rate limit (10 submissions/minute) applies per user via `X-Forwarded-For`. If you stack multiple proxy layers, bump the trust depth accordingly.
   - No WebSockets are used, so a plain HTTP proxy is fine. Static assets from `client/dist` can also be served by your CDN/proxy if you prefer.

6. **Backups** — copy the data directory (including the `chesster.db-wal`/`-shm` files, or run `sqlite3 chesster.db 'VACUUM'` first) to back up runs and leaderboard data.
