# 🌐 Deploy 9Router ke Render

> Node.js native, free tier 750 jam/bulan.
>
> ⚠️ **BUTUH KARTU KREDIT** untuk bikin service.

## Quick Start

1. Buka https://dashboard.render.com
2. **New** → **Web Service**
3. Import GitHub repo
4. Isi:
   - **Build:** `npm install && npm run build`
   - **Start:** `node custom-server.js`
5. Set env vars → Deploy

---

## Environment Variables

| Variabel | Value |
|----------|-------|
| `JWT_SECRET` | random string |
| `INITIAL_PASSWORD` | password |
| `NODE_ENV` | production |

---

## Free Tier

- ✅ 750 jam/bulan
- ⚠️ Sleep setelah 15 menit idle
- ⚠️ Cold start 30-60 detik
- 💰 Starter plan ($7/bulan) → gak sleep

---

## Akses

- Dashboard: `https://your-project.onrender.com/dashboard`
- API: `https://your-project.onrender.com/v1`
