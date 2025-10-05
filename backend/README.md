Coding War - Backend
=====================

This is a production-oriented Node.js + TypeScript backend for the Coding War mobile app. It includes:

- Express REST API for authentication, users, questions, leaderboard, and payments stubs
- Socket.IO for real-time matchmaking and match events
- MongoDB (Mongoose) for persistent storage
- JWT-based authentication with refresh tokens
- Rate limiting, helmet and basic logging

Getting started (development)
-----------------------------

1. Copy `.env.example` to `.env` and update values.
2. Start MongoDB (Docker compose provided in repo root) or use your own MongoDB.
3. Install dependencies:

```bash
cd backend
npm install
```

4. Start dev server:

```bash
npm run dev
```

Docker (recommended for local development)
-----------------------------------------

A `docker-compose.yml` is provided in the repository root to run MongoDB. Use it and then run the dev server.

API Contract (high level)
-------------------------

Auth
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

Users
- GET /users/me
- PATCH /users/me

Questions
- GET /questions/random?count=5

Leaderboard
- GET /leaderboard/top?limit=100

Socket.IO events
Client -> Server: findOpponent, findOpponentBySubject, cancelSearch, submitAnswer, leaveMatch
Server -> Client: matchFound, matchStarted, answerResult, matchEnded, opponentLeft
