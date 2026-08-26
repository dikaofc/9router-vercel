<div align="center">

# ⚡ 9Router

### AI Gateway yang bikin coding murah & gak pernah stop.

<img src="./images/9router.png?1" alt="9Router" width="700"/>

[![npm](https://img.shields.io/npm/v/9router.svg)](https://www.npmjs.com/package/9router)
[![Docker](https://img.shields.io/docker/pulls/decolua/9router?logo=docker)](https://hub.docker.com/r/decolua/9router)
[![License](https://img.shields.io/npm/l/9router.svg)](https://github.com/decolua/9router/blob/main/LICENSE)

[Bahasa Indonesia](./i18n/README.id-ID.md) • [Português](./i18n/README.pt-BR.md) • [Tiếng Việt](./i18n/README.vi.md) • [中文](./i18n/README.zh-CN.md) • [日本語](./i18n/README.ja-JP.md) • [Русский](./i18n/README.ru.md) • [ไทย](./i18n/README.th.md) • [فارسی](./i18n/README.fa_IR.md) • [Español](./i18n/README.es.md) • [Français](./i18n/README.fr.md)

</div>

---

## Kenapa 9Router?

Kamu pakai Claude Code, Cursor, Codex, atau CLI AI lainnya? Berarti kamu **bakar token tiap kali coding**. Tool outputs kayak `git diff`, `grep`, `ls` — itu semua makan token.

**9Router = proxy antara kamu dan AI provider.** Dia:

- 🎯 **Compress tool outputs** — RTK auto-press content, hemat 20-40% token
- 🔄 **Auto-fallback** — Kalau provider A limit, lompat ke B, lalu C. Zero downtime.
- 💰 **Pakai model gratis** — 40+ provider, 100+ model. Banyak yang free tier.
- 🔑 **Multi-akun** — Round-robin antar akun per provider. Limit lebih banyak.
- 📊 **Track usage** — Dashboard lihat berapa token terpakai, berapa hemat.

```
Kamu → 9Router → OpenAI / Anthropic / Groq / DeepSeek / Gemini / dll
                  ↓
            RTK compress dulu
            Auto-fallback kalau limit
            Multi-akun round-robin
```

---

## ⚡ Quick Start (30 detik)

### Pakai npm (paling gampang)

```bash
npx 9router
```

Buka `http://localhost:20128/dashboard` → login → tambah provider → selesai.

### Pakai Docker

```bash
docker run -d -p 20128:20128 -e JWT_SECRET=rahasia -e INITIAL_PASSWORD=sandi123 decolua/9router
```

### Pakai CLI global

```bash
npm install -g 9router
9router
```

---

## 🌐 Deploy ke Cloud (Gratis!)

### 🆓 GRATIS, NO CC (recommended)

| Platform | Gratis? | Sleep? | Link |
|----------|---------|--------|------|
| 🎭 **Glitch** | ✅ Selamanya | ⚠️ 5min idle | [GLITCH.md](./GLITCH.md) |
| 🎮 **Replit** | ✅ Builder | ⚠️ Idle sleep | [REPLIT.md](./REPLIT.md) |
| ⚡ **Koyeb** | ✅ Nano gratis | ❌ Gak sleep | [KOYEB.md](./KOYEB.md) |
| 🚀 **Zeabur** | ✅ $5 credit | ❌ Gak sleep | [ZEABUR.md](./ZEABUR.md) |
| ▲ **Vercel** | ✅ 100GB/bulan | ❌ Serverless | [VERCEL.md](./VERCEL.md) |
| 🔷 **Netlify** | ✅ 100GB/bulan | ❌ Serverless | [NETLIFY.md](./NETLIFY.md) |

### 💳 BUTUH CC (trial/free tier)

| Platform | Gratis? | Sleep? | Link |
|----------|---------|--------|------|
| 🚂 Railway | ✅ $5 credit | ❌ Persistent | [RAILWAY.md](./RAILWAY.md) |
| 🌐 Render | ✅ 750 jam | ⚠️ 15min idle | [RENDER.md](./RENDER.md) |
| 🐳 Cloud Run | ✅ 2M req | ❌ Auto-scale | [CLOUDRUN.md](./CLOUDRUN.md) |

**Rekomendasi:** Koyeb/Zeabur (no CC, gak sleep) atau Glitch (paling gampang).

---

## 🔌 Cara Pakai dengan CLI Tools

### Claude Code

```bash
export ANTHROPIC_API_BASE="https://YOUR_DOMAIN/v1"
export ANTHROPIC_API_KEY="sk_your_key"
claude --model cc/claude-opus-4-7
```

### Cursor IDE

```
Settings → Models → Advanced:
  Base URL: https://YOUR_DOMAIN/v1
  API Key: sk_your_key
  Model: cc/claude-opus-4-7
```

### Codex CLI

```bash
export OPENAI_BASE_URL="https://YOUR_DOMAIN"
export OPENAI_API_KEY="sk_your_key"
codex "your prompt"
```

### Cline / Continue / RooCode

```
Provider: OpenAI Compatible
Base URL: https://YOUR_DOMAIN/v1
API Key: sk_your_key
```

---

## 🧠 Fitur Unggulan

### RTK Token Saver

Tool outputs (git diff, grep, find, ls, tree...) sering makan 30-50% token. RTK compress otomatis:

```
Tanpa RTK: 47K tokens → LLM
Dengan RTK: 28K tokens → LLM  (hemat 40%)
```

- Auto-detect tipe content
- Filter: git-diff, grep, find, ls, tree, dedup-log, smart-truncate
- Fail-open: kalau error, skip aja. Gak pernah break request.

### Auto-Fallback

```
Claude Opus (limit) → Claude Sonnet (limit) → DeepSeek (gratis) → Groq (gratis)
```

Setup sekali, jalan terus. Zero downtime.

### Multi-Akun

Punya 3 akun OpenAI? Round-robin otomatis. Limit per akun = 3x lebih banyak.

### Dashboard

- Monitor usage & token consumption
- Setup provider connections
- Buat model combos
- Toggle RTK on/off

---

## 🏗️ Platform Support

| Platform | Command | Memory | Notes |
|----------|---------|--------|-------|
| 💻 Localhost | `npx 9router` | Auto | Default |
| 🐳 Docker | `docker run decolua/9router` | Container | Multi-arch |
| ☁️ VPS | `npm run start:vps` | Auto | Systemd service |
| 🪟 Windows | `start-windows.bat` | Auto | Native |
| 📱 Termux | `npm run start:termux` | Low RAM | Android |
| 🚂 Railway | Push to deploy | Auto | Persistent |
| ▲ Vercel | Push to deploy | Serverless | Edge |
| 🔷 Netlify | Push to deploy | Serverless | Edge |
| 🌐 Render | Push to deploy | Auto | Free 750h |
| 🐳 Cloud Run | `gcloud run deploy` | Container | Auto-scale |
| 🎮 Replit | Import from GitHub | Auto | Browser |
| 🎭 Glitch | Import from GitHub | 200MB | Browser, paling gampang |
| ⚡ Koyeb | Push to deploy | 512MB | Docker/Node.js, gak sleep |
| 🚀 Zeabur | Push to deploy | Auto | Mirip Railway |

---

## 📁 Struktur Project

```
9router/
├── src/                    # Next.js app + dashboard
│   ├── app/               # Pages & API routes
│   ├── sse/               # SSE handlers (chat, completions)
│   ├── lib/               # DB, auth, utils
│   └── shared/            # Shared components
├── open-sse/              # Provider-agnostic routing engine
│   ├── handlers/          # Chat, embedding, image handlers
│   ├── executors/         # Per-provider upstream calls
│   ├── translator/        # Format translation (OpenAI ↔ Claude ↔ Gemini)
│   └── providers/         # Provider registry & config
├── cli/                   # npm package (9router CLI)
├── tests/                 # Vitest test suite
├── custom-server.js       # HTTP server wrapper (IP sanitization)
├── Dockerfile             # Docker build
└── next.config.mjs        # Next.js config
```

---

## 🔧 Environment Variables

```bash
# Wajib
JWT_SECRET=your-random-secret-min-32-chars
INITIAL_PASSWORD=your-password

# Opsional
API_KEY_SECRET=sk_your_api_key        # Untuk CLI auth
REQUIRE_API_KEY=true                   # Enforce API key
PORT=20128                            # Default port
DATA_DIR=/var/lib/9router             # Data directory

# Provider keys (tambah yang kamu punya)
PROVIDER_OPENAI_API_KEY=sk-...
PROVIDER_ANTHROPIC_API_KEY=sk-ant-...
PROVIDER_GROQ_API_KEY=gsk_...
PROVIDER_DEEPSEEK_API_KEY=sk-...

# Persistence (untuk Vercel/Netlify)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

Lihat `.env.example` untuk list lengkap.

---

## 🧪 Testing

```bash
# Install deps
npm install
cd tests && npm install

# Run all tests
npx vitest run

# Run single file
npx vitest run unit/capabilities.test.js
```

> Suite ini ~938 pass, ~64 fail pada plain checkout. Pakai `tests/__baseline__/verify-no-regression.mjs` untuk cek regression, bukan raw run.

---

## 📄 License

MIT — gratis dipakai, dimodif, dan didistribute.

---

## 🙏 Credits

Dibuat oleh [decolua](https://github.com/decolua/9router) & kontributor open source.

Kalau berguna, kasih ⭐ di GitHub ya!
