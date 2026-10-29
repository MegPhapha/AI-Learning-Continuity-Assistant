#!/bin/bash
# AI Learning Continuity Assistant — one-command start for the demo.
# Starts: Ollama (if not running) → FastAPI backend → Next.js frontend (production build).
#
# Every run performs a FRESH RESTART: any previously running backend/frontend
# are stopped first, so the in-memory demo data (assignments, submissions,
# document approval queue, chat sessions) is reset to its pristine state.

set -e
cd "$(dirname "$0")"

# Load optional environment (MISTRAL_API_KEY etc.) from .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
  echo "    Loaded .env"
fi

echo "==> Resetting to fresh demo data (stopping running services)..."
# Unload the launchd keep-alive agents so they don't resurrect stale processes
launchctl bootout gui/$(id -u)/com.ailearning.backend 2>/dev/null || true
launchctl bootout gui/$(id -u)/com.ailearning.frontend 2>/dev/null || true
# Stop any backend/frontend still listening on the demo ports
for port in 8000 3000; do
  pids=$(lsof -ti tcp:$port -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null || true
    for _ in 1 2 3 4 5 6 7 8 9 10; do
      lsof -ti tcp:$port -sTCP:LISTEN >/dev/null 2>&1 || break
      sleep 1
    done
    kill -9 $(lsof -ti tcp:$port -sTCP:LISTEN 2>/dev/null) 2>/dev/null || true
  fi
done
echo "    Services stopped — demo data (assignments, submissions, document queue) is fresh"

echo "==> Checking Ollama (local AI model server)..."
if ! curl -s --max-time 3 http://localhost:11434/api/version > /dev/null 2>&1; then
  echo "    Starting Ollama..."
  (brew services start ollama 2>/dev/null || ollama serve > /dev/null 2>&1 &)
  sleep 5
fi
echo "    Ollama: $(curl -s --max-time 3 http://localhost:11434/api/version)"
echo "    Models available: $(ollama list 2>/dev/null | tail -n +2 | awk '{print $1}' | paste -sd ', ' -)"

echo "==> Starting backend (FastAPI on :8000)..."
# The tutor uses llama3.2 by default (fits 8 GB RAM).
# To prefer Mistral when enough RAM is free, run:
#   OLLAMA_MODEL=mistral .venv/bin/uvicorn backend.main:app --port 8000
nohup .venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 > backend_server.log 2>&1 &
echo "    Backend starting..."

echo "==> Starting frontend (Next.js on :3000)..."
if [ ! -d frontend/.next ]; then
  echo "    Building frontend (first run only)..."
  (cd frontend && npm install && npm run build)
fi
(cd frontend && nohup npm run start > ../frontend_server.log 2>&1 &)
echo "    Frontend starting..."

sleep 3
echo ""
echo "==> Verifying..."
echo "    Backend:  $(curl -s --max-time 5 http://localhost:8000/health | head -c 60)"
echo "    Frontend: HTTP $(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://localhost:3000/)"
echo "    API:      HTTP $(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://localhost:3000/health)"
echo ""
echo "✅ Ready!  Open http://localhost:3000"
echo "   Logs:   backend_server.log, frontend_server.log"
echo ""
echo "   Fresh demo data is loaded. To also reset the browser's saved progress"
echo "   (XP, level) and role, open Settings → Reset demo data, or use a new"
echo "   private/incognito window for the demo."
