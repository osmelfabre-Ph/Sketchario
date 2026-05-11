# Sketchario Premortem — Action Plan (2026-05-12)

## Fixed in code now

### 1. Upload storage made configurable

- `UPLOADS_DIR` is now read from env
- default remains `/app/uploads`
- backend warns at startup if `UPLOADS_DIR` is not explicitly configured

Why it matters:
- this unblocks Railway Volume or any mounted persistent path without more code changes

### 2. Instagram publish monitoring hook

- optional Sentry initialization added through `SENTRY_DSN`
- Instagram publish failures now emit an explicit Sentry error message if Sentry is configured
- queue worker loop exceptions also go to Sentry

### 3. Email resilience improved

- public email health endpoint added:
  - `GET /api/public/health/email`
- forgot-password uses the shared dispatcher
- current provider priority remains:
  - Resend first
  - SMTP fallback

### 4. CORS guardrails tightened

- wildcard origins are now rejected at startup helper level
- basic test coverage added

### 5. Retention groundwork added

- activity tracking now updates:
  - `users.last_active_at`
  - `activity_daily`
  - `activity_monthly`
- admin endpoint added:
  - `GET /api/admin/usage/summary`

### 6. Pinterest hidden behind feature flag

- `ENABLE_PINTEREST=false` hides Pinterest from available social platforms and OAuth config
- useful until publish flow is truly production-ready

### 7. Transactional links aligned to app host

- frontend base for reset-password now prefers `APP_URL`
- avoids mixing transactional flows with the marketing host by mistake

## Still requires console / infra work

### Railway persistent media

Must be done in Railway:

- attach a Volume
- set:

```env
UPLOADS_DIR=/data/uploads
```

or equivalent mounted path

Alternative:
- migrate media storage to Cloudflare R2 / S3

### Sentry activation

Code is ready, but still needs:

```env
SENTRY_DSN=...
SENTRY_TRACES_SAMPLE_RATE=0.0
APP_ENV=production
```

### Contact form production verification

Still needs a real manual test on:

- `https://www.sketchario.app`

### Meta App Review

Still manual and external.

## Suggested next deploy envs

```env
UPLOADS_DIR=/data/uploads
ENABLE_PINTEREST=false
APP_URL=https://app.sketchario.app
MARKETING_URL=https://www.sketchario.app
```

Optional:

```env
SENTRY_DSN=...
SENTRY_TRACES_SAMPLE_RATE=0.0
```

## Suggested next manual checks

1. test contact form in production
2. test reset-password in production
3. verify uploads survive a backend redeploy
4. trigger an Instagram publish failure intentionally and confirm Sentry alert
