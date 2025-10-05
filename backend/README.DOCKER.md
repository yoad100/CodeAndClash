Quick dev/test with Docker Compose

This compose file launches MongoDB, Redis, two backend instances and a scheduler worker.

Usage (requires Docker & Docker Compose):

1. Build and start:

```powershell
cd backend
docker compose up --build
```

2. This will expose backend instances on ports 3000 and 3001. The worker will run in the `worker` service and publish scheduled `match-events`.

Notes:
- Set real `JWT_SECRET` and other secrets in production.
- The compose file is intended for local testing only.
