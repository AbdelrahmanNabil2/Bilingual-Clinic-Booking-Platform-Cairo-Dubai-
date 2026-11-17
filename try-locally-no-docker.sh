#!/usr/bin/env bash
# Same end result as try-locally.sh, but for people who already have (or want
# to install) PostgreSQL directly instead of using Docker.
#
# Tries a handful of common local Postgres setups automatically (Homebrew on
# macOS, apt/systemd on Linux, a plain postgres/postgres login) and uses
# whichever one actually connects. If none of them match your setup, it
# tells you exactly what to do instead rather than guessing silently.
#
# After this finishes, start the two dev servers yourself in two terminals:
#   cd backend  && npm run dev
#   cd frontend && npm run dev

set -euo pipefail
cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}==>${NC} $1"; }
warn()  { echo -e "${YELLOW}==>${NC} $1"; }
fail()  { echo -e "${RED}==>${NC} $1"; exit 1; }

command -v node >/dev/null 2>&1 || fail "Node.js is required but wasn't found. Install Node 18+ and re-run this script."
command -v npm  >/dev/null 2>&1 || fail "npm is required but wasn't found."

if ! command -v psql >/dev/null 2>&1; then
  fail "PostgreSQL's client tools (psql) weren't found.
    macOS:   brew install postgresql@16 && brew services start postgresql@16
    Ubuntu:  sudo apt install postgresql
    Windows: https://www.postgresql.org/download/windows/
  Then re-run this script."
fi

DB_NAME="clinic_db"

info "Looking for a way to create/reach the '${DB_NAME}' database..."

# Each entry: "description|create-command|connection-url". Tried in order;
# the first one that can both create (or confirm) the database AND connect
# to it wins. `-w`/`--no-password` on every command means we fail fast on a
# missing password instead of ever blocking on an interactive prompt, and
# connect_timeout keeps an unreachable server from hanging the script.
CANDIDATES=(
  "current OS user, no password (common on Homebrew/macOS)|createdb -w ${DB_NAME}|postgresql://localhost:5432/${DB_NAME}?connect_timeout=5"
  "postgres/postgres login on localhost (common on Linux/apt and manual installs)|sudo -u postgres createdb -w ${DB_NAME}; createdb -w -U postgres -h localhost ${DB_NAME}|postgresql://postgres:postgres@localhost:5432/${DB_NAME}?connect_timeout=5"
)

FOUND_URL=""
for candidate in "${CANDIDATES[@]}"; do
  IFS='|' read -r desc create_cmd conn_url <<< "$candidate"

  # For candidates whose URL embeds a password, export PGPASSWORD so -w (never
  # prompt) has an actual credential to use instead of just failing outright.
  candidate_password=$(printf '%s' "$conn_url" | sed -n 's|^postgresql://[^:]*:\([^@]*\)@.*|\1|p')
  if [ -n "$candidate_password" ]; then
    export PGPASSWORD="$candidate_password"
  else
    unset PGPASSWORD || true
  fi

  # Attempt to create it (fine if it already exists — we only care about the
  # connection check below); suppress noise either way. stdin redirected
  # from /dev/null as a second guard against ever blocking on a prompt.
  eval "$create_cmd" < /dev/null >/dev/null 2>&1 || true

  if psql "$conn_url" -w -c 'SELECT 1;' < /dev/null >/dev/null 2>&1; then
    info "Connected using: ${desc}"
    FOUND_URL="$conn_url"
    unset PGPASSWORD || true
    break
  fi
done
unset PGPASSWORD || true

if [ -z "$FOUND_URL" ]; then
  warn "Couldn't auto-detect your Postgres setup."
  echo "    Create the database and a user yourself, e.g.:"
  echo "        createdb ${DB_NAME}"
  echo "    Then edit backend/.env's DATABASE_URL to match your connection details,"
  echo "    and run: cd backend && npm run db:migrate && npm run db:seed"
  exit 1
fi

# Strip the ?connect_timeout=5 probe param — only needed for detection above,
# not for the connection string the app itself will use.
FOUND_URL="${FOUND_URL%%\?*}"

# ── Backend .env ──────────────────────────────────────────────────────────
if [ ! -f backend/.env ]; then
  info "Creating backend/.env..."
  cp backend/.env.example backend/.env

  if command -v openssl >/dev/null 2>&1; then
    JWT_SECRET=$(openssl rand -hex 32)
  else
    JWT_SECRET="local-dev-secret-$(date +%s)-change-before-deploying"
  fi

  sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=${FOUND_URL}|" backend/.env
  sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" backend/.env
  sed -i.bak "s|^ADMIN_SEED_PASSWORD=.*|ADMIN_SEED_PASSWORD=LocalDev123|" backend/.env
  rm -f backend/.env.bak
else
  info "backend/.env already exists — leaving it as-is."
fi

# ── Frontend .env.local ────────────────────────────────────────────────────
if [ ! -f frontend/.env.local ]; then
  info "Creating frontend/.env.local..."
  cp frontend/.env.local.example frontend/.env.local
else
  info "frontend/.env.local already exists — leaving it as-is."
fi

info "Installing backend dependencies..."
(cd backend && npm install --no-audit --no-fund)

info "Installing frontend dependencies..."
(cd frontend && npm install --no-audit --no-fund)

info "Running database migration..."
(cd backend && npm run db:migrate)

info "Seeding the database..."
(cd backend && npm run db:seed)

ADMIN_EMAIL=$(grep '^ADMIN_SEED_EMAIL=' backend/.env | cut -d= -f2)
ADMIN_PASSWORD=$(grep '^ADMIN_SEED_PASSWORD=' backend/.env | cut -d= -f2)

echo
info "All set! Start the two dev servers in separate terminals:"
echo
echo "    cd backend  && npm run dev     # http://localhost:4000"
echo "    cd frontend && npm run dev     # http://localhost:3000"
echo
info "Then open:"
echo "    Site:  http://localhost:3000"
echo "    Admin: http://localhost:3000/admin/login  (${ADMIN_EMAIL} / ${ADMIN_PASSWORD})"
