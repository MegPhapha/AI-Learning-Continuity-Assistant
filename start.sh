#!/bin/bash
# AI Learning Continuity Assistant — one-command start for the demo.
# Starts: Ollama (if not running) → FastAPI backend → Next.js frontend (production build).

set -e
cd "$(dirname "$0")"

echo "==> Checking Ollama (local AI model server)..."
if ! curl -s --max-time 3 http://localhost:11434/api/version > /dev/null 2>&1; then
  echo "    Starting Ollama..."
  (brew services start ollama 2>/dev/null || ollama serve > /dev/null 2>&1 &)
  sleep 5
fi
echo "    Ollama: $(curl -s --max-time 3 http://localhost:11434/api/version)"
echo "    Models available: $(ollama list 2>/dev/null | tail -n +2 | awk '{print $1}' | paste -sd ', ' -)"

echo "==> Starting backend (FastAPI on :8000)..."
if lsof -nP -iTCP:8000 -sTCP:LISTEN > /dev/null 2>&1; then
  echo "    Backend already running on :8000"
else
  # The tutor uses llama3.2 by default (fits 8 GB RAM).
  # To prefer Mistral when enough RAM is free, run:
  #   OLLAMA_MODEL=mistral .venv/bin/uvicorn backend.main:app --port 8000
  nohup .venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 > backend_server.log 2>&1 &
  echo "    Backend starting..."
fi

echo "==> Starting frontend (Next.js on :3000)..."
if lsof -nP -iTCP:3000 -sTCP:LISTEN > /dev/null 2>&1; then
  echo "    Frontend already running on :3000"
else
  if [ ! -d frontend/.next ]; then
    echo "    Building frontend (first run only)..."
    (cd frontend && npm install && npm run build)
  fi
  (cd frontend && nohup npm run start > ../frontend_server.log 2>&1 &)
  echo "    Frontend starting..."
fi

sleep 3
echo ""
echo "==> Verifying..."
echo "    Backend:  $(curl -s --max-time 5 http://localhost:8000/health | head -c 60)"
echo "    Frontend: HTTP $(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://localhost:3000/)"
echo "    API:      HTTP $(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://localhost:3000/health)"
echo ""
echo "✅ Ready!  Open http://localhost:3000"
echo "   Logs:   backend_server.log, frontend_server.log"
