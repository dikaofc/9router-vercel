# 🐳 Deploy 9Router ke Google Cloud Run

> Docker-based, auto-scale, free tier besar.

## Quick Start

```bash
# Login
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build & Deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/9router
gcloud run deploy 9router \
  --image gcr.io/YOUR_PROJECT_ID/9router \
  --allow-unauthenticated \
  --set-env-vars="JWT_SECRET=secret,INITIAL_PASSWORD=password" \
  --memory 512Mi
```

---

## Free Tier

- ✅ 2M request/bulan
- ✅ 360K GB-seconds compute
- ❌ Scale to zero (cold start ~1-3 detik)

---

## Akses

- Dashboard: `https://your-project-xxxxx-uc.a.run.app/dashboard`
- API: `https://your-project-xxxxx-uc.a.run.app/v1`
