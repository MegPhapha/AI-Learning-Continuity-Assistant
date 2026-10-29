# AI Learning Continuity Assistant

AI-powered learning platform for students in conflict-affected and underserved communities — starting with Mali. Works fully offline with a local AI model, in English and French.

## What it is

A unified web portal with two roles behind one login page:

- **Student** — chat with an AI tutor about the approved curriculum, answer practice questions that get graded, earn XP and levels, complete daily targets and challenges
- **Teacher** — manage curriculum documents (upload/approve/reject), monitor the dashboard, set assignments & daily targets, review student submissions with feedback and grades

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (production build), React 19, Tailwind CSS, framer-motion |
| Backend | FastAPI (Python 3), Pydantic v2 (camelCase API) |
| AI | Ollama local models (llama3.2 default; Mistral 7B supported when RAM allows) |
| Tunneling | ngrok (for demos) |

## AI architecture (Mistral-first)

Student data stays local by default. Off-curriculum questions are answered by Mistral models, in this order:

1. **Mistral API** (`ministral-3b-latest` by default — Mistral's edge model family) hosted on Mistral's EU infrastructure — used when a `MISTRAL_API_KEY` is configured and connectivity exists
2. **Local Mistral 7B / smaller local models via Ollama** — fully offline fallback for low-connectivity schools
3. Honest refusal — if no model can answer, the tutor says so rather than guessing

Every AI answer is **labelled in the UI** with the model that produced it ("Answered by Mistral Ministral 3B (EU)"), and is visually distinct from curriculum-verified answers.

To enable the Mistral API layer:

```bash
echo "MISTRAL_API_KEY=your_key_from_console.mistral.ai" > .env
./start.sh
```

## Quick start

```bash
./start.sh          # starts Ollama (if needed), backend (:8000), frontend (:3000)
```

Then open **http://localhost:3000**

First run builds the frontend automatically. Individual pieces:

```bash
# Backend
.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000

# Frontend (production)
cd frontend && npm install && npm run build && npm run start

# Local AI model (optional, for off-curriculum questions)
brew install ollama && brew services start ollama
ollama pull llama3.2        # small, fits 8 GB RAM
# ollama pull mistral       # 4.4 GB — needs more free RAM
```

## Key features

- **Bilingual (EN/FR)** — one toggle translates the entire app, persisted per user; French curriculum content included
- **Grounded answers** — curriculum topics answer from approved documents with cited sources; off-topic questions go to the local AI model, honestly marked "Cannot verify from curriculum"
- **Practice loop** — the tutor poses questions, guides attempts, grades answers (correct → confetti + 25 XP, wrong → hint + retry)
- **Safety** — only teacher-approved documents reach students; empty/invalid requests rejected (422/404)
- **Gamification** — XP, levels (Explorer → Legend), daily targets, challenges, streaks persisted per day

## Project structure

```
backend/           FastAPI app (api/, models/)
frontend/          Next.js app (pages/, components/, lib/)
start.sh           one-command launcher
```

## Demo

The student flow: pick **Student** → choose a curriculum → ask "Explain this concept: osmosis" → click **Practice** → answer → get graded → switch to **FR** → everything is in French.

---

For Conflict-Affected and Underserved Communities · Mali & Beyond
