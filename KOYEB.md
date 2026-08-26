# ⚡ Deploy 9Router ke Koyeb

> Free tier, no CC, Docker & Node.js support.

## Kenapa Koyeb?

| | Koyeb |
|--|-------|
| Gratis | ✅ Nano instance gratis selamanya |
| CC | ❌ Gak perlu |
| Sleep | ❌ Gak sleep (persistent) |
| Docker | ✅ Support |
| Region | ✅ Global (US, EU, Asia) |

---

## Setup (3 menit)

### Cara 1: Import GitHub (paling gampang)

1. Buka https://app.koyeb.com
2. Login GitHub
3. **"Create Service"** → **"Git"**
4. Pilih repo `9router-vercel`
5. Build: `npm install && npm run build`
6. Start: `node custom-server.js`
7. Set env vars → Deploy

### Cara 2: Docker

1. **"Create Service"** → **"Docker"**
2. Image: `decolua/9router` (dari Docker Hub)
3. Port: `20128`
4. Set env vars → Deploy

---

## Environment Variables

Koyeb Dashboard → Service → Environment

| Variabel | Value |
|----------|-------|
| `JWT_SECRET` | random string |
| `INITIAL_PASSWORD` | password |
| `PORT` | `8080` (Koyeb inject PORT otomatis) |

---

## Free Tier

- ✅ 1 Nano instance (512MB RAM, 0.1 CPU)
- ✅ 100 GB bandwidth/bulan
- ✅ Gak sleep
- ✅ Custom domain gratis

---

## Akses

- Dashboard: `https://your-app.koyeb.app/dashboard`
- API: `https://your-app.koyeb.app/v1`
