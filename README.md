# 🎙️ YAPWISE AI — Voice, Interview & Speech Coaching Platform

YapWise AI is an AI-powered executive communication, voice interview, and speech telemetry platform. It evaluates speaking cadence (WPM), filler pauses, structural coherence (STAR framework), and technical depth using browser-native Speech APIs and Google Gemini.

---

## 🏛️ Architecture Overview

```
yapwise/
├── backend/                       # FastAPI + SQLAlchemy + SQLite + Gemini AI
│   ├── core/
│   │   ├── config.py              # Pydantic Settings, CORS, Secrets
│   │   ├── database.py            # SQLite Engine & Sessionmaker
│   │   ├── security.py            # Passlib Bcrypt, JWT tokens
│   │   └── dependencies.py        # Auth & demo user dependency injection
│   ├── models/                    # SQLAlchemy ORM Models
│   │   ├── user.py                # Users & streaks
│   │   ├── practice.py            # Speech practice telemetry & rubric
│   │   ├── interview.py           # HR & Technical interviews, GD chambers
│   │   ├── learning.py            # Personalized curriculum modules
│   │   └── reminder.py            # Goal reminders & audio preferences
│   ├── schemas/                   # Pydantic v2 validation schemas
│   ├── services/                  # Business & AI Services
│   │   ├── gemini_service.py      # Structured JSON prompt chains via Gemini
│   │   ├── speech_service.py      # WPM calculation & filler words parsing
│   │   ├── auth_service.py        # User authentication & starter modules
│   │   └── analytics_service.py   # Multi-axis radar metrics & readiness index
│   ├── routers/                   # API Endpoints
│   │   ├── auth.py                # Register, Login, Me, Profile
│   │   ├── practice.py            # Speech evaluation & session history
│   │   ├── interview.py           # HR & Technical multi-turn interviews
│   │   ├── gd.py                  # Multi-agent group discussion chamber
│   │   ├── learning.py            # Curriculum progress & exercises
│   │   ├── progress.py            # Longitudinal dashboard & timeline
│   │   └── reminders.py           # Practice cadence goals & settings
│   └── tests/                     # Pytest suite with in-memory SQLite
│
└── frontend/                      # React 18 + Vite + TypeScript + Tailwind CSS
    ├── src/
    │   ├── components/            # Reusable components
    │   │   ├── Navbar.tsx         # Responsive header with streak & links
    │   │   ├── Footer.tsx         # Platform footer & telemetry info
    │   │   ├── AudioVisualizer.tsx# Animated soundwave bars
    │   │   ├── VoiceRecorder.tsx  # Dual mode: Web Speech STT + Typed Fallback
    │   │   ├── FeedbackCard.tsx   # Detailed AI scorecard & TTS audio reader
    │   │   ├── ScoreRadar.tsx     # SVG 5-axis competency radar chart
    │   │   └── StatCard.tsx       # Metrics cards
    │   ├── hooks/                 # Custom React Hooks
    │   │   ├── useSpeechRecognition.ts # Browser STT & fallback handler
    │   │   ├── useSpeechSynthesis.ts   # Browser TTS voice reader
    │   │   └── useAuth.ts         # User session & 1-click demo access
    │   ├── services/
    │   │   ├── api.ts             # Fetch client with JWT authorization
    │   │   └── speech.ts          # Speech synthesis & voice management
    │   ├── pages/                 # 10 Planned Pages
    │   │   ├── HomePage.tsx       # Hero, feature grid, CTAs
    │   │   ├── AuthPage.tsx       # Sign in, Sign up, 1-click Demo Account
    │   │   ├── DashboardPage.tsx  # Readiness score, streak, radar, quick launch
    │   │   ├── VoicePracticePage.tsx # Extempore, pacing, filler words lab
    │   │   ├── HRInterviewPage.tsx   # AI HR Sarah (STAR framework)
    │   │   ├── TechInterviewPage.tsx # AI Architect Alex (System design defense)
    │   │   ├── GroupDiscussionPage.tsx # Multi-agent panel (Elena, Priya, Marcus)
    │   │   ├── LearningPage.tsx   # Personalized curriculum & skill drills
    │   │   ├── ProgressReportsPage.tsx # WPM & filler trends, longitudinal reports
    │   │   └── RemindersSettingsPage.tsx # Goals, TTS voice settings, profile
    │   └── tests/                 # Vitest frontend tests
```

---

## 🚀 Local Run Commands

### 1. Backend Setup (FastAPI + SQLite + Gemini)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux / macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env
# Edit .env and enter your GEMINI_API_KEY (optional for mock mode, required for live Gemini)

# Run backend test suite
pytest -v

# Start FastAPI development server
uvicorn backend.main:app --reload --port 8000
```
API Documentation will be live at: `http://localhost:8000/api/v1/docs`

---

### 2. Frontend Setup (React + Vite + Tailwind CSS)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables
copy .env.example .env

# Run frontend unit tests
npm run test

# Launch Vite development server
npm run dev
```
Application will be live at: `http://localhost:5173`

---

## 🔒 Security & Offline Resilience

1. **Gemini API Protection**: `GEMINI_API_KEY` is strictly confined to the backend environment variables and is never exposed to the client.
2. **Dual-Input Fallback**: If a microphone is unavailable or Web Speech API is not supported in the browser, users can effortlessly toggle to the **Typed Fallback** tab to submit their verbal answers.
3. **Graceful Fallback Scoring**: If Gemini API is offline or unconfigured, YapWise automatically switches to its heuristic scoring engine, ensuring zero crashes.
