# 🐳 Docker Deployment

> Satu perintah, langsung jalan. Multi-arch (amd64/arm64).

## Quick Start

```bash
docker run -d \
  --name 9router \
  -p 20128:20128 \
  -e JWT_SECRET=your-secret-here \
  -e INITIAL_PASSWORD=your-password \
  -v 9router-data:/app/data \
  decolua/9router
```

Buka `http://localhost:20128/dashboard`

---

## Docker Compose

```yaml
version: '3.8'
services:
  router:
    image: decolua/9router
    ports:
      - "20128:20128"
    environment:
      - JWT_SECRET=your-secret-here
      - INITIAL_PASSWORD=your-password
      - NODE_ENV=production
    volumes:
      - 9router-data:/app/data
    restart: unless-stopped

volumes:
  9router-data:
```

```bash
docker compose up -d
```

---

## Build dari Source

```bash
git clone https://github.com/decolua/9router.git
cd 9router
docker build -t 9router .
docker run -d -p 20128:20128 \
  -e JWT_SECRET=secret \
  -e INITIAL_PASSWORD=password \
  9router
```

---

## Environment Variables

| Variabel | Default | Deskripsi |
|----------|---------|-----------|
| `PORT` | 20128 | Port server |
| `HOSTNAME` | 0.0.0.0 | Bind address |
| `JWT_SECRET` | - | Secret untuk session cookie |
| `INITIAL_PASSWORD` | 123456 | Password dashboard |
| `DATA_DIR` | /app/data | Direktori data |
| `NODE_ENV` | production | Environment |

---

## Persistent Data

Data disimpan di `/app/data` (SQLite). Pakai volume supaya survive restart:

```bash
docker run -d -p 20128:20128 \
  -v /path/to/data:/app/data \
  -e JWT_SECRET=secret \
  -e INITIAL_PASSWORD=password \
  decolua/9router
```

---

## Multi-Arch

Docker image tersedia untuk:
- `linux/amd64` (Intel/AMD)
- `linux/arm64` (Apple Silicon, ARM server)

Docker auto-pull arch yang sesuai.
