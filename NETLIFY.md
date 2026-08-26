# 🚀 Deploy 9Router to Netlify — Free Hosting

## Kenapa Netlify?

- ✅ **Free** (Hobby plan: 100GB bandwidth/month, 125K function invocations)
- ✅ **Auto-deploy** dari GitHub (push to deploy)
- ✅ **HTTPS** otomatis
- ✅ **Custom domain** gratis
- ✅ **Edge functions** global
- ✅ **Serverless** — mirip Vercel

## ⚠️ Feature Support

| Feature | Status | Notes |
|---------|--------|-------|
| API Proxy (/v1) | ✅ Works | Core functionality via edge functions |
| Dashboard | ✅ Works | UI berjalan normal |
| Provider Connections | ⚠️ Seeded from env | Setiap cold start re-seed |
| OAuth Login | ⚠️ Manual setup | Perlu configure callback URL |
| Token Refresh | ❌ Not supported | No persistent background process |
| MITM/TLS | ❌ Not supported | Need persistent process |
| Cloudflare Tunnel | ❌ Not supported | Netlify sudah punya domain sendiri |
| SAML SSO | ❌ Not supported | Local-only IdP flow blocked on Netlify |
| File Persistence | ⚠️ Via env vars | Pakai env vars untuk persist config |

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
5. Build settings akan auto-detect (sudah ada di `netlify.toml`)

### 3. Set Environment Variables

Buka Netlify Dashboard → Site → Build & Deploy → Environment

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

### Codex CLI

```bash
export OPENAI_BASE_URL="https://your-project.netlify.app"
export OPENAI_API_KEY="sk_your_api_key"
codex "your prompt"
```

### Cursor IDE

```
Settings → Models → Advanced:
  OpenAI API Base URL: https://your-project.netlify.app/v1
  OpenAI API Key: sk_your_api_key
  Model: cc/claude-opus-4-7
```

### Cline / Continue / RooCode

```
Provider: OpenAI Compatible
Base URL: https://your-project.netlify.app/v1
API Key: sk_your_api_key
Model: cc/claude-opus-4-7
```

## 🐛 Troubleshooting

### "No active credentials for provider"
Pastikan kamu sudah set `PROVIDER_*_API_KEY` environment variables di Netlify.

### "Unauthorized" error
Pastikan `API_KEY_SECRET` sudah di-set dan kamu pakai key yang sama di CLI tool.

### Build fails
Cek build logs di Netlify Dashboard → Deploys → Logs.

### Function timeout
Netlify free tier punya function timeout 10 detik. Untuk streaming, pakai edge functions.

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
   - Netlify Dashboard → Domain Management

---

## ⚙️ Netlify Build & Runtime Notes

- **Build**: Netlify menjalankan `npm run build` saat deploy.
- **Functions**: Serverless functions untuk API routes. Edge functions untuk `/v1/*`.
- **Timeout**: Free tier = 10 detik function timeout. Edge functions lebih cepat.
- **Cold start**: Serverless functions punya cold start ~1-3 detik.
- **State**: Stateless — pakai env vars untuk persist config.
- **PORT**: Netlify handle routing sendiri. Tidak perlu set PORT.

## 💖 Credits

**9Router** by [decolua](https://github.com/decolua/9router) — open source AI router & token saver.
