# ▲ Deploy 9Router ke Vercel

> Gratis, auto-deploy dari GitHub, HTTPS otomatis.

## Yang Perlu Kamu Tahu

| Bisa | Gak Bisa |
|------|----------|
| API proxy (/v1) | Token refresh (butuh persistent process) |
| Dashboard | MITM/TLS proxy |
| Provider connections (dari env) | Cloudflare tunnel |
| OAuth login | SAML SSO |
| | File persistence (kecuali pakai Upstash) |

**Kesimpulan:** Vercel cocok untuk **API proxy + dashboard**. Kalau butuh fitur lengkap (MITM, token refresh), pakai Railway/VPS.

---

## Step-by-Step

### 1. Push ke GitHub

```bash
git clone https://github.com/YOUR_USERNAME/9router.git
cd 9router
git push origin main
```

### 2. Hubungkan ke Vercel

1. Buka https://vercel.com/new
2. Import repository kamu
3. Framework: **Next.js** (auto-detect)
4. Jangan ubah build settings (sudah di-handle `vercel.json`)

### 3. Set Environment Variables

Buka Vercel Dashboard → Project → Settings → Environment Variables

**Wajib:**

| Variabel | Value |
|----------|-------|
| `JWT_SECRET` | string random 32+ karakter |
| `INITIAL_PASSWORD` | password kamu |

**Opsional (API key):**

| Variabel | Value |
|----------|-------|
| `API_KEY_SECRET` | `sk_your_key` |
| `API_KEYS` | `sk-key1,sk-key2` |

**Opsional (persistence — biar data gak hilang cold start):**

| Variabel | Value |
|----------|-------|
| `UPSTASH_REDIS_REST_URL` | dari Upstash dashboard |
| `UPSTASH_REDIS_REST_TOKEN` | dari Upstash dashboard |

### 4. Deploy

Push ke main branch. Vercel auto-build & deploy.

### 5. Akses

- Dashboard: `https://project.vercel.app/dashboard`
- API: `https://project.vercel.app/v1`

---

## CLI Configuration

### Claude Code

```bash
export ANTHROPIC_API_BASE="https://project.vercel.app/v1"
export ANTHROPIC_API_KEY="sk_your_key"
claude --model cc/claude-opus-4-7
```

### Cursor

```
Settings → Models → Advanced:
  Base URL: https://project.vercel.app/v1
  API Key: sk_your_key
```

---

## Cold Start

Vercel free tier punya cold start ~1-3 detik. Untuk minimize:
- Pakai `PROVIDER_*_API_KEY` env vars (skip dashboard seeding)
- Pakai Upstash untuk persistence

---

## Troubleshooting

| Error | Solusi |
|-------|--------|
| "No active credentials" | Set `PROVIDER_*_API_KEY` di env vars |
| "Unauthorized" | Set `API_KEY_SECRET` dan pakai key yang sama |
| Dashboard kosong | Normal di cold start. Pakai env vars untuk persist. |
| Build gagal | Cek build logs di Vercel Dashboard |
