# 🚀 Deploy 9Router to Render — Free Hosting

## Kenapa Render?

- ✅ **Free** (Free tier: 750 hours/bulan — cukup untuk 1 service)
- ✅ **Auto-deploy** dari GitHub (push to deploy)
- ✅ **HTTPS** otomatis
- ✅ **Custom domain** gratis
- ✅ **Persistent process** (beda dari Vercel serverless)
- ✅ **Node.js native** — tidak perlu rewrite
- ✅ **SQLite persistence** via `/tmp` (survive dalam session)

## ⚠️ Feature Support

| Feature | Status | Notes |
|---------|--------|-------|
| API Proxy (/v1) | ✅ Works | Core functionality |
| Dashboard | ✅ Works | UI berjalan normal |
| Provider Connections | ✅ Persistent | SQLite persist di disk |
| OAuth Login | ✅ Works | Persistent process |
| Token Refresh | ✅ Works | Background job jalan |
| MITM/TLS | ⚠️ Limited | Persistent process, tapi /tmp ephemeral |
| Cloudflare Tunnel | ⚠️ Manual | Perlu install di container |
| SAML SSO | ✅ Works | Full support |
| File Persistence | ⚠️ Ephemeral | /tmp hilang saat restart |

## 📋 Setup Instructions

### 1. Fork/Push to GitHub

```bash
git clone https://github.com/YOUR_USERNAME/9router.git
cd 9router
git push origin main
```

### 2. Connect to Render

1. Buka https://dashboard.render.com
2. Login dengan GitHub
3. Click **"New"** → **"Web Service"**
4. Select repository `YOUR_USERNAME/9router`
5. Render akan auto-detect Node.js project

### 3. Configure Service

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
node custom-server.js
```

**Environment:** `Node`

### 4. Set Environment Variables

Buka Render Dashboard → Service → Environment

**Required:**

| Variable | Value | Notes |
|----------|-------|-------|
| `JWT_SECRET` | `your-random-string-min-32-chars` | Untuk session auth |
| `INITIAL_PASSWORD` | `your-secure-password` | Password dashboard |

**Optional — API Key:**

| Variable | Value | Notes |
|----------|-------|-------|
| `API_KEY_SECRET` | `sk_your_api_key` | Untuk authenticate CLI tools |
| `API_KEYS` | `sk-key1,sk-key2` | Multiple API keys (comma-separated) |

**Optional — Provider API Keys (add yang kamu punya):**

| Variable | Value |
|----------|-------|
| `PROVIDER_GLM_API_KEY` | `your-zhipu-key` |
| `PROVIDER_MINIMAX_API_KEY` | `your-minimax-key` |
| `PROVIDER_DEEPSEEK_API_KEY` | `your-deepseek-key` |
| `PROVIDER_GROQ_API_KEY` | `your-grokey` |
| `PROVIDER_KIMI_API_KEY` | `your-kimi-key` |
| `PROVIDER_OPENAI_API_KEY` | `your-openai-key` |
| `PROVIDER_ANTHROPIC_API_KEY` | `your-anthropic-key` |

**Or use generic provider:**

| Variable | Value |
|----------|-------|
| `PROVIDER_NAME` | `openai` |
| `PROVIDER_API_KEY` | `sk-xxxx` |

### 5. Deploy

Click **"Create Web Service"** atau push ke main branch. Render akan auto-build & deploy.

### 6. Use It

Dashboard: `https://your-project.onrender.com/dashboard`
API Endpoint: `https://your-project.onrender.com/v1`

## 🔧 Configure CLI Tools

### Claude Code

```bash
export ANTHROPIC_API_BASE="https://your-project.onrender.com/v1"
export ANTHROPIC_API_KEY="sk_your_api_key"
claude --model cc/claude-opus-4-7
```

### Codex CLI

```bash
export OPENAI_BASE_URL="https://your-project.onrender.com"
export OPENAI_API_KEY="sk_your_api_key"
codex "your prompt"
```

### Cursor IDE

```
Settings → Models → Advanced:
  OpenAI API Base URL: https://your-project.onrender.com/v1
  OpenAI API Key: sk_your_api_key
  Model: cc/claude-opus-4-7
```

### Cline / Continue / RooCode

```
Provider: OpenAI Compatible
Base URL: https://your-project.onrender.com/v1
API Key: sk_your_api_key
Model: cc/claude-opus-4-7
```

## 🐛 Troubleshooting

### "No active credentials for provider"
Pastikan kamu sudah set `PROVIDER_*_API_KEY` environment variables di Render.

### "Unauthorized" error
Pastikan `API_KEY_SECRET` sudah di-set dan kamu pakai key yang sama di CLI tool.

### Build fails
Cek build logs di Render Dashboard → Logs.

### Sleep setelah idle
Render free tier sleep setelah 15 menit idle. Cold start bisa 30-60 detik.
- Upgrade ke Starter plan ($7/month) untuk keep alive
- Atau pakai cron job untuk ping setiap 14 menit

### Container restarts
Render free tier punya memory limit 512MB. Kalau crash karena OOM, upgrade plan.

## 💡 Tips

1. **Gunakan combo model** untuk auto-fallback:
   - Buat combo di dashboard
   - Pakai nama combo sebagai model name

2. **Monitor usage** di dashboard:
   - `/dashboard` → Usage tab
   - Track token consumption

3. **Add multiple providers** untuk redundancy:
   - Set lebih dari 1 `PROVIDER_*_API_KEY`
   - Auto-fallback kalau salah satu down

4. **Custom domain** (opsional):
   - Render Dashboard → Settings → Custom Domains

---

## ⚙️ Render Build & Runtime Notes

- **Build**: Render menjalankan `npm install && npm run build` saat deploy.
- **Start**: `node custom-server.js` — persistent process, bukan serverless.
- **Sleep**: Free tier sleep setelah 15 menit idle. Cold start 30-60 detik.
- **Memory**: Free tier = 512MB RAM. Upgrade ke Starter untuk lebih.
- **Disk**: `/tmp` ephemeral — data hilang saat restart. Pakai env vars untuk persist config.
- **PORT**: Render otomatis set `PORT` env var. Script akan bind ke port yang benar.

## 💖 Credits

**9Router** by [decolua](https://github.com/decolua/9router) — open source AI router & token saver.
