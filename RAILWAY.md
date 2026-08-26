# 🚂 Deploy 9Router ke Railway

> Persistent process, SQLite persistence, push to deploy.

## Kenapa Railway?

| | Railway |
|--|---------|
| Free | ✅ $5 credit/bulan |
| Sleep | ❌ Gak sleep |
| Cold start | ❌ Nol |
| Persistent disk | ✅ Ya (volume) |
| Full features | ✅ Semua (MITM, token refresh, dll) |

**Railway = VPS gratis yang managed.** Push code, langsung deploy.

---

## Setup

### 1. Push ke GitHub

```bash
git push origin main
```

### 2. Import ke Railway

1. Buka https://railway.com/new
2. Login GitHub
3. **"Deploy from GitHub Repo"** → pilih repo

### 3. Set Environment Variables

Railway Dashboard → Service → Variables

| Variabel | Value |
|----------|-------|
| `JWT_SECRET` | string random 32+ karakter |
| `INITIAL_PASSWORD` | password kamu |
| `API_KEY_SECRET` | `sk_your_key` (opsional) |

### 4. Generate Domain

Railway Dashboard → Service → Settings → Networking → **Generate Domain**

### 5. Akses

- Dashboard: `https://your-project.up.railway.app/dashboard`
- API: `https://your-project.up.railway.app/v1`

---

## CLI Configuration

```bash
# Claude Code
export ANTHROPIC_API_BASE="https://your-project.up.railway.app/v1"
export ANTHROPIC_API_KEY="sk_your_key"

# Cursor
# Base URL: https://your-project.up.railway.app/v1
```

---

## Troubleshooting

| Error | Solusi |
|-------|--------|
| Build gagal (Dockerfile) | Railway pakai Dockerfile otomatis. Cek `railway.json`. |
| "Not Found" | Service belum di-expose. Generate domain di Settings. |
| Port error | Railway set PORT otomatis. Jangan hardcode. |
