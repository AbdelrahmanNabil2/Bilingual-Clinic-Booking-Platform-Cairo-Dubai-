# Clinic Website — Full Project

Full-stack bilingual (EN/AR) clinic website (Next.js, Node/Express, PostgreSQL) with timezone-aware per-doctor scheduling, waitlists, Stripe deposits, and Twilio SMS/WhatsApp reminders; role-based admin panel with TOTP 2FA and DB-level double-booking prevention, covered by CI-tested integration tests.

A bilingual (English/Arabic) clinic platform with two locations — **Cairo, Egypt** and **Dubai, UAE**. Covers the public site, news, a full appointment booking system (per-doctor scheduling, deposits, SMS/email/WhatsApp, waitlists, self-service reschedule/cancel), and an admin panel with roles, 2FA, and file uploads. Specialty copy is left generic/placeholder — update it once finalized.

```
clinic-website/
├── frontend/                  Next.js 14 (App Router) + Tailwind — public site + /admin
├── backend/                   Node.js + Express + PostgreSQL — content, booking, admin API
├── .github/workflows/         CI — backend tests (real Postgres) + frontend build
├── docker-compose.yml         PostgreSQL 16 only — no manual Postgres install needed
├── try-locally.sh             One-command local setup using Docker
└── try-locally-no-docker.sh   Same, but auto-detects a local PostgreSQL install
```

Optional paid integrations (Stripe, Twilio, SMTP) are fully wired and degrade gracefully when unset — booking and admin actions are never blocked by missing credentials.

---

## Table of contents

1. [Try it locally](#1-try-it-locally)
2. [Manual quick start](#2-manual-quick-start)
3. [Architecture](#3-architecture)
4. [Public site](#4-public-site)
5. [Booking system](#5-booking-system)
6. [Admin panel](#6-admin-panel)
7. [Backend API](#7-backend-api)
8. [Database](#8-database)
9. [Auth, roles & 2FA](#9-auth-roles--2fa)
10. [Integrations](#10-integrations)
11. [Environment variables](#11-environment-variables)
12. [Scripts & Docker](#12-scripts--docker)
13. [i18n](#13-i18n)
14. [SEO & analytics](#14-seo--analytics)
15. [Security](#15-security)
16. [Testing & CI](#16-testing--ci)
17. [Deployment](#17-deployment)
18. [Known limitations](#18-known-limitations)
19. [Production checklist](#19-production-checklist)

---

## 1. Try it locally

**With Docker** (starts Postgres in a container):

```bash
./try-locally.sh
```

**Without Docker** (uses a local PostgreSQL install, or walks you through installing one):

```bash
./try-locally-no-docker.sh
```

Then start both servers in separate terminals:

```bash
cd backend  && npm run dev     # http://localhost:4000
cd frontend && npm run dev     # http://localhost:3000
```

- Public site: **http://localhost:3000** (redirects to `/en`)
- Admin panel: **http://localhost:3000/admin/login**

The script prints generated admin credentials at the end. With the try-locally scripts, the seeded password is typically `LocalDev123` (check the script output).

`try-locally-no-docker.sh` suggests install commands for macOS (Homebrew), Ubuntu (apt), or Windows, and auto-detects common local Postgres logins (passwordless current user, or `postgres`/`postgres`).

---

## 2. Manual quick start

```bash
# Backend
cd backend
npm install
cp .env.example .env        # set DATABASE_URL, JWT_SECRET, ADMIN_SEED_*
npm run db:migrate
npm run db:seed
npm run dev                 # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                 # http://localhost:3000 → /en
```

Admin login uses `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` from `backend/.env`.

---

## 3. Architecture

| Layer | Stack |
|-------|--------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, Leaflet / react-leaflet |
| Backend | Node.js (CommonJS), Express 4, `pg` (no ORM), Luxon, node-cron |
| Database | PostgreSQL 16 |
| Auth | JWT access tokens + httpOnly refresh cookies, bcrypt, otplib TOTP |

**How they connect**

- Frontend calls `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api`) via `frontend/lib/api.js` (public) and `frontend/lib/adminApi.js` (admin, `credentials: 'include'`).
- Backend mounts routers under `/api/*` in `backend/src/app.js` and serves uploaded files at `/uploads`.
- CORS uses exact origins from `FRONTEND_ORIGIN` (comma-separated) with `credentials: true` — no wildcards with cookies.
- Default ports: frontend **3000**, API **4000**.

Bilingual content is stored as `_en` / `_ar` column pairs on content tables; the frontend picks the locale-appropriate field in `lib/api.js`.

---

## 4. Public site

Locale prefixes: `/en/...` and `/ar/...`. Paths without a locale redirect to `/en...`. `/admin` is excluded from locale routing.

| Route | Purpose |
|-------|---------|
| `/{locale}` | Home |
| `/{locale}/about` | About |
| `/{locale}/services` | Services |
| `/{locale}/doctors` | Doctors list |
| `/{locale}/doctors/[slug]` | Doctor profile |
| `/{locale}/locations` | Locations (+ Leaflet maps) |
| `/{locale}/news` | News list |
| `/{locale}/news/[slug]` | News article |
| `/{locale}/testimonials` | Testimonials + patient review form |
| `/{locale}/booking` | Book an appointment |
| `/{locale}/booking/manage/[token]` | Patient self-service manage / reschedule / cancel |
| `/{locale}/contact` | Contact form |
| `/{locale}/search` | Search news + services |
| `/{locale}/privacy` | Privacy policy (template) |
| `/{locale}/terms` | Terms of service (template) |

**Feature highlights**

- **Live CMS content** — home, about, services, locations, testimonials, and contact fetch from the API, falling back to `messages/*.json` if the backend is unreachable or empty.
- **News** — bilingual articles with admin-managed auto-generated slugs.
- **Doctors** — list + profile pages with photo, bio, and `Physician` JSON-LD.
- **Reviews** — submitted from Testimonials; held unpublished until an admin approves.
- **Newsletter** — footer signup on every page.
- **Maps** — OpenStreetMap / Leaflet (no Google Maps API key).
- **Analytics** — optional GA4 via `NEXT_PUBLIC_GA_ID` (omitted when unset).

---

## 5. Booking system

### Flow

1. Country selector (Egypt → Cairo, UAE → Dubai)
2. Optional doctor + service
3. Date → live available times from the API
4. Confirm → appointment is **auto-confirmed** (no manual approval step)
5. Confirmation email includes a manage link; optional SMS / WhatsApp if configured
6. If the day is full → patient can join the **waitlist**

### Per-doctor scheduling

Availability is computed per **location + doctor**. Two doctors at the same clinic can hold appointments at the same clock time; a single doctor cannot be double-booked. Bookings without a doctor treat the location itself as the bookable unit (still guarded against double-booking).

Slot generation:

- Weekly hours from `clinic_hours` (day of week 0 = Sunday … 6 = Saturday)
- Zero slots if a `clinic_closures` row exists for that date, or if the day is closed
- Past times for “today” are dropped using the location’s IANA timezone
- Default seed slot length: **30 minutes**

### Timezone awareness

Each location has an IANA timezone (`Africa/Cairo`, `Asia/Dubai`, editable in `/admin/locations`). Slot generation, same-day cutoffs, and “tomorrow” reminders use **Luxon** in the location’s timezone — not the server’s.

### Ad-hoc closures

Admins add one-off closures (holidays, etc.) at `/admin/closures`. Weekly `clinic_hours` are seeded/SQL-managed (no admin UI for weekly hours).

### Self-service manage link

Every booking gets a unique `manage_token`. Patients can view, reschedule, or cancel at:

`/{locale}/booking/manage/[token]`

No login required. Cancelling frees the slot and notifies the next waitlist entry.

### Waitlist

- Patients join for a location + date when the day is full.
- On cancel (patient or admin), the earliest un-notified waitlist entry is emailed and marked `notified_at`.

### Deposits (optional Stripe)

Set `deposit_cents` on a service in `/admin/services`. If Stripe is configured, the patient gets a Checkout link and the appointment shows `deposit_status: pending` until the webhook marks it `paid`. **If Stripe is not configured, booking still succeeds** and deposit collection is skipped (`not_required`).

### Reminders

Hourly cron (`node-cron`, started with the server) finds confirmed appointments for “tomorrow” in each location’s local time with `reminder_sent_at IS NULL`, sends email (+ SMS/WhatsApp if configured), then sets `reminder_sent_at` so runs are idempotent.

---

## 6. Admin panel

Lives at `/admin` (English-only, outside locale routing).

| Route | Feature |
|-------|---------|
| `/admin` | Dashboard (today’s appointments, confirmed count, news count) |
| `/admin/login` | Login |
| `/admin/reset-password/[token]` | Password reset |
| `/admin/appointments` | Filter by date / location / status / doctor; update status |
| `/admin/waitlist` | View waitlist |
| `/admin/newsletter` | Subscriber list |
| `/admin/news` (+ `/new`, `/[id]`) | News CRUD |
| `/admin/services`, `/doctors`, `/locations`, `/closures`, `/testimonials` | Config-driven CRUD (`lib/adminResources.js`) |
| `/admin/settings` | TOTP 2FA setup; admin-user management (admin role only) |

CRUD resources support bilingual fields, location pickers where relevant, and **image upload** to local disk served at `/uploads`.

### Roles

| Role | Capabilities |
|------|----------------|
| `staff` | View and edit content |
| `manager` | + delete content |
| `admin` | + manage other admin accounts |

Roles are enforced **server-side** on every request.

### Password reset

Login → “Forgot your password?” → emailed link → `/admin/reset-password/[token]`. Responses are generic whether or not the email exists (no account enumeration).

---

## 7. Backend API

Base URL: `http://localhost:4000/api` (or `NEXT_PUBLIC_API_URL`).

| Mount | Endpoints |
|-------|-----------|
| `GET /api/health` | Health check |
| `/api/services` | `GET /` |
| `/api/doctors` | `GET /`, `GET /:slug` |
| `/api/locations` | `GET /` |
| `/api/testimonials` | `GET /` (published only) |
| `/api/news` | `GET /`, `GET /:slug` |
| `/api/contact` | `POST /` |
| `/api/appointments` | `GET /availability`, `POST /`, `GET\|PUT /manage/:token`, `PUT /manage/:token/cancel` |
| `/api/waitlist` | `POST /` |
| `/api/reviews` | `POST /` (inserts unpublished testimonial) |
| `/api/search` | `GET /?q=` (news + services) |
| `/api/newsletter` | `POST /` |
| `/api/upload` | `POST /` (admin, multipart `file`) |
| `/api/payments` | `POST /webhook` (Stripe, raw body) |
| `/api/auth` | `POST /login`, `/2fa/verify`, `/refresh`, `/logout`, `GET /me`, `POST /forgot-password`, `/reset-password`, `POST /2fa/setup\|enable\|disable` |
| `/api/admin/news` | CRUD |
| `/api/admin/appointments` | `GET /`, `PUT /:id/status` |
| `/api/admin/waitlist` | `GET /` |
| `/api/admin/newsletter` | `GET /` |
| `/api/admin/admins` | `GET /`, `POST /`, `PUT /:id/role`, `DELETE /:id` (admin role) |
| `/api/admin/:resource` | CRUD for `services`, `doctors`, `locations`, `testimonials`, `closures` |

Appointment statuses used by admin: `confirmed` | `cancelled` | `completed`.

---

## 8. Database

Schema: `backend/src/db/schema.sql` (idempotent `CREATE` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for upgrades).

**Tables:** `locations`, `services`, `doctors`, `testimonials`, `contact_submissions`, `news`, `admin_users`, `refresh_tokens`, `clinic_hours`, `appointments`, `clinic_closures`, `waitlist_entries`, `newsletter_subscribers`

### Double-booking prevention (DB-level)

```sql
CREATE UNIQUE INDEX idx_appointments_slot_unique
  ON appointments (location_id, COALESCE(doctor_id, -1), appointment_date, appointment_time)
  WHERE status <> 'cancelled';
```

Cancelled rows do not block the slot. Concurrent requests that race the app check still fail with **409** at the database.

### Other constraints

- `clinic_hours` UNIQUE `(location_id, day_of_week)`; day 0–6
- `clinic_closures` UNIQUE `(location_id, closure_date)`
- `appointments.manage_token` UNIQUE
- `testimonials.rating` CHECK 1–5
- Content tables use bilingual `_en` / `_ar` fields

### Seed data (`npm run db:seed`)

Cairo + Dubai locations, four sample services, weekly clinic hours, an admin user, and sample news. Doctors and testimonials are left empty by design for you to fill in.

---

## 9. Auth, roles & 2FA

| Piece | Detail |
|-------|--------|
| Passwords | `bcryptjs` (cost 10) |
| Access JWT | `type: 'access'`, **15 minutes**, `Authorization: Bearer` |
| MFA pending JWT | `type: 'mfa_pending'`, **5 minutes**, issued after password if TOTP enabled |
| Refresh token | Random token, **SHA-hashed** in `refresh_tokens`, httpOnly cookie `refresh_token`, path `/api/auth`, **7 days**, `sameSite: 'lax'`, `secure` in production |
| Rotation | Refresh rotates on every use; revoked on logout / password reset |
| 2FA | `otplib` TOTP + QR (`issuer: 'Clinic Admin'`); enable/disable require a valid code |
| Client storage | Access token in memory only (not `localStorage`); silent refresh via cookie |

---

## 10. Integrations

| Feature | Env vars | When unset |
|---------|----------|------------|
| Email (confirmations, reminders, contact, reset) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Silently skipped; actions still succeed |
| SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM` | Silently skipped |
| WhatsApp | Same Twilio vars + `TWILIO_WHATSAPP_FROM` | Silently skipped |
| Deposits | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Deposit skipped; booking still confirms |
| Analytics | `NEXT_PUBLIC_GA_ID` | GA script never renders |

Also used when email is on: `CONTACT_NOTIFY_EMAIL`, `BOOKING_NOTIFY_EMAIL`.

Delivery failures are logged and do not fail the HTTP response.

---

## 11. Environment variables

### Backend (`backend/.env.example`)

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `4000`) |
| `NODE_ENV` | `development` / `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `FRONTEND_ORIGIN` | Exact CORS origin(s), comma-separated |
| `PUBLIC_API_URL` | Absolute API base for `/uploads` links (optional in dev) |
| `JWT_SECRET` | Strong random secret for JWTs |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` / `ADMIN_SEED_NAME` | Seeded admin on `db:seed` |
| `SMTP_*` | Outgoing mail |
| `CONTACT_NOTIFY_EMAIL` / `BOOKING_NOTIFY_EMAIL` | Notification recipients |
| `TWILIO_*` | SMS / WhatsApp |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Deposits + webhook |

### Frontend (`frontend/.env.local.example`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base (e.g. `http://localhost:4000/api`) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for sitemap / robots / absolute links |
| `NEXT_PUBLIC_GA_ID` | Optional GA4 measurement ID |

---

## 12. Scripts & Docker

### Backend npm scripts

| Script | What it does |
|--------|----------------|
| `npm run dev` | Nodemon API + starts reminder cron |
| `npm start` | Production `node src/index.js` |
| `npm test` | Jest `--runInBand` |
| `npm run db:migrate` | Apply `src/db/schema.sql` |
| `npm run db:seed` | Seed locations, services, hours, admin, sample news |
| `npm run db:create-admin` | `node scripts/createAdmin.js <email> <password> ["Name"] [staff\|manager\|admin]` |

### Docker Compose

`docker-compose.yml` runs a single `db` service:

- Image: `postgres:16`
- User / password / DB: `clinic` / `clinic` / `clinic_db`
- Port: `5432`
- Volume: `clinic_db_data`
- Healthcheck: `pg_isready`

---

## 13. i18n

- Hand-rolled (no next-intl): `frontend/messages/en.json` and `ar.json`
- `getMessages(locale)` in `lib/getMessages.js`; locales `['en','ar']`, default `en`
- Middleware redirects bare paths to `/en...`; skips `/admin`
- Locale layout sets `dir` to `rtl` / `ltr` via `SetHtmlAttrs`
- API content fields selected by locale in `lib/api.js`
- Language toggle switches between `/en` and `/ar`

---

## 14. SEO & analytics

- **`sitemap.js`** — static locale paths + live news slugs + doctor slugs (`NEXT_PUBLIC_SITE_URL`)
- **`robots.js`** — allow `/`, disallow `/admin`, sitemap URL
- Per-locale `generateMetadata` from message files
- **JSON-LD** (`JsonLd`): `MedicalClinic` (home/locations), `Physician` (doctor), `NewsArticle` (news)
- Optional **GA4** in root layout when `NEXT_PUBLIC_GA_ID` is set
- Dynamic API-backed pages use `export const dynamic = 'force-dynamic'` where needed

---

## 15. Security

- `helmet()` on the Express app
- CORS: exact origin match + credentials (required for refresh cookies)
- Body limit: `express.json({ limit: '20kb' })`; Stripe webhook uses `express.raw` before the JSON parser
- Rate limits (15-minute windows): contact 10, booking 10, manage 20, login/2FA 20, password reset 5, newsletter 10, reviews 5, waitlist 10
- Admin access tokens in memory; refresh httpOnly; tokens stored hashed where applicable
- Uploads: admin-only, 5MB max, jpeg/png/webp/gif only
- Reviews default to unpublished for moderation
- Password-reset and refresh tokens hashed at rest
- Role checks on delete and admin-user APIs

---

## 16. Testing & CI

```bash
cd backend
npm test   # unit tests always; integration tests skip without DATABASE_URL
```

| Suite | Coverage |
|-------|----------|
| `tests/token.test.js` | JWT access / MFA types, tamper rejection, random token hashing |
| `tests/twofa.test.js` | TOTP verify / reject |
| `tests/api.integration.test.js` | Real Express app + Postgres: health, contact validation, login, admin auth, availability, double-book **409** |

Frontend has `npm run lint` / build; no separate frontend test suite.

### GitHub Actions

| Workflow | Trigger | Steps |
|----------|---------|--------|
| `backend-ci.yml` | changes under `backend/` | Postgres 16 service → Node 20 → `npm ci` → `npm test` → `npm audit --omit=dev --audit-level=high` |
| `frontend-ci.yml` | changes under `frontend/` | Node 20 → `npm ci` → `npm run build` → audit high |

---

## 17. Deployment

### Frontend → Vercel

- Root directory: `frontend`
- Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, optional `NEXT_PUBLIC_GA_ID`

### Backend → Render / Railway / similar

- Root directory: `backend`
- Managed PostgreSQL add-on
- Env: everything in `.env.example` — at minimum `DATABASE_URL`, `JWT_SECRET`, `ADMIN_SEED_*`, `FRONTEND_ORIGIN`
- Start: `npm start`
- After first deploy (platform shell once): `npm run db:migrate && npm run db:seed`

**Cookies + CORS:** `FRONTEND_ORIGIN` must exactly match the deployed frontend origin. Use HTTPS in production so `secure` cookies work.

**Uploads:** files go to `backend/uploads/` on local disk. On many PaaS hosts that disk is **ephemeral**. Mount a persistent volume or switch `src/routes/upload.js` to object storage (S3, Cloudinary) before relying on uploads in production.

---

## 18. Known limitations

- **Legal pages are templates** — Privacy and Terms are starting drafts with an on-page disclaimer. Have them reviewed for Egypt PDPL and UAE data-protection rules before go-live.
- **Weekly clinic hours** are seed/SQL only — admin UI covers ad-hoc closures, not the weekly schedule.
- **Seed leaves doctors/testimonials empty** so you can add real data.
- **Manage/confirmation email links** currently hardcode `/en/booking/manage/...` in the mailer.
- **Public `GET /api/services`** does not expose `price_cents` / `deposit_cents` (used server-side on booking).
- **File uploads are local-disk**, not cloud storage — see deployment notes.
- **Auth is custom** (JWT + TOTP), not Auth0/Clerk — fine for a small clinic team; worth a security review for higher-sensitivity use.
- **Reminder / waitlist emails need SMTP** — without it, those notifications are skipped (booking/cancel still work).
- A nested `postcss` advisory can appear inside Next.js 14’s tooling; fixing it fully may require a Next major bump.

---

## 19. Production checklist

- [ ] Replace placeholder copy in `messages/en.json` and `messages/ar.json`
- [ ] Replace addresses, phones, coordinates, and `clinic_hours`
- [ ] Add doctors, services, and published testimonials via admin
- [ ] Change the seeded admin password (`npm run db:create-admin`) and set a strong unique `JWT_SECRET`
- [ ] Set `FRONTEND_ORIGIN` and `NEXT_PUBLIC_SITE_URL` to real HTTPS origins
- [ ] Have legal pages reviewed by counsel
- [ ] Configure SMTP at minimum; Twilio and Stripe if those channels matter
- [ ] Move uploads to persistent / object storage
- [ ] Enable 2FA for all admin accounts
- [ ] Add Google Business Profiles for Cairo and Dubai
- [ ] Confirm CI is green on the default branch
- [ ] Smoke-test booking, cancel → waitlist notify, and admin login on production
