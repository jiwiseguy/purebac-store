# PureBac — Deployment Runbook

Stack: **Railway** (Postgres + Medusa backend) · **Vercel** (Next.js storefront) ·
**Cloudflare R2** (file storage) · **Resend** (email) · domain **purebac.com**.

Order matters: GitHub → Railway (backend) → Vercel (storefront) → R2 + Resend → DNS.

---

## 0. Production secrets (generated — keep private)

```
JWT_SECRET=<generated, see chat>
COOKIE_SECRET=<generated, see chat>
AUTH_MFA_ENCRYPTION_KEY=<generated, see chat>
```

## 1. GitHub

Create an empty repo `purebac-store` under your account (no README/license), then
the code is pushed from local:

```
git remote add origin https://github.com/<you>/purebac-store.git
git push -u origin main
```

## 2. Railway — Postgres + backend

1. New Project → Deploy from GitHub repo → select `purebac-store`.
2. Service **Root Directory** = `apps/backend` (railway.json there handles build/start/migrate).
3. Add a **PostgreSQL** database to the project (sets `DATABASE_URL`).
4. (Optional) Add **Redis** and set `REDIS_URL`.
5. Service → Variables — set:

```
JWT_SECRET=...
COOKIE_SECRET=...
AUTH_MFA_ENCRYPTION_KEY=...
STORE_CORS=https://purebac.com,https://www.purebac.com
ADMIN_CORS=https://<railway-backend-domain>
AUTH_CORS=https://purebac.com,https://www.purebac.com,https://<railway-backend-domain>
FROM_EMAIL=PureBac <orders@purebac.com>
RESEND_API_KEY=        # from step 4
R2_PUBLIC_URL=         # from step 4
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=
```

6. After first deploy, run the catalog seed + create admin (Railway shell or `railway run`):

```
cd .medusa/server && npx medusa exec ./src/scripts/seed-products.ts
npx medusa user -e admin@purebac.com -p <password>
```

7. Create a **publishable API key** in admin (Settings → Publishable API Keys),
   link it to the default sales channel → use it in Vercel (step 3).

## 3. Vercel — storefront

1. Import `purebac-store`, **Root Directory** = `apps/storefront`.
2. Environment variables:

```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...        # from step 2.7
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://<railway-backend-domain>
NEXT_PUBLIC_DEFAULT_REGION=us
NEXT_PUBLIC_BASE_URL=https://purebac.com
```

3. Deploy. Add `purebac.com` + `www.purebac.com` as Vercel domains.

## 4. Cloudflare R2 (fresh account) + Resend (fresh account)

**R2:** create bucket `purebac-files`, enable public access (or a public r2.dev URL /
custom domain), create an API token (Access Key + Secret). Fill the `R2_*` vars in
Railway. `R2_ENDPOINT = https://<accountid>.r2.cloudflarestorage.com`.

**Resend:** add & verify sending domain `purebac.com` (DNS records below), create an
API key → `RESEND_API_KEY` in Railway. Sender `orders@purebac.com`.

## 5. DNS on purebac.com

- `@`  → Vercel (A `76.76.21.21`) and `www` → `cname.vercel-dns.com` (Vercel shows exact).
- Resend domain-verification records (SPF/DKIM/DMARC) — copy from Resend dashboard.
- Optional: `api.purebac.com` CNAME → Railway backend domain (then update the
  `*_CORS` and `NEXT_PUBLIC_MEDUSA_BACKEND_URL` to the custom domain).

## 6. Smoke test

- `https://<railway-backend-domain>/health` → 200
- Storefront loads, products show, add-to-cart → checkout (Zelle) completes
- Place a test order → confirm Resend email arrives
