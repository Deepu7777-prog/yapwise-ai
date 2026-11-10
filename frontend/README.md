# YapWise AI – Frontend Application
*Talk Smart. Speak Confidently.*

Production-ready React + TypeScript frontend for **YapWise AI**, an AI voice communication and interview preparation platform for college students, fresh graduates, and job seekers.

---

## Tech Stack

- **React 18** with **TypeScript** (Strict mode)
- **Vite** (with dev proxy `/api` &rarr; `http://localhost:8000`)
- **Tailwind CSS 3** (Deep navy `#0b1020`, card `#0f1530`, violet accents `#8b5cf6`, `#7c3aed`)
- **React Router v6**
- **Recharts** for performance trends and radar competency charts
- **lucide-react** for accessible iconography
- **Web Speech API** (`webkitSpeechRecognition` / `SpeechRecognition` & `speechSynthesis`) – zero audio uploads, 100% in-browser transcription
- **Plain Fetch API** – typed client with automatic JWT bearer tokens and 503 AI quota error recovery

---

## 10 Planned Pages & Routing

| Route | Page | Access |
|---|---|---|
| `/` | Landing Page | Public |
| `/login` | Sign In & Account Registration | Public |
| `/dashboard` | Student Dashboard | Protected |
| `/practice` | AI Voice Practice (Topic picker, turn-by-turn evaluations) | Protected |
| `/interview` | Mock Interview (HR & Technical 5-question simulator) | Protected |
| `/gd` | Group Discussion Simulator (Aarav, Meera & Rohan) | Protected |
| `/learning` | Personalized Learning Path & 4-Question Assessment Wizard | Protected |
| `/tasks` | Daily Tasks, Practice Drills & Scheduled Reminders | Protected |
| `/progress` | Progress Reports, 4-Skill Multi-Line Analytics | Protected |
| `/settings` | Placement Profile & Speech Privacy Settings | Protected |
| `*` | 404 Friendly Page | All |

---

## Local Setup & Execution Commands (PowerShell)

### 1. Ensure Backend is Running
The backend FastAPI service should be running at `http://localhost:8000`:
```powershell
# From project root directory
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Run the Frontend Development Server
In a separate PowerShell terminal:
```powershell
# From project root directory
cd frontend
npm run dev
```

The frontend will be available at:
```
http://localhost:5173
```
Requests made to `/api/*` are automatically proxied by Vite to `http://localhost:8000/api/*`.

### 3. Build for Production
To build and verify production bundles:
```powershell
cd frontend
npm run build
```
Preview the built production bundle:
```powershell
npm run preview
```
