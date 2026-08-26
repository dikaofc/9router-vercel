# 🚀 Deploy 9Router to Google Cloud Run — Free Hosting

## Kenapa Google Cloud Run?

- ✅ **Free** (2M requests/month, 360K GB-seconds compute free)
- ✅ **Docker support** — pakai Dockerfile yang sudah ada
- ✅ **Auto-scaling** — scale to zero kalau idle
- ✅ **HTTPS** otomatis
- ✅ **Custom domain** gratis
- ✅ **Global** — deploy ke region mana saja
- ✅ **Full Node.js** — tidak perlu rewrite

## ⚠️ Feature Support

| Feature | Status | Notes |
|---------|--------|-------|
| API Proxy (/v1) | ✅ Works | Core functionality |
| Dashboard | ✅ Works | UI berjalan normal |
| Provider Connections | ✅ Persistent | SQLite persist di disk |
| OAuth Login | ✅ Works | Persistent process |
| Token Refresh | ✅ Works | Background job jalan |
| MITM/TLS | ⚠️ Limited | Container restart bisa hilang data |
| Cloudflare Tunnel | ⚠️ Manual | Perlu install di container |
| SAML SSO | ✅ Works | Full support |
| File Persistence | ⚠️ Ephemeral | Disk hilang saat scale-to-zero |

## 📋 Setup Instructions

### 1. Install Google Cloud SDK

```bash
# macOS
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash

# Windows
# Download dari https://cloud.google.com/sdk/docs/install
```

### 2. Login & Set Project

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 3. Enable Cloud Run API

```bash
gcloud services enable run.googleapis.com
```

### 4. Build & Deploy

```bash
# Build image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/9router

# Deploy to Cloud Run
gcloud run deploy 9router \
  --image gcr.io/YOUR_PROJECT_ID/9router \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="JWT_SECRET=your-secret,INITIAL_PASSWORD=your-password" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

### 5. Use It

Dashboard: `https://your-project-xxxxx-uc.a.run.app/dashboard`
API Endpoint: `https://your-project-xxxxx-uc.a.run.app/v1`

## 🔧 Configure CLI Tools

### Claude Code

```bash
export ANTHROPIC_API_BASE="https://your-project-xxxxx-uc.a.run.app/v1"
export ANTHROPIC_API_KEY="sk_your_api_key"
claude --model cc/claude-opus-4-7
```

### Codex CLI

```bash
export OPENAI_BASE_URL="https://your-project-xxxxx-uc.a.run.app"
export OPENAI_API_KEY="sk_your_api_key"
codex "your prompt"
```

### Cursor IDE

```
Settings → Models → Advanced:
  OpenAI API Base URL: https://your-project-xxxxx-uc.a.run.app/v1
  OpenAI API Key: sk_your_api_key
  Model: cc/claude-opus-4-7
```

### Cline / Continue / RooCode

```
Provider: OpenAI Compatible
Base URL: https://your-project-xxxxx-uc.a.run.app/v1
API Key: sk_your_api_key
Model: cc/claude-opus-4-7
```

## 🐛 Troubleshooting

### "No active credentials for provider"
Pastikan kamu sudah set `PROVIDER_*_API_KEY` environment variables.

### "Unauthorized" error
Pastikan `API_KEY_SECRET` sudah di-set dan kamu pakai key yang sama di CLI tool.

### Build fails
Cek build logs di Google Cloud Console → Cloud Build.

### Scale to zero
Cloud Run auto-scale to zero saat idle. Cold start ~1-3 detik.
- Set `--min-instances 1` untuk keep warm (butuh billing)

### Memory limit
Default 512MB. Kalau crash karena OOM, upgrade ke 1GB.

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
   - Cloud Run → Domain Management → Add custom domain

---

## ⚙️ Google Cloud Run Build & Runtime Notes

- **Docker**: Cloud Run menjalankan Docker container. Project ini sudah punya `Dockerfile` yang optimized.
- **Build**: `gcloud builds submit` build image di Cloud Build.
- **Start**: `node custom-server.js` — persistent process dalam container.
- **Scale**: Auto-scale 0 → N berdasarkan traffic. Scale to zero = cold start.
- **Memory**: Default 512MB. Bisa upgrade ke 32GB.
- **CPU**: Default 1 vCPU. Bisa upgrade ke 8 vCPU.
- **PORT**: Cloud Run set `PORT=8080` secara default. Tapi Dockerfile sudah set `PORT=20128`.
- **Billing**: Free tier = 2M requests + 360K GB-seconds/bulan. Setelah itu bayar per usage.

## 💖 Credits

**9Router** by [decolua](https://github.com/decolua/9router) — open source AI router & token saver.
