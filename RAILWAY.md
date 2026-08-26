# 🚂 Deploy 9Router to Railway — Free Hosting

Railway is a long-lived PaaS (not serverless like Vercel). It runs 9Router as a
persistent Node process, injects the listen port via the `PORT` env var, and
provides a rolling HTTP **healthcheck** — so the dashboard, background token
refresh, and persistent SQLite all work, unlike Vercel's frozen lambda.

## Feature support

| Feature | Status | Notes |
|---------|--------|-------|
| API Proxy (/v1) | ✅ Works | Core functionality |
| Dashboard | ✅ Works | UI runs normally |
| Background token refresh | ✅ Works | Persistent process |
| OAuth / token refresh | ✅ Works | Survives across requests |
| SQLite persistence | ⚠️ Ephemeral | Disk resets on each deploy → sql.js used; point `DATA_DIR` at a Railway volume to persist |
| MITM/TLS | ❌ Not supported | Needs privileged network access |
| SAML SSO | ❌ Not supported | Local-only IdP flow |

## Setup

### 1. Push to GitHub

```bash
git add -A
git commit -m "feat: add Railway hosting support"
git push origin main
```

### 2. Deploy on Railway

1. Go to https://railway.app → **New Project** → **Deploy from GitHub repo**.
2. Select your fork of `9router-vercel`.
3. Railway auto-detects the build via `railway.json` (Nixpacks → `npm run build`).
4. Set the **Start Command** to `npm run start:railway` (this is preconfigured in `railway.json`).
5. Add environment variables in the Railway dashboard (never commit secrets):
   - `JWT_SECRET` — session cookie signer (required)
   - `INITIAL_PASSWORD` — override the `123456` default (required)
   - `API_KEY_SECRET` / `API_KEYS` — optional, for CLI auth
   - `DATA_DIR` — optional; set to a mounted **Railway Volume** path to persist SQLite across deploys

### 3. Healthcheck

Railway pings `GET /api/health`. `railway.json` already sets `healthcheckPath`.
The endpoint returns `200` once the server is up.

## How it works

`start-platform.js` auto-detects Railway via the `RAILWAY_ENVIRONMENT` /
`RAILWAY_SERVICE_ID` / `RAILWAY_PROJECT_ID` env vars and:

- Binds `0.0.0.0` and uses the **injected `$PORT`** (never hardcoded).
- Forces `USE_SQLJS=1` because Railway's image layer is read-only; sql.js keeps
  the database in the writable `/tmp/.9router` (or your mounted volume).
- Reuses the same Next.js standalone build/custom-server path as VPS/Docker.

## Persisting data across deploys

Railway wipes the container filesystem on every deploy. To keep settings, keys,
and usage history, mount a **Railway Volume** and set `DATA_DIR` to its path
(e.g. `/data`). With a volume mounted, you can also drop `USE_SQLJS` and let the
SQLite driver use a file backend for better performance.
