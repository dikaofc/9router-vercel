# 🚀 Deploy 9Router to Railway — Free Hosting

## Kenapa Railway?

- ✅ **Free** ($5/month credit — cukup untuk app kecil, auto-sleep kalau idle)
- ✅ **Auto-deploy** dari GitHub (push to deploy)
- ✅ **HTTPS** otomatis
- ✅ **Custom domain** gratis
- ✅ **Persistent process** (beda dari Vercel serverless — bisa run MITM, token refresh, dll)
- ✅ **Docker support** — pakai Dockerfile yang sudah ada
- ✅ **SQLite persistence** — data survive restart (unlike Vercel cold start)

## ⚠️ Feature Support

| Feature | Status | Notes |
|---------|--------|-------|
| API Proxy (/v1) | ✅ Works | Core functionality |
| Dashboard | ✅ Works | UI berjalan normal |
| Provider Connections | ✅ Persistent | SQLite persist di disk |
| OAuth Login | ✅ Works | Persistent process |
| Token Refresh | ✅ Works | Background job jalan |
| MITM/TLS | ✅ Works | Persistent process |
| Cloudflare Tunnel | ✅ Works | Bisa install di container |
| SAML SSO | ✅ Works | Full support |
| File Persistence | ✅ SQLite | Native file persistence |

## 📋 Setup Instructions

### 1. Fork/Push to GitHub

```bash
git clone https://github.com/YOUR_USERNAME/9router.git
cd 9router
git push origin main
```

### 2. Connect to Railway

1. Buka https://railway.com/new
2. Login with GitHub
3. Click **"Deploy from GitHub Repo"**
4. Pilih repository `YOUR_USERNAME/9router`
5. Railway akan auto-detect Node.js project

### 3. Set Environment Variables

Buka Railway Dashboard → Project → Service → Variables

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
| `PROVIDER_GROQ_API_KEY` | `your-groq-key` |
| `PROVIDER_KIMI_API_KEY` | `your-kimi-key` |
| `PROVIDER_OPENAI_API_KEY` | `your-openai-key` |
| `PROVIDER_ANTHROPIC_API_KEY` | `your-anthropic-key` |

**Or use generic provider:**

| Variable | Value |
|----------|-------|
| `PROVIDER_NAME` | `openai` |
| `PROVIDER_API_KEY` | `sk-xxxx` |

**Optional — Persistence (Redis/Upstash untuk cloud sync):**

| Variable | Value | Notes |
|----------|-------|-------|
| `UPSTASH_REDIS_REST_URL` | `https://xxx.upstash.io` | Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | `xxx` | Upstash Redis |

### 4. Deploy

Click **Deploy** atau push ke main branch. Railway akan auto-build & deploy.

### 5. Use It

Dashboard: `https://your-project.up.railway.app/dashboard`
API Endpoint: `https://your-project.up.railway.app/v1`

## 🔧 Configure CLI Tools

### Claude Code

```bash
export ANTHROPIC_API_BASE="https://your-project.up.railway.app/v1"
export ANTHROPIC_API_KEY="sk_your_api_key"
claude --model cc/claude-opus-4-7
```

### Codex CLI

```bash
export OPENAI_BASE_URL="https://your-project.up.railway.app"
export OPENAI_API_KEY="sk_your_api_key"
codex "your prompt"
```

### Cursor IDE

```
Settings → Models → Advanced:
  OpenAI API Base URL: https://your-project.up.railway.app/v1
  OpenAI API Key: sk_your_api_key
  Model: cc/claude-opus-4-7
```

### Cline / Continue / RooCode

```
Provider: OpenAI Compatible
Base URL: https://your-project.up.railway.app/v1
API Key: sk_your_api_key
Model: cc/claude-opus-4-7
```

## 🐛 Troubleshooting

### "No active credentials for provider"
Pastikan kamu sudah set `PROVIDER_*_API_KEY` environment variables di Railway.

### "Unauthorized" error
Pastikan `API_KEY_SECRET` sudah di-set dan kamu pakai key yang sama di CLI tool.

### Build fails
Cek build logs di Railway Dashboard → Deployments → Logs.

### Container restarts
Railway free tier punya memory limit 512MB. Kalau crash karena OOM, kurangi `NODE_OPTIONS` atau upgrade plan.

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
   - Railway Dashboard → Settings → Networking
   - Tambah custom domain gratis

---

## ⚙️ Railway Build & Runtime Notes

- **Nixpacks**: Railway menggunakan Nixpacks untuk build. Nixpacks auto-detect Node.js dari `package.json` dan menjalankan `npm run build` lalu start command dari `railway.toml`.
- **Docker**: Railway juga support Dockerfile. Project ini sudah punya `Dockerfile` yang optimized — Railway akan auto-detect dan pakai Docker build.
- **Persistent process**: Beda dari Vercel, Railway menjalankan process持续. MITM/TLS, token refresh, dan cloud sync semua berjalan normal.
- **SQLite persistence**: Data persist di disk container. Tapi kalau container restart/redeploy, data bisa hilang. Untuk persistence lebih baik, pakai Upstash Redis.
- **Memory**: Free tier = 512MB RAM. Railway sleep app yang idle untuk save resources.
- **PORT**: Railway otomatis set `PORT` env var. Script akan bind ke port yang benar.

## 💖 Credits

**9Router** by [decolua](https://github.com/decolua/9router) — open source AI router & token saver.
