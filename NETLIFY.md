# 🚀 Deploy 9Router to Netlify — Free Hosting

## Kenapa Netlify?

- ✅ **Free** (Hobby plan: 100GB bandwidth/month)
- ✅ **Auto-deploy** dari GitHub (push to deploy)
- ✅ **HTTPS** otomatis
- ✅ **Custom domain** gratis
- ✅ **Serverless** — mirip Vercel, pakai `@netlify/plugin-nextjs`

## ⚠️ Feature Support

| Feature | Status | Notes |
|---------|--------|-------|
| API Proxy (/v1) | ✅ Works | Serverless functions |
| Dashboard | ✅ Works | UI berjalan normal |
| Provider Connections | ⚠️ Seeded from env | Setiap cold start re-seed |
| OAuth Login | ⚠️ Manual setup | Perlu configure callback URL |
| Token Refresh | ❌ Not supported | No persistent background process |
| MITM/TLS | ❌ Not supported | Need persistent process |
| Cloudflare Tunnel | ❌ Not supported | Netlify sudah punya domain sendiri |
| SAML SSO | ❌ Not supported | Local-only IdP flow blocked |
| File Persistence | ⚠️ Via env vars | Pakai Upstash/Redis untuk persist |

## 📋 Setup Instructions

### 1. Fork/Push to GitHub

```bash
git clone https://github.com/YOUR_USERNAME/9router.git
cd 9router
git push origin main
```

### 2. Connect to Netlify

1. Buka https://app.netlify.com
2. Login dengan GitHub
3. Click **"Add new site"** → **"Import an existing project"**
4. Select repository `YOUR_USERNAME/9router`
5. Build settings: Netlify akan auto-detect dari `netlify.toml`

### 3. Set Environment Variables

Buka Netlify Dashboard → Site → Build & Deploy → Environment

**Required:**

| Variable | Value | Notes |
|----------|-------|-------|
| `JWT_SECRET` | `your-random-string-min-32-chars` | Untuk session auth |
| `INITIAL_PASSWORD` | `your-secure-password` | Password dashboard |

**Optional — Persistence (survive cold starts):**

| Variable | Value | Notes |
|----------|-------|-------|
| `UPSTASH_REDIS_REST_URL` | `https://xxx.upstash.io` | Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | `xxx` | Upstash Redis |

**Optional — Provider API Keys (add yang kamu punya):**

| Variable | Value |
|----------|-------|
| `PROVIDER_GROQ_API_KEY` | `your-groq-key` |
| `PROVIDER_DEEPSEEK_API_KEY` | `your-deepseek-key` |
| `PROVIDER_OPENAI_API_KEY` | `your-openai-key` |
| `PROVIDER_ANTHROPIC_API_KEY` | `your-anthropic-key` |

### 4. Deploy

Click **"Deploy site"** atau push ke main branch. Netlify akan auto-build & deploy.

### 5. Use It

Dashboard: `https://your-project.netlify.app/dashboard`
API Endpoint: `https://your-project.netlify.app/v1`

## 🔧 Configure CLI Tools

### Claude Code

```bash
export ANTHROPIC_API_BASE="https://your-project.netlify.app/v1"
export ANTHROPIC_API_KEY="sk_your_api_key"
claude --model cc/claude-opus-4-7
```

### Cursor IDE

```
Settings → Models → Advanced:
  OpenAI API Base URL: https://your-project.netlify.app/v1
  OpenAI API Key: sk_your_api_key
  Model: cc/claude-opus-4-7
```

## 🐛 Troubleshooting

### Build fails — "Cannot find module @netlify/plugin-nextjs"
Netlify auto-install plugin saat build. Kalau gagal, tambah ke `package.json`:
```bash
npm install -D @netlify/plugin-nextjs
```

### "Function timeout"
Netlify free tier: 10 detik function timeout. Untuk streaming yang lama, pertimbangkan platform lain (Railway/Render).

### Cold start lambat
Normal untuk serverless. Setelah warm, response time normal.

### Dashboard kosong
State di-reset setiap cold start. Pakai env vars untuk persist config.

---

## ⚙️ Netlify Build & Runtime Notes

- **Plugin**: `@netlify/plugin-nextjs` handle SSR, API routes, rewrites, middleware.
- **Output**: Tidak pakai `output: "standalone"` — Netlify handle serverless routing sendiri.
- **Stateless**: Tidak ada persistent process. Cold start = re-seed dari env vars.
- **PORT**: Netlify handle routing. Tidak perlu set PORT.
- **Timeout**: Free tier = 10 detik function timeout.

## 💖 Credits

**9Router** by [decolua](https://github.com/decolua/9router) — open source AI router & token saver.
