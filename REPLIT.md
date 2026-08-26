# 🚀 Deploy 9Router to Replit — Free Hosting

## Kenapa Replit?

- ✅ **Free** (Builder plan: cukup untuk coding + small apps)
- ✅ **Browser-based** — gak perlu install apapun
- ✅ **Auto-deploy** dari GitHub
- ✅ **HTTPS** otomatis
- ✅ **Custom domain** (opsional)
- ✅ **Always On** (paid plan, $7/bulan)

## ⚠️ Feature Support

| Feature | Status | Notes |
|---------|--------|-------|
| API Proxy (/v1) | ✅ Works | Core functionality |
| Dashboard | ✅ Works | UI berjalan normal |
| Provider Connections | ⚠️ Seeded from env | Setiap restart re-seed |
| OAuth Login | ⚠️ Manual setup | Perlu configure callback URL |
| Token Refresh | ⚠️ Limited | Tergantung plan |
| MITM/TLS | ❌ Not supported | Need persistent process |
| Cloudflare Tunnel | ❌ Not supported | Replit sudah punya domain |
| SAML SSO | ❌ Not supported | Local-only IdP flow blocked |
| File Persistence | ⚠️ Ephemeral | Data hilang saat restart |

## 📋 Setup Instructions

### 1. Fork/Push to GitHub

```bash
git clone https://github.com/YOUR_USERNAME/9router.git
cd 9router
git push origin main
```

### 2. Import to Replit

1. Buka https://replit.com
2. Login dengan GitHub
3. Click **"Create Repl"**
4. Tab **"Import from GitHub"**
5. Select repository `YOUR_USERNAME/9router`
6. Click **"Import from GitHub"**

### 3. Set Environment Variables

Buka Replit Dashboard → Secrets (🔒 icon di sidebar)

**Required:**

| Variable | Value | Notes |
|----------|-------|-------|
| `JWT_SECRET` | `your-random-string-min-32-chars` | Untuk session auth |
| `INITIAL_PASSWORD` | `your-secure-password` | Password dashboard |

**Optional — API Key:**

| Variable | Value | Notes |
|----------|-------|-------|
| `API_KEY_SECRET` | `sk_your_api_key` | Untuk authenticate CLI tools |

**Optional — Provider API Keys (add yang kamu punya):**

| Variable | Value |
|----------|-------|
| `PROVIDER_GROQ_API_KEY` | `your-groq-key` |
| `PROVIDER_DEEPSEEK_API_KEY` | `your-deepseek-key` |
| `PROVIDER_OPENAI_API_KEY` | `your-openai-key` |
| `PROVIDER_ANTHROPIC_API_KEY` | `your-anthropic-key` |

### 4. Run

Click **"Run"** di Replit. Replit akan:
1. Install dependencies (`npm install`)
2. Build (`npm run build`)
3. Start server (`node custom-server.js`)

### 5. Use It

Dashboard: `https://your-project.your-username.repl.co/dashboard`
API Endpoint: `https://your-project.your-username.repl.co/v1`

## 🔧 Configure CLI Tools

### Claude Code

```bash
export ANTHROPIC_API_BASE="https://your-project.your-username.repl.co/v1"
export ANTHROPIC_API_KEY="sk_your_api_key"
claude --model cc/claude-opus-4-7
```

### Cursor IDE

```
Settings → Models → Advanced:
  OpenAI API Base URL: https://your-project.your-username.repl.co/v1
  OpenAI API Key: sk_your_api_key
  Model: cc/claude-opus-4-7
```

## 🐛 Troubleshooting

### "Memory limit exceeded"
Replit free tier: 1GB RAM. Upgrade ke Hacker plan ($7/bulan) untuk 4GB.

### "Port already in use"
Replit auto-assign port. Pastikan `PORT` env var tidak di-set ke port tetap.

### Cold start lambat
Normal untuk Replit. Setelah warm, response time normal.

### Sleep setelah idle
Replit free tier sleep setelah beberapa menit idle. Always On (paid) untuk keep alive.

---

## ⚙️ Replit Build & Runtime Notes

- **Environment**: Replit pakai Nix untuk manage dependencies.
- **PORT**: Replit auto-assign port. Jangan hardcode PORT.
- **Disk**: Ephemeral — data hilang saat restart.
- **Always On**: Paid plan ($7/bulan) untuk keep alive 24/7.
- **GitHub Deploy**: Replit bisa auto-deploy dari GitHub repo.

## 💖 Credits

**9Router** by [decolua](https://github.com/decolua/9router) — open source AI router & token saver.
