# ⚡ VedaAI — The Lean Assessment Engine

> **AI-powered assessment creator for modern classrooms. Zero bloat, maximum performance.**

VedaAI allows educators to generate structured, NCERT-aligned question papers instantly. Built on a philosophy of ultra-minimal engineering: **every line of code has a financial cost.** We've stripped out the fake enterprise abstractions, discarded heavy ORM wrappers, and built a blazing-fast, production-ready SaaS core.

---

## 🚀 The Stack

**Frontend (The Glassmorphic Shell)**
- **Framework:** Next.js 14 (App Router)
- **State:** Zustand (Single source of truth)
- **Styling:** Vanilla CSS Modules with rich, modern, glassmorphic UI tokens
- **Data Fetching:** Native `fetch` with lightweight caching

**Backend (The Lean API Core)**
- **Runtime:** Node.js + Express + TypeScript
- **Validation:** Zod (Fail-fast boundary validation)
- **Database:** MongoDB Atlas (Native Mongoose, no abstraction bloat)
- **Queue/Cache:** Redis + BullMQ (Scalable async generation)
- **AI Engine:** Google Gemini 2.5 Flash SDK
- **Real-time:** Socket.io
- **Export:** PDFKit (Server-side rendering)

---

## 🛠️ Engineering Philosophy

This is not a tutorial project. This is a real-world, financial-cost-aware implementation built by senior engineers.
- **No Premature Abstractions:** Direct route-to-database logic via `/routes`. No arbitrary Controller/Service/Repository splits for trivial CRUD.
- **Fail Fast:** Zod schema validation at the very edge of the API.
- **Data Integrity:** Dynamic syllabus fetching directly from the database. Zero hardcoded fallbacks.
- **Resilient AI:** Robust prompt engineering ensuring strict JSON schemas.

---

## 🚦 Quick Start

### 1. Backend

```bash
cd backend
npm install

# Setup your environment variables
cp .env.example .env

# Start the dev server (runs on port 5000)
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install

# Start the Next.js frontend (runs on port 3000)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the magic.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```ini
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Required: Core Data & AI
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/vedaai
GEMINI_API_KEY=AIzaSy...

# Optional: Real-time & Queuing
REDIS_URL=redis://127.0.0.1:6379   # Falls back to in-memory processing if omitted
VERCEL=1                           # Set to 1 if deploying to Vercel serverless
```

### Frontend (`frontend/.env.local`)

```ini
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

---

## 📡 API Architecture

We maintain a flat, performant API surface.

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/assignments` | Fetch all generated assignments |
| `POST` | `/api/assignments` | Dispatch async generation job |
| `GET`  | `/api/assignments/:id` | Fetch assignment details |
| `POST` | `/api/assignments/:id/regenerate` | Re-roll specific sections via AI |
| `GET`  | `/api/assignments/:id/pdf` | Download rendered PDF |
| `GET`  | `/api/assignments/syllabus/grades` | Dynamically fetch available grades |
| `GET`  | `/api/assignments/syllabus/subjects` | Dynamically fetch subjects by grade |
| `GET`  | `/api/assignments/syllabus/chapters`| Dynamically fetch chapters by subject |

---

## 🧪 Testing

We test against the live running API instance to ensure real-world networking, middleware, and database boundaries are validated.

```bash
cd backend
$env:TEST_TARGET_URL="http://localhost:5000"; npm run test
```

---
*Built with speed, stability, and scale in mind.*
