# Development run instructions (Frontend + Backend)

This file lists the exact commands and environment variables to run the project locally (Windows PowerShell examples).

## Prerequisites
- Node.js (16+ recommended)
- npm
- Docker & Docker Compose (recommended for MongoDB + Redis)
- Expo CLI (optional): `npm install -g expo-cli` (or use `npx expo`)

## Frontend (Expo React Native)
1. Install dependencies (from repo root):

```powershell
npm install
```

2. Install native Expo modules used by the app:

```powershell
npx expo install expo-secure-store expo-haptics @react-native-async-storage/async-storage @react-native-community/netinfo
# Optional (Sentry native integration):
npm install @sentry/react-native
```

3. Start Expo:

```powershell
npm run start
# or
expo start
```

Note: if running on a physical device, make sure API_BASE_URL / SOCKET_URL are set to your machine IP rather than localhost.

## Backend (Node + TypeScript)
1. Install backend deps:

```powershell
cd backend
npm install
```

2. Create `.env` in `backend/` (copy `.env.example` if present). Required values:

- `MONGODB_URI` (e.g. `mongodb://mongo:27017/codingwar` or a local Mongo URI)
- `REDIS_URL` (e.g. `redis://redis:6379` or `redis://127.0.0.1:6379`)
- `JWT_SECRET` (a strong secret for signing tokens)
- `PORT` (optional; default 3000)
- `SENTRY_DSN` (optional)
- `FRONTEND_URL` (optional; default `http://localhost:19006` for Expo)

3. Start supporting services (recommended with Docker Compose):

```powershell
# from repo root if backend/docker-compose.yml exists
docker-compose -f backend/docker-compose.yml up -d
```

If you prefer not to use Docker, start MongoDB and Redis locally and set `MONGODB_URI` and `REDIS_URL` accordingly.

4. Start backend (dev):

```powershell
cd backend
npm run dev
```

## Run order
1. Start backend services (Mongo + Redis) via Docker Compose
2. Start backend server (`npm run dev` in `backend/`)
3. Start Expo frontend (`npm run start` at repo root)

## Common gotchas
- If running Expo on a device, replace `http://localhost:3000` in `src/config/api.ts` and `src/config/socket.ts` with your machine LAN IP or set `process.env.API_BASE_URL`/`process.env.SOCKET_URL` in your environment.
- If Sentry is not installed, App will fall back safely because imports are now guarded.
- Haptics and SecureStore require the Expo native packages installed to work at runtime.

## Quick check
- After starting backend, open `http://localhost:3000/health` (or similar health endpoint) to verify Mongo+Redis connectivity.
- Start the app in Expo and test matchmaking flows.

If you'd like, I can add these package installs automatically to `package.json` and commit them; say the word and I'll update `package.json` to include the native packages and run a quick type-check again.