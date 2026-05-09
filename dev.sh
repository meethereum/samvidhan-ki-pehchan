#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev.sh — Smart rebuild & restart for Samvidhan Ki Pehchan
#
# Usage:
#   ./dev.sh              # auto-detect which services changed and rebuild them
#   ./dev.sh frontend     # rebuild + restart frontend only
#   ./dev.sh backend      # rebuild + restart backend only
#   ./dev.sh rag          # rebuild + restart rag only
#   ./dev.sh all          # rebuild + restart everything
#   ./dev.sh logs         # tail logs for all services
#   ./dev.sh status       # show container status
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}${BOLD}[dev]${RESET} $*"; }
success() { echo -e "${GREEN}${BOLD}[dev]${RESET} $*"; }
warn()    { echo -e "${YELLOW}${BOLD}[dev]${RESET} $*"; }
error()   { echo -e "${RED}${BOLD}[dev]${RESET} $*" >&2; }

# ── Sanity checks ─────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  error "docker not found. Please install Docker Desktop or Docker Engine."
  exit 1
fi

if ! docker compose version &>/dev/null; then
  error "docker compose plugin not found."
  exit 1
fi

# Enable BuildKit for cache mounts (--mount=type=cache in Dockerfiles)
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# ── Map service name → source directory ───────────────────────────────────────
declare -A SERVICE_DIRS=(
  [frontend]="frontend/angular-frontend"
  [backend]="backend"
  [rag]="rag"
)

# ── Detect changed services via git ───────────────────────────────────────────
detect_changed_services() {
  local changed=()

  # Files changed since last commit (staged + unstaged + untracked)
  local dirty_files
  dirty_files=$(git status --short 2>/dev/null | awk '{print $2}' || true)

  # Also include files changed in the last commit (for CI / post-commit hooks)
  local last_commit_files
  last_commit_files=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || true)

  local all_files="${dirty_files}"$'\n'"${last_commit_files}"

  for service in "${!SERVICE_DIRS[@]}"; do
    local dir="${SERVICE_DIRS[$service]}"
    if echo "$all_files" | grep -q "^${dir}/\|^docker-compose"; then
      changed+=("$service")
    fi
  done

  # docker-compose.yml change → rebuild everything
  if echo "$all_files" | grep -q "^docker-compose"; then
    changed=(frontend backend rag)
  fi

  echo "${changed[@]:-}"
}

# ── Rebuild + restart a single service ────────────────────────────────────────
rebuild_service() {
  local service="$1"
  info "Rebuilding ${BOLD}${service}${RESET}..."

  # Build with no-cache only if explicitly requested via NO_CACHE=1
  local cache_flag=""
  [[ "${NO_CACHE:-0}" == "1" ]] && cache_flag="--no-cache"

  if ! docker compose build $cache_flag "$service"; then
    error "Build failed for ${service}. Check the output above."
    return 1
  fi

  info "Restarting ${BOLD}${service}${RESET}..."
  docker compose up -d --force-recreate "$service"
  success "${service} is up with the latest build."
}

# ── Verify .dockerignore files don't exclude source ───────────────────────────
audit_dockerignores() {
  local issues=0

  # Frontend: must not have *.ts or *.js at root level
  local fe_ignore="frontend/angular-frontend/.dockerignore"
  if [[ -f "$fe_ignore" ]]; then
    if grep -qE '^\*\.(ts|js|html|css)$' "$fe_ignore"; then
      warn "AUDIT: ${fe_ignore} contains a glob that may exclude source files!"
      warn "       Remove patterns like *.ts, *.js, *.html, *.css from .dockerignore"
      issues=$((issues + 1))
    fi
  fi

  # Backend: must not exclude src/
  local be_ignore="backend/.dockerignore"
  if [[ -f "$be_ignore" ]]; then
    if grep -qE '^src$|^\*\.(ts|js)$' "$be_ignore"; then
      warn "AUDIT: ${be_ignore} may exclude TypeScript source files!"
      issues=$((issues + 1))
    fi
  fi

  if [[ $issues -eq 0 ]]; then
    success "AUDIT: All .dockerignore files look clean."
  fi
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  local cmd="${1:-auto}"

  case "$cmd" in
    logs)
      exec docker compose logs -f --tail=50
      ;;
    status)
      docker compose ps
      exit 0
      ;;
    all)
      audit_dockerignores
      for service in frontend backend rag; do
        rebuild_service "$service"
      done
      success "All services rebuilt and restarted."
      exit 0
      ;;
    frontend|backend|rag)
      audit_dockerignores
      rebuild_service "$cmd"
      exit 0
      ;;
    auto)
      audit_dockerignores
      info "Detecting changed services..."
      local changed
      changed=$(detect_changed_services)

      if [[ -z "$changed" ]]; then
        warn "No changed services detected. Run './dev.sh all' to force rebuild everything."
        warn "Or specify a service: ./dev.sh frontend | backend | rag"
        exit 0
      fi

      info "Changed services: ${BOLD}${changed}${RESET}"
      for service in $changed; do
        rebuild_service "$service"
      done
      success "Done. Changed services are running with the latest code."
      ;;
    *)
      echo "Usage: $0 [auto|frontend|backend|rag|all|logs|status]"
      echo ""
      echo "  auto      Detect changed services from git and rebuild them (default)"
      echo "  frontend  Rebuild + restart frontend only"
      echo "  backend   Rebuild + restart backend only"
      echo "  rag       Rebuild + restart rag only"
      echo "  all       Rebuild + restart all services"
      echo "  logs      Tail logs for all services"
      echo "  status    Show container status"
      echo ""
      echo "  NO_CACHE=1 ./dev.sh frontend   # force rebuild without Docker cache"
      exit 1
      ;;
  esac
}

main "$@"
