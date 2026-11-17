-- Clinic database schema
-- Every content table carries an _en and _ar column pair for bilingual content.

CREATE TABLE IF NOT EXISTS locations (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(50) UNIQUE NOT NULL,       -- e.g. 'cairo', 'dubai'
  city_en       VARCHAR(100) NOT NULL,
  city_ar       VARCHAR(100) NOT NULL,
  country_en    VARCHAR(100) NOT NULL,
  country_ar    VARCHAR(100) NOT NULL,
  address_en    TEXT NOT NULL,
  address_ar    TEXT NOT NULL,
  phone         VARCHAR(50) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  hours_en      VARCHAR(150) NOT NULL,
  hours_ar      VARCHAR(150) NOT NULL,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  timezone      VARCHAR(50) NOT NULL DEFAULT 'UTC', -- IANA tz, e.g. 'Africa/Cairo', 'Asia/Dubai'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id            SERIAL PRIMARY KEY,
  title_en      VARCHAR(150) NOT NULL,
  title_ar      VARCHAR(150) NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  icon          VARCHAR(50),
  price_cents   INTEGER,                 -- nullable — set to enable a deposit at booking time
  deposit_cents INTEGER,                 -- nullable — amount collected up-front via Stripe
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doctors (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(180) UNIQUE,
  name_en       VARCHAR(150) NOT NULL,
  name_ar       VARCHAR(150) NOT NULL,
  title_en      VARCHAR(150) NOT NULL,
  title_ar      VARCHAR(150) NOT NULL,
  bio_en        TEXT NOT NULL,
  bio_ar        TEXT NOT NULL,
  photo_url     VARCHAR(300),
  location_id   INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id            SERIAL PRIMARY KEY,
  quote_en      TEXT NOT NULL,
  quote_ar      TEXT NOT NULL,
  patient_name  VARCHAR(150) NOT NULL,
  location_id   INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  rating        SMALLINT CHECK (rating BETWEEN 1 AND 5),
  is_published  BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  email             VARCHAR(150) NOT NULL,
  phone             VARCHAR(50),
  preferred_location VARCHAR(20) NOT NULL DEFAULT 'either', -- 'cairo' | 'dubai' | 'either'
  message           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  handled           BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctors_location ON doctors (location_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_location ON testimonials (location_id);

-- Idempotent upgrades for databases created before these columns existed.
ALTER TABLE locations ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NOT NULL DEFAULT 'UTC';
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_cents INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_cents INTEGER;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS slug VARCHAR(180);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'doctors_slug_key') THEN
    ALTER TABLE doctors ADD CONSTRAINT doctors_slug_key UNIQUE (slug);
  END IF;
END $$;

-- ─── News / announcements ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(180) UNIQUE NOT NULL,
  title_en        VARCHAR(200) NOT NULL,
  title_ar        VARCHAR(200) NOT NULL,
  excerpt_en      TEXT,
  excerpt_ar      TEXT,
  body_en         TEXT NOT NULL,
  body_ar         TEXT NOT NULL,
  cover_image_url VARCHAR(300),
  is_published    BOOLEAN NOT NULL DEFAULT true,
  published_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news (is_published, published_at DESC);

-- ─── Admin users (panel authentication) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id                    SERIAL PRIMARY KEY,
  email                 VARCHAR(150) UNIQUE NOT NULL,
  password_hash         VARCHAR(255) NOT NULL,
  name                  VARCHAR(150) NOT NULL,
  role                  VARCHAR(20) NOT NULL DEFAULT 'manager', -- 'admin' | 'manager' | 'staff'
  totp_secret           VARCHAR(64),
  totp_enabled          BOOLEAN NOT NULL DEFAULT false,
  password_reset_token  VARCHAR(128),
  password_reset_expires TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'manager';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(128);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

-- Refresh tokens for the hardened auth flow (short-lived access token +
-- longer-lived rotating refresh token, stored hashed, never in plaintext).
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          SERIAL PRIMARY KEY,
  admin_id    INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(128) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_admin ON refresh_tokens (admin_id);

-- ─── Clinic operating hours (drives booking availability) ───────────────
-- day_of_week follows JS convention: 0 = Sunday ... 6 = Saturday
CREATE TABLE IF NOT EXISTS clinic_hours (
  id                   SERIAL PRIMARY KEY,
  location_id          INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  day_of_week          SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_closed            BOOLEAN NOT NULL DEFAULT false,
  open_time            TIME,
  close_time           TIME,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  UNIQUE (location_id, day_of_week)
);

-- ─── Appointments ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id                SERIAL PRIMARY KEY,
  patient_name      VARCHAR(150) NOT NULL,
  email             VARCHAR(150) NOT NULL,
  phone             VARCHAR(50),
  location_id       INTEGER NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  service_id        INTEGER REFERENCES services(id) ON DELETE SET NULL,
  doctor_id         INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  appointment_date  DATE NOT NULL,
  appointment_time  TIME NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'confirmed', -- confirmed | cancelled | completed
  notes             TEXT,
  manage_token      VARCHAR(64) UNIQUE,     -- lets a patient reschedule/cancel via emailed link, no login
  reminder_sent_at  TIMESTAMPTZ,            -- set once the day-before reminder has gone out (idempotency)
  deposit_status    VARCHAR(20) NOT NULL DEFAULT 'not_required', -- not_required | pending | paid
  stripe_session_id VARCHAR(200),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS manage_token VARCHAR(64);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_manage_token_key') THEN
    ALTER TABLE appointments ADD CONSTRAINT appointments_manage_token_key UNIQUE (manage_token);
  END IF;
END $$;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_status VARCHAR(20) NOT NULL DEFAULT 'not_required';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(200);

-- One booking per location/doctor/date/time slot while active. Using
-- COALESCE(doctor_id, -1) means appointments with no doctor assigned still
-- guard against double-booking the location itself, while different doctors
-- at the same location can hold independent slots at the same time.
DROP INDEX IF EXISTS idx_appointments_slot_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_slot_unique
  ON appointments (location_id, COALESCE(doctor_id, -1), appointment_date, appointment_time)
  WHERE status <> 'cancelled';

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (appointment_date, location_id);

-- ─── Ad-hoc closures (holidays, one-off closures on top of the weekly schedule) ──
CREATE TABLE IF NOT EXISTS clinic_closures (
  id            SERIAL PRIMARY KEY,
  location_id   INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  closure_date  DATE NOT NULL,
  reason        VARCHAR(200),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (location_id, closure_date)
);

-- ─── Waitlist (join when a day is fully booked) ─────────────────────────
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id            SERIAL PRIMARY KEY,
  location_id   INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  patient_name  VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  phone         VARCHAR(50),
  notified_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_location_date ON waitlist_entries (location_id, requested_date);

-- ─── Newsletter subscribers ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(150) UNIQUE NOT NULL,
  locale        VARCHAR(5) NOT NULL DEFAULT 'en',
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
