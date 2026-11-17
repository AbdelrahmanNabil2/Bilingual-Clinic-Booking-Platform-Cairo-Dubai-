#!/usr/bin/env bash
# Gets the whole project ready to run locally in one shot:
#   1. Starts a PostgreSQL container (via Docker Compose) — no local Postgres install needed
#   2. Creates backend/.env and frontend/.env.local with matching local defaults (only if they don't already exist — safe to re-run)
#   3. Installs npm dependencies for both apps
#   4. Runs the database migration and seed
#
# After this finishes, start the two dev servers yourself in two terminals
# (this script does not run long-lived processes):
#   cd backend  && npm run dev
#   cd frontend && npm run dev
#
# Requires: Docker (with Compose), Node.js 18+, npm.

set -euo pipefail
cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}==>${NC} $1"; }
warn()  { echo -e "${YELLOW}==>${NC} $1"; }
fail()  { echo -e "${RED}==>${NC} $1"; exit 1; }

command -v node >/dev/null 2>&1 || fail "Node.js is required but wasn't found. Install Node 18+ and re-run this script."
command -v npm  >/dev/null 2>&1 || fail "npm is required but wasn't found."

DOCKER_OK=true
if ! command -v docker >/dev/null 2>&1; then
  DOCKER_OK=false
elif ! docker compose version >/dev/null 2>&1; then
  DOCKER_OK=false
fi

if [ "$DOCKER_OK" = false ]; then
  warn "Docker (with Compose) wasn't found."
  echo "    Either install Docker Desktop (https://www.docker.com/products/docker-desktop/) and re-run this script,"
  echo "    or set up PostgreSQL yourself and point backend/.env's DATABASE_URL at it — see README.md section 1."
  exit 1
fi

info "Starting PostgreSQL (Docker)..."
docker compose up -d db

info "Waiting for the database to be ready..."
for i in $(seq 1 30); do
  if docker compose exec -T db pg_isready -U clinic -d clinic_db >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ "$i" = 30 ]; then
    fail "Postgres didn't become ready in time. Run 'docker compose logs db' to see what happened."
  fi
done
info "Database is up."

# ── Backend .env ──────────────────────────────────────────────────────────
if [ ! -f backend/.env ]; then
  info "Creating backend/.env with local defaults..."
  cp backend/.env.example backend/.env

  # Generate a real random secret rather than shipping a shared placeholder,
  # falling back to a clearly-labeled dev value if openssl isn't available.
  if command -v openssl >/dev/null 2>&1; then
    JWT_SECRET=$(openssl rand -hex 32)
  else
    JWT_SECRET="local-dev-secret-$(date +%s)-change-before-deploying"
  fi

  sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://clinic:clinic@localhost:5432/clinic_db|" backend/.env
  sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" backend/.env
  sed -i.bak "s|^ADMIN_SEED_PASSWORD=.*|ADMIN_SEED_PASSWORD=LocalDev123|" backend/.env
  rm -f backend/.env.bak
else
  info "backend/.env already exists — leaving it as-is."
fi

# ── Frontend .env.local ────────────────────────────────────────────────────
if [ ! -f frontend/.env.local ]; then
  info "Creating frontend/.env.local with local defaults..."
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
echo
warn "To stop the database later: docker compose down   (add -v to also wipe its data)"
