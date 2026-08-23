# 🚀 Deploy 9Router to Vercel — Free Hosting

## Kenapa Vercel?

- ✅ **Free** (Hobby plan: 100GB bandwidth/month)
- ✅ **Auto-deploy** dari GitHub (push to deploy)
- ✅ **HTTPS** otomatis
- ✅ **Custom domain** gratis
- ✅ **Cross-platform** (Windows, Linux, macOS, Android — works everywhere via native `fetch()`)
- ⚠️ **State reset** pada cold start (but Vercel KV / Supabase persistence supported)

## ⚠️ Feature Support

| Feature | Status | Notes |
|---------|--------|-------|
| API Proxy (/v1) | ✅ Works | Core functionality |
| Dashboard | ✅ Works | UI berjalan normal |
| Provider Connections | ⚠️ Seeded from env | Setiap cold start re-seed |
| OAuth Login | ⚠️ Manual setup | Perlu configure callback URL |
| Token Refresh | ❌ Not supported | No persistent background process |
| MITM/TLS | ❌ Not supported | Need persistent process |
| Cloudflare Tunnel | ❌ Not supported | Vercel sudah punya domain sendiri |
| SAML SSO | ❌ Not supported | Local-only IdP flow blocked on Vercel |
| File Persistence | ✅ Via KV/Supabase | Use Vercel KV or Supabase for persistence |

## 📋 Setup Instructions

### 1. Fork/Push to GitHub

```bash
git clone https://github.com/YOUR_USERNAME/9router-vercel.git
cd 9router-vercel
git push origin main
```

### 2. Connect to Vercel

1. Buka https://vercel.com/new
2. Import repository `YOUR_USERNAME/9router-vercel`
3. Framework: **Next.js** (auto-detected)
4. Don't change build settings (sudah ada di vercel.json)

### 3. Set Environment Variables

Buka Vercel Dashboard → Project → Settings → Environment Variables

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

**Optional — Persistence (survives cold starts):**

| Variable | Value | Notes |
|----------|-------|-------|
| `KV_REST_API_URL` | `https://xxx.kv.vercel-storage.com` | Vercel KV |
| `KV_REST_API_TOKEN` | `xxx` | Vercel KV |
| `UPSTASH_REDIS_REST_URL` | `https://xxx.upstash.io` | Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | `xxx` | Upstash Redis |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | `xxx` | Supabase (service role) |

### 4. Deploy

Klik **Deploy** atau push ke main branch. Vercel akan auto-build & deploy.

### 5. Use It

Dashboard: `https://your-project.vercel.app/dashboard`
API Endpoint: `https://your-project.vercel.app/v1`

## 🔧 Configure CLI Tools

### Claude Code

```bash
export ANTHROPIC_API_BASE="https://your-project.vercel.app/v1"
export ANTHROPIC_API_KEY="sk_your_api_key"
claude --model cc/claude-opus-4-7
```

### Codex CLI

```bash
export OPENAI_BASE_URL="https://your-project.vercel.app"
export OPENAI_API_KEY="sk_your_api_key"
codex "your prompt"
```

### Cursor IDE

```
Settings → Models → Advanced:
  OpenAI API Base URL: https://your-project.vercel.app/v1
  OpenAI API Key: sk_your_api_key
  Model: cc/claude-opus-4-7
```

### Cline / Continue / RooCode

```
Provider: OpenAI Compatible
Base URL: https://your-project.vercel.app/v1
API Key: sk_your_api_key
Model: cc/claude-opus-4-7
```

## 🐛 Troubleshooting

### "No active credentials for provider"
Pastikan kamu sudah set `PROVIDER_*_API_KEY` environment variables di Vercel.

### "Unauthorized" error
Pastikan `API_KEY_SECRET` sudah di-set dan kamu pakai key yang sama di CLI tool.

### Dashboard shows empty
Ini normal karena state di-reset setiap cold start. Provider connections di-seed dari env vars.
Untuk persistence, gunakan Vercel KV atau Supabase.

### Build fails
Cek build logs di Vercel Dashboard → Deployments → Logs.

## 🔄 State Persistence

Untuk persist state antar cold start:

1. **Pakai env vars** untuk semua provider connections (recommended)
2. **Pakai Vercel KV** (Redis) untuk persist — auto-injects on Vercel
3. **Pakai Supabase** — free tier tersedia, auto-persist DB blob

## 📊 Cold Start

Vercel free tier punya cold start ~1-3 detik. Setelah warm, response time normal.

Untuk minimize cold start:
- Pakai `PROVIDER_*_API_KEY` env vars (skip dashboard seeding)
- Dashboard yang jarang diakses akan cold start lebih lama

## 🔐 Security Notes

- **Dashboard auth**: Login pakai password yang di-set di `INITIAL_PASSWORD`
- **API auth**: Pakai `API_KEY_SECRET` sebagai Bearer token
- **No HTTPS needed**: Vercel handle SSL otomatis
- **No CORS issues**: Vercel handle CORS untuk domain kamu

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

---

## ⚙️ Vercel Build & Runtime Notes

- **Function timeout**: streaming routes (`/v1/chat/completions`, `/v1/responses`, `/v1/messages`, `/v1beta/models`, `/v1beta/models/[...path]`) set `export const maxDuration = 60` — the **Hobby plan** cap (2 akun standard, bukan Pro). On a **Pro** plan you can raise this to `300` in those 5 route files and in `vercel.json` (`functions` → `maxDuration`).
- **Local-only features are blocked on Vercel** (return `403`): MITM/TLS proxy, Cloudflare/Tailscale tunnel, headroom proxy, SAML SSO IdP flow, and the cursor/kiro auto-import flows. They need a persistent process / local filesystem that the serverless runtime does not provide.
- **Optional dependencies**: `node-forge` (MITM cert gen) and `@node-saml/node-saml` (SAML SSO) are `optionalDependencies` + externalized — they are not bundled into the serverless function, keeping the deploy light, while still installing for self-hosted/Termux use.
- **OAuth browser open is skipped on Vercel**: the 6 OAuth services now print the auth URL instead of spawning a local browser (no display on the serverless runtime). On self-host/Termux they still try to open a browser and fall back to printing the URL if none is available.
- **Termux / Android**: the CLI auto-detects Termux and skips the native `better-sqlite3` compile, falling back to the pure-JS `sql.js` driver. Self-hosted Linux/macOS/Windows keep `better-sqlite3` for speed when build tools are present.
- **Lighter build**: `next.config.mjs` uses `output: "standalone"` + `serverExternalPackages` to keep the function zip small. Dead deps (`express`, `http-proxy-middleware`, `selfsigned`) were already removed; `gitbook/` docs are excluded from the build.

## 💖 Credits

**9Router** by [decolua](https://github.com/decolua/9router) — open source AI router & token saver.
