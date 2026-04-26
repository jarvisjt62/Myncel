#!/bin/bash
# ============================================================
#  Sentinel — Deploy Script
#  Run from the app directory: bash deploy/deploy.sh
#  Or from anywhere: bash /var/www/sentinel/deploy/deploy.sh
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
section(){ echo -e "\n${BLUE}── $1 ──${NC}"; }

# ── Config ────────────────────────────────────────────────
APP_DIR="/var/www/sentinel"
APP_NAME="sentinel"           # PM2 app name
BRANCH="main"
ENV_FILE="${APP_DIR}/.env.production"

# ── Start ─────────────────────────────────────────────────
echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Sentinel Deployment Script       ║${NC}"
echo -e "${BLUE}║     $(date '+%Y-%m-%d %H:%M:%S')              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# Resolve script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${SCRIPT_DIR}/.." || error "Cannot find app directory"
log "Working directory: $(pwd)"

# ── Check env file ────────────────────────────────────────
section "Environment"
if [ ! -f ".env.production" ]; then
  if [ -f "${ENV_FILE}" ]; then
    cp "${ENV_FILE}" .env.production
    log "Copied .env.production from ${ENV_FILE}"
  else
    error ".env.production not found. Create it first (see setup-vps.sh output)."
  fi
fi
log ".env.production found ✓"

# ── Git Pull ──────────────────────────────────────────────
section "Git Pull"
if [ -d ".git" ]; then
  git fetch --all
  git reset --hard origin/${BRANCH}
  log "Pulled latest code from ${BRANCH}"
else
  warn "No .git directory — skipping git pull (manual upload mode)"
fi

# ── Install Dependencies ──────────────────────────────────
section "Dependencies"
npm ci --production=false
log "npm packages installed"

# ── Prisma ───────────────────────────────────────────────
section "Database Migrations"
npx prisma generate
npx prisma migrate deploy
log "Database migrations applied"
log "Prisma client generated"

# ── Build ─────────────────────────────────────────────────
section "Next.js Build"
npm run build
log "Next.js build complete"

# ── PM2 Restart ───────────────────────────────────────────
section "PM2"

# Check if app already running
if pm2 describe ${APP_NAME} > /dev/null 2>&1; then
  pm2 reload ${APP_NAME} --update-env
  log "PM2 app '${APP_NAME}' reloaded (zero-downtime)"
else
  pm2 start ecosystem.config.js
  log "PM2 app '${APP_NAME}' started"
fi

pm2 save
log "PM2 process list saved"

# ── Nginx reload ─────────────────────────────────────────
section "Nginx"
nginx -t && systemctl reload nginx
log "Nginx reloaded"

# ── Health check ─────────────────────────────────────────
section "Health Check"
sleep 3

MAX_TRIES=10
TRIES=0
until curl -sf http://localhost:3000 > /dev/null 2>&1; do
  TRIES=$((TRIES+1))
  if [ $TRIES -ge $MAX_TRIES ]; then
    error "App did not start after ${MAX_TRIES} attempts. Check: pm2 logs ${APP_NAME}"
  fi
  warn "Waiting for app to start... (${TRIES}/${MAX_TRIES})"
  sleep 3
done

log "App is responding on port 3000 ✓"

# ── Done ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Deployment Successful!           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}App status:${NC}  pm2 status"
echo -e "  ${GREEN}App logs:${NC}    pm2 logs ${APP_NAME}"
echo -e "  ${GREEN}Nginx logs:${NC}  tail -f /var/log/nginx/error.log"
echo ""