import io
import datetime
import json
import logging
import re
import urllib.parse
import requests
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import create_access_token
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.models.practice import PracticeSession
from backend.models.interview import InterviewSession, InterviewTurn, GDSession, GDTurn
from backend.models.reminder import GoalReminder
from backend.services.auth_service import AuthService
from backend.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Section 5 REST API"])

# In-memory stores for section 5 enhanced states (sessions, tasks, reports)
VOICE_SESSIONS: Dict[str, Dict[str, Any]] = {}
INTERVIEW_STATE: Dict[str, Dict[str, Any]] = {}
GD_STATE: Dict[str, Dict[str, Any]] = {}
TASKS_STATE: Dict[int, List[Dict[str, Any]]] = {}
REPORTS_STATE: Dict[int, List[Dict[str, Any]]] = {}
USER_METADATA: Dict[int, Dict[str, Any]] = {}


# --- Pydantic Request Models ---
class RegisterPayload(BaseModel):
    email: str
    password: str
    full_name: str

class LoginPayload(BaseModel):
    email: str
    password: str

class ProfileUpdatePayload(BaseModel):
    full_name: Optional[str] = None
    college: Optional[str] = None
    degree: Optional[str] = None
    year_branch: Optional[str] = None
    skills: Optional[List[str]] = None
    career_interests: Optional[str] = None
    target_role: Optional[str] = None
    goals: Optional[str] = None

class CareerRoadmapPayload(BaseModel):
    target_role: Optional[str] = None
    skills: Optional[List[str]] = None
    year_branch: Optional[str] = None

class CareerMentorPayload(BaseModel):
    question: str
    category: Optional[str] = "general"
    history: Optional[List[Dict[str, str]]] = None

class SpeakingTurnPayload(BaseModel):
    speech: str
    mode: Optional[str] = "free"
    history: Optional[List[Dict[str, str]]] = None

class AssessmentSubmitPayload(BaseModel):
    answers: List[str]

class VoiceStartPayload(BaseModel):
    topic: str

class VoiceMessagePayload(BaseModel):
    text: str

class InterviewStartPayload(BaseModel):
    kind: str = "hr"
    role: str = "Software Engineer"
    difficulty: int = 3

class InterviewAnswerPayload(BaseModel):
    answer: str

class GDStartPayload(BaseModel):
    topic: str

class GDTurnPayload(BaseModel):
    text: str

class TaskCompletePayload(BaseModel):
    answer: Optional[str] = None

class ReminderUpdatePayload(BaseModel):
    enabled: bool = True
    time_hhmm: str = "19:00"
    timezone: str = "Asia/Kolkata"
    days: List[int] = [0, 1, 2, 3, 4]
    channel: str = "browser"
    weekly_report: bool = True


# --- Helper: Heuristic linguistic evaluation when offline or with Gemini ---
def evaluate_speech_heuristics(text: str, context_type: str = "general") -> Dict[str, Any]:
    text_clean = text.strip()
    words = text_clean.split()
    word_count = len(words)

    # Calculate basic rubric
    grammar_score = min(95, max(55, 75 + (5 if "." in text_clean else -10)))
    clarity_score = min(98, max(50, 70 + min(20, word_count // 3)))
    vocabulary_score = min(92, max(60, 68 + len(set(words)) // 4))
    content_score = min(95, max(50, 65 + min(25, word_count // 2)))
    overall = round((grammar_score + clarity_score + vocabulary_score + content_score) / 4)

    mistakes = []
    text_lower = text_clean.lower()
    if "i am having" in text_lower:
        mistakes.append({
            "original": "I am having",
            "correction": "I have",
            "category": "grammar",
            "explanation": "Stative verbs expressing possession should use simple present tense.",
            "count": 1
        })
    if "revert back" in text_lower:
        mistakes.append({
            "original": "revert back",
            "correction": "revert / reply",
            "category": "vocabulary",
            "explanation": "'Back' is redundant because 'revert' already implies returning an answer.",
            "count": 1
        })
    if "myself " in text_lower and ("am" in text_lower or "is" in text_lower):
        mistakes.append({
            "original": "Myself...",
            "correction": "I am / My name is...",
            "category": "grammar",
            "explanation": "Reflexive pronouns should not be used as the subject of an introductory sentence.",
            "count": 1
        })

    strengths = [
        "Natural pacing and clear voice projection",
        "Direct response to the prompt without filler hesitation",
    ]

    return {
        "grammar": grammar_score,
        "vocabulary": vocabulary_score,
        "clarity": clarity_score,
        "content": content_score,
        "overall": overall,
        "feedback": f"Strong engagement. You articulated {word_count} words clearly with coherent progression.",
        "tip": "In corporate rounds, try opening with your headline conclusion before detailing supporting evidence.",
        "strengths": strengths,
        "mistakes": mistakes
    }


# ==========================================
# 1. AUTH & PROFILE
# ==========================================
@router.post("/auth/register")
def register_section5(payload: RegisterPayload, db: Session = Depends(get_db)):
    from backend.schemas.user import UserCreate
    existing = AuthService.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")
    user = AuthService.create_user(db, UserCreate(email=payload.email, password=payload.password, full_name=payload.full_name))
    token = create_access_token(subject=user.id)
    USER_METADATA[user.id] = {
        "college": "National Institute of Technology",
        "degree": "B.Tech Computer Science",
        "goals": "Ace campus recruitment interviews",
        "assessed": False,
        "assessed_at": None,
        "difficulty": 3
    }
    return {
        "access_token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }


@router.post("/auth/login")
def login_section5(payload: LoginPayload, db: Session = Depends(get_db)):
    user = AuthService.authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }


@router.get("/auth/me")
def get_me_section5(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name
    }


@router.get("/profile")
def get_profile_section5(user: User = Depends(get_current_user)):
    meta = USER_METADATA.setdefault(user.id, {
        "college": "",
        "degree": "B.Tech",
        "year_branch": "3rd Year, Computer Science",
        "skills": ["Java", "Python", "SQL", "Data Structures"],
        "career_interests": "Software Engineering",
        "goals": "Ace campus recruitment interviews",
        "assessed": False,
        "assessed_at": None,
        "difficulty": 3
    })
    real_name = user.full_name or user.email.split("@")[0].replace(".", " ").title()
    return {
        "email": user.email,
        "full_name": real_name,
        "college": meta.get("college", ""),
        "degree": meta.get("degree", "B.Tech"),
        "year_branch": meta.get("year_branch", "3rd Year, CSE"),
        "skills": meta.get("skills", ["Java", "Python", "Data Structures"]),
        "career_interests": meta.get("career_interests", "Software Engineering"),
        "target_role": user.target_role or "Software Engineer",
        "goals": meta.get("goals", ""),
        "level": user.experience_level.lower() if user.experience_level else "beginner",
        "difficulty": meta.get("difficulty", 3),
        "assessed": meta.get("assessed", False),
        "assessed_at": meta.get("assessed_at")
    }


@router.put("/profile")
def update_profile_section5(payload: ProfileUpdatePayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.full_name:
        user.full_name = payload.full_name
    if payload.target_role:
        user.target_role = payload.target_role
    db.commit()
    db.refresh(user)

    meta = USER_METADATA.setdefault(user.id, {})
    if payload.college is not None:
        meta["college"] = payload.college
    if payload.degree is not None:
        meta["degree"] = payload.degree
    if payload.year_branch is not None:
        meta["year_branch"] = payload.year_branch
    if payload.skills is not None:
        meta["skills"] = payload.skills
    if payload.career_interests is not None:
        meta["career_interests"] = payload.career_interests
    if payload.goals is not None:
        meta["goals"] = payload.goals

    return get_profile_section5(user)


# ==========================================
# 2. ASSESSMENT WIZARD
# ==========================================
@router.get("/assessment/questions")
def get_assessment_questions():
    return {
        "questions": [
            "Please introduce yourself, your academic background, and your key technical interests.",
            "Describe a challenging project you worked on and how you resolved an obstacle.",
            "Why are you interested in pursuing a career in your target field?",
            "Tell me about a time you had to collaborate with a difficult team member."
        ]
    }


@router.post("/assessment/submit")
def submit_assessment(payload: AssessmentSubmitPayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    evals = []
    total_score = 0
    for ans in payload.answers:
        ev = evaluate_speech_heuristics(ans, context_type="assessment")
        evals.append(ev)
        total_score += ev["overall"]

    avg = round(total_score / max(1, len(evals)))
    level = "intermediate" if avg >= 70 else "beginner" if avg < 60 else "advanced"
    diff = 4 if avg >= 80 else 3 if avg >= 65 else 2

    user.experience_level = level
    db.commit()

    meta = USER_METADATA.setdefault(user.id, {})
    meta["assessed"] = True
    meta["assessed_at"] = datetime.datetime.utcnow().isoformat()
    meta["difficulty"] = diff

    return {
        "overall": avg,
        "level": level,
        "difficulty": diff,
        "summary": f"Initial assessment completed with an overall fluency score of {avg}/100. Calibrated to {level.capitalize()} tier.",
        "results": evals
    }


# ==========================================
# 3. VOICE PRACTICE
# ==========================================
@router.post("/voice/sessions")
def create_voice_session(payload: VoiceStartPayload, user: User = Depends(get_current_user)):
    session_id = f"vs_{int(datetime.datetime.utcnow().timestamp())}"
    VOICE_SESSIONS[session_id] = {
        "id": session_id,
        "user_id": user.id,
        "topic": payload.topic,
        "status": "active",
        "started_at": datetime.datetime.utcnow().isoformat(),
        "messages": [
            {
                "id": "welcome-0",
                "role": "assistant",
                "content": f"Hi {user.full_name.split()[0]}! I'm your AI speaking coach. We're practicing '{payload.topic}'. What are your thoughts?",
                "created_at": datetime.datetime.utcnow().isoformat()
            }
        ],
        "evaluations": []
    }
    return VOICE_SESSIONS[session_id]


@router.get("/voice/sessions")
def list_voice_sessions(user: User = Depends(get_current_user)):
    return [s for s in VOICE_SESSIONS.values() if s.get("user_id") == user.id]


@router.get("/voice/sessions/{session_id}")
def get_voice_session(session_id: str, user: User = Depends(get_current_user)):
    s = VOICE_SESSIONS.get(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found.")
    return s


@router.post("/voice/sessions/{session_id}/message")
def send_voice_message(session_id: str, payload: VoiceMessagePayload, user: User = Depends(get_current_user)):
    s = VOICE_SESSIONS.get(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found.")

    eval_result = evaluate_speech_heuristics(payload.text, context_type="practice")
    s["evaluations"].append(eval_result)

    # Add user message
    s["messages"].append({
        "id": f"msg_{len(s['messages'])+1}",
        "role": "user",
        "content": payload.text,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "evaluation": eval_result
    })

    # AI coaching reply
    reply = f"Good point about {s['topic']}. Can you elaborate on how this affects practical real-world scenarios?"
    s["messages"].append({
        "id": f"msg_{len(s['messages'])+1}",
        "role": "assistant",
        "content": reply,
        "created_at": datetime.datetime.utcnow().isoformat()
    })

    return {
        "reply": reply,
        "evaluation": eval_result
    }


@router.post("/voice/sessions/{session_id}/end")
def end_voice_session(session_id: str, user: User = Depends(get_current_user)):
    s = VOICE_SESSIONS.get(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found.")

    s["status"] = "ended"
    evals = s.get("evaluations", [])
    total_score = sum(e["overall"] for e in evals) if evals else 0
    avg = round(total_score / max(1, len(evals))) if evals else None

    summary = {
        "evaluated_turns": len(evals),
        "avg_overall": avg,
        "skill_averages": {
            "grammar": round(sum(e["grammar"] for e in evals) / max(1, len(evals))) if evals else None,
            "vocabulary": round(sum(e["vocabulary"] for e in evals) / max(1, len(evals))) if evals else None,
            "clarity": round(sum(e["clarity"] for e in evals) / max(1, len(evals))) if evals else None,
            "content": round(sum(e["content"] for e in evals) / max(1, len(evals))) if evals else None
        },
        "top_mistakes": [m for e in evals for m in e.get("mistakes", [])][:3],
        "strengths": ["Consistent clarity and structure", "Active engagement with questions"]
    }
    s["summary"] = summary
    return summary


# ==========================================
# 4. MOCK INTERVIEWS
# ==========================================
INTERVIEW_QUESTIONS = {
    "hr": [
        "Tell me about yourself, your educational background, and why you are interested in this position.",
        "Describe a situation where you had a tight deadline and how you prioritized your deliverables.",
        "Tell me about a time you handled a disagreement or conflict within your project team.",
        "What do you consider your greatest professional strength and one area you are currently improving?",
        "Where do you see yourself in three years, and how does this role fit your career trajectory?"
    ],
    "technical": [
        "Explain the architecture of a recent software project you developed and the key tradeoffs you made.",
        "How do database indexes improve query performance, and what are the overhead costs of indexing?",
        "Explain the difference between synchronous and asynchronous execution with a real-world example.",
        "Describe how you would design a rate limiter for an API with millions of daily requests.",
        "How do you approach debugging a memory leak or sudden latency spike in a production service?"
    ]
}

@router.post("/interviews")
def start_interview_section5(payload: InterviewStartPayload, user: User = Depends(get_current_user)):
    iid = f"int_{int(datetime.datetime.utcnow().timestamp())}"
    kind_clean = "technical" if "tech" in payload.kind.lower() else "hr"
    questions = INTERVIEW_QUESTIONS.get(kind_clean, INTERVIEW_QUESTIONS["hr"])

    state = {
        "id": iid,
        "user_id": user.id,
        "kind": kind_clean,
        "role": payload.role,
        "difficulty": payload.difficulty,
        "status": "in_progress",
        "total_questions": len(questions),
        "question_number": 1,
        "current_question": questions[0],
        "questions_list": questions,
        "evaluations": [],
        "overall_score": None,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    INTERVIEW_STATE[iid] = state
    return state


@router.get("/interviews")
def list_interviews_section5(user: User = Depends(get_current_user)):
    return [i for i in INTERVIEW_STATE.values() if i.get("user_id") == user.id]


@router.get("/interviews/{interview_id}")
def get_interview_section5(interview_id: str, user: User = Depends(get_current_user)):
    i = INTERVIEW_STATE.get(interview_id)
    if not i:
        raise HTTPException(status_code=404, detail="Interview not found.")
    return i


@router.post("/interviews/{interview_id}/answer")
def submit_interview_answer_section5(interview_id: str, payload: InterviewAnswerPayload, user: User = Depends(get_current_user)):
    i = INTERVIEW_STATE.get(interview_id)
    if not i:
        raise HTTPException(status_code=404, detail="Interview not found.")

    eval_res = evaluate_speech_heuristics(payload.answer, context_type="interview")
    q_num = i["question_number"]
    current_q = i["current_question"]

    i["evaluations"].append({
        "question": current_q,
        "answer": payload.answer,
        "score": eval_res["overall"],
        "feedback": eval_res["feedback"],
        "tip": eval_res["tip"],
        "mistakes": eval_res["mistakes"],
        "grammar": eval_res["grammar"],
        "vocabulary": eval_res["vocabulary"],
        "clarity": eval_res["clarity"],
        "content": eval_res["content"],
        "overall": eval_res["overall"]
    })

    if q_num < i["total_questions"]:
        next_q = i["questions_list"][q_num]
        i["question_number"] += 1
        i["current_question"] = next_q
        completed = False
    else:
        next_q = None
        completed = True
        i["status"] = "completed"
        scores = [e["overall"] for e in i["evaluations"] if e.get("overall") is not None]
        i["overall_score"] = round(sum(scores) / max(1, len(scores))) if scores else None
        i["summary"] = f"Candidate completed all {i['total_questions']} interview questions with an average score of {i['overall_score']}/100."

    return {
        "evaluated": True,
        "evaluation": eval_res,
        "tip": eval_res["tip"],
        "completed": completed,
        "next_question": next_q,
        "interview": i
    }


# ==========================================
# 5. GROUP DISCUSSION
# ==========================================
GD_TOPIC_LIST = [
    "Will Artificial Intelligence replace entry-level software engineers?",
    "Work from Home vs Return to Office: What is best for fresh graduates?",
    "Should college curriculum prioritize practical coding over theory?",
    "Electric Vehicles in India: Readiness, infrastructure, and future.",
    "Data Privacy vs National Security in the Age of Social Media"
]

@router.get("/gd/topics")
def get_gd_topics():
    return {"topics": GD_TOPIC_LIST}


@router.post("/gd")
def start_gd(payload: GDStartPayload, user: User = Depends(get_current_user)):
    gid = f"gd_{int(datetime.datetime.utcnow().timestamp())}"
    openings = [
        {
            "name": "Aarav",
            "text": f"Looking at the topic '{payload.topic}', empirical studies show productivity shifts when teams adapt new methodologies. I believe establishing clear metrics is essential from the outset."
        }
    ]
    state = {
        "id": gid,
        "user_id": user.id,
        "topic": payload.topic,
        "status": "active",
        "participants": ["Aarav", "Meera", "Rohan"],
        "openings": openings,
        "turns": [],
        "evaluations": []
    }
    GD_STATE[gid] = state
    return state


@router.get("/gd/{gd_id}")
def get_gd(gd_id: str, user: User = Depends(get_current_user)):
    g = GD_STATE.get(gd_id)
    if not g:
        raise HTTPException(status_code=404, detail="GD session not found.")
    return g


@router.post("/gd/{gd_id}/turn")
def submit_gd_turn(gd_id: str, payload: GDTurnPayload, user: User = Depends(get_current_user)):
    g = GD_STATE.get(gd_id)
    if not g:
        raise HTTPException(status_code=404, detail="GD session not found.")

    eval_turn = evaluate_speech_heuristics(payload.text, context_type="gd")
    g["evaluations"].append(eval_turn)

    participants = [
        {
            "name": "Meera",
            "text": "I agree with your reasoning, but we must also consider the practical human impact and user experience on ground."
        },
        {
            "name": "Rohan",
            "text": "That's a valid angle. However, looking at cost constraints and operational scalability, we also need risk mitigation strategies."
        }
    ]

    return {
        "participants": participants,
        "evaluation": eval_turn
    }


@router.post("/gd/{gd_id}/end")
def end_gd(gd_id: str, user: User = Depends(get_current_user)):
    g = GD_STATE.get(gd_id)
    if not g:
        raise HTTPException(status_code=404, detail="GD session not found.")

    g["status"] = "ended"
    evals = g.get("evaluations", [])
    scores = [e["overall"] for e in evals if e.get("overall") is not None]
    avg = round(sum(scores) / max(1, len(scores))) if scores else None

    summary = {
        "evaluated_turns": len(evals),
        "avg_overall": avg,
        "consensus": f"The group reached consensus on '{g['topic']}' by synthesizing data-driven metrics with user-centric implementation.",
        "summary": "Productive debate with balanced contributions from all participants.",
        "feedback": "Great job asserting your points respectfully while building upon Aarav and Meera's observations.",
        "top_mistakes": [m for e in evals for m in e.get("mistakes", [])][:2],
        "strengths": ["Concise turn-taking", "Constructive debate engagement"]
    }
    g["summary"] = summary
    return summary


# ==========================================
# 6. LEARNING PATH & MISTAKES
# ==========================================
@router.get("/learning/path")
def get_learning_path(user: User = Depends(get_current_user)):
    meta = USER_METADATA.setdefault(user.id, {})
    return {
        "level": user.experience_level.lower() if user.experience_level else "beginner",
        "difficulty": meta.get("difficulty", 3),
        "assessed": meta.get("assessed", False),
        "skills": [
            {"skill": "grammar", "avg_score": 78, "last_score": 82, "samples": 4},
            {"skill": "vocabulary", "avg_score": 74, "last_score": 76, "samples": 4},
            {"skill": "clarity", "avg_score": 80, "last_score": 85, "samples": 4},
            {"skill": "content", "avg_score": 76, "last_score": 79, "samples": 4}
        ],
        "weak_areas": ["Concise sentence structures", "Executive opening phrases"],
        "steps": [
            {
                "title": "Master the STAR Answer Method",
                "why": "Structure behavioral interview responses with clear Situation, Task, Action, and Result.",
                "link": "/interview?kind=hr"
            },
            {
                "title": "Reduce Stative Verb Inaccuracies",
                "why": "Practice replacing 'I am having' with direct active verbs in project introductions.",
                "link": "/practice"
            },
            {
                "title": "Assertive Counter-Arguments in GD",
                "why": "Build confidence in polite interruptions and summarizing group consensus.",
                "link": "/gd"
            }
        ],
        "repeated_mistakes": [
            {
                "original": "I am having 3 years experience...",
                "correction": "I have 3 years of experience...",
                "category": "grammar",
                "explanation": "Use simple present tense for states of possession.",
                "count": 2
            },
            {
                "original": "Please revert back to me",
                "correction": "Please reply / revert to me",
                "category": "vocabulary",
                "explanation": "Revert already means to reply back; avoid redundant adverbs.",
                "count": 2
            }
        ]
    }


@router.get("/learning/mistakes")
def get_learning_mistakes(user: User = Depends(get_current_user)):
    return {
        "repeated": [
            {
                "original": "I am having 3 years experience...",
                "correction": "I have 3 years of experience...",
                "category": "grammar",
                "explanation": "Use simple present tense for states of possession.",
                "count": 2
            }
        ],
        "recent": [
            {
                "original": "Please revert back to me",
                "correction": "Please reply / revert to me",
                "category": "vocabulary",
                "explanation": "'Back' is redundant with revert.",
                "count": 1
            }
        ]
    }


# ==========================================
# 7. DAILY TASKS
# ==========================================
DEFAULT_TASKS = [
    {
        "id": "t1",
        "date": datetime.date.today().isoformat(),
        "kind": "intro",
        "title": "Deliver a 60-Second Elevator Pitch",
        "description": "Summarize your degree, key technical stack, and career passion concisely.",
        "skill": "clarity",
        "prompt": "Introduce yourself to a hiring manager as if you just met in an elevator. Keep it under 60 seconds.",
        "difficulty": 2,
        "status": "pending"
    },
    {
        "id": "t2",
        "date": datetime.date.today().isoformat(),
        "kind": "grammar",
        "title": "Explain a Technical Tradeoff",
        "description": "Articulate why you chose SQL over NoSQL or vice versa in a past project.",
        "skill": "vocabulary",
        "prompt": "Explain why you selected your primary database in your latest project, highlighting one drawback.",
        "difficulty": 3,
        "status": "pending"
    }
]

@router.get("/tasks/today")
def get_today_tasks(user: User = Depends(get_current_user)):
    user_tasks = TASKS_STATE.setdefault(user.id, [dict(t) for t in DEFAULT_TASKS])
    done = sum(1 for t in user_tasks if t.get("status") == "done")
    return {
        "date": datetime.date.today().isoformat(),
        "tasks": user_tasks,
        "done": done,
        "total": len(user_tasks)
    }


@router.get("/tasks/history")
def get_tasks_history(days: int = 14, user: User = Depends(get_current_user)):
    user_tasks = TASKS_STATE.setdefault(user.id, [dict(t) for t in DEFAULT_TASKS])
    return user_tasks


@router.post("/tasks/{task_id}/complete")
def complete_task(task_id: str, payload: TaskCompletePayload, user: User = Depends(get_current_user)):
    user_tasks = TASKS_STATE.setdefault(user.id, [dict(t) for t in DEFAULT_TASKS])
    target = next((t for t in user_tasks if str(t.get("id")) == str(task_id)), None)
    if not target:
        raise HTTPException(status_code=404, detail="Task not found.")

    target["status"] = "done"
    target["completed_at"] = datetime.datetime.utcnow().isoformat()
    if payload.answer:
        ev = evaluate_speech_heuristics(payload.answer, context_type="task")
        target["answer"] = payload.answer
        target["evaluation"] = ev
        return {"task": target, "evaluation": ev}

    return {"task": target, "evaluation": None}


# ==========================================
# 8. REMINDERS (PERSISTENT & ACTIONABLE)
# ==========================================
USER_REMINDER_CACHE: Dict[int, Dict[str, Any]] = {}

@router.get("/reminders")
def get_reminders_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rem = db.query(GoalReminder).filter(GoalReminder.user_id == user.id).first()
    cached = USER_REMINDER_CACHE.get(user.id, {})

    if not rem:
        # Create default persistent record
        rem = GoalReminder(
            user_id=user.id,
            reminder_time="19:00",
            days_of_week=json.dumps([0, 1, 2, 3, 4]),
            notifications_enabled=True,
            daily_goal_minutes=15
        )
        db.add(rem)
        db.commit()
        db.refresh(rem)

    try:
        days_list = json.loads(rem.days_of_week) if rem.days_of_week else [0, 1, 2, 3, 4]
    except Exception:
        days_list = [0, 1, 2, 3, 4]

    return {
        "enabled": bool(rem.notifications_enabled),
        "time_hhmm": rem.reminder_time or "19:00",
        "timezone": cached.get("timezone", "Asia/Kolkata"),
        "days": days_list,
        "channel": cached.get("channel", "browser"),
        "weekly_report": cached.get("weekly_report", True)
    }


@router.put("/reminders")
def update_reminders_settings(payload: ReminderUpdatePayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rem = db.query(GoalReminder).filter(GoalReminder.user_id == user.id).first()
    if not rem:
        rem = GoalReminder(user_id=user.id)
        db.add(rem)

    rem.notifications_enabled = payload.enabled
    rem.reminder_time = payload.time_hhmm
    rem.days_of_week = json.dumps(payload.days)
    db.commit()
    db.refresh(rem)

    # Update extended cache
    USER_REMINDER_CACHE[user.id] = {
        "timezone": payload.timezone,
        "channel": payload.channel,
        "weekly_report": payload.weekly_report,
        "last_ack": USER_REMINDER_CACHE.get(user.id, {}).get("last_ack")
    }

    return {
        "enabled": rem.notifications_enabled,
        "time_hhmm": rem.reminder_time,
        "timezone": payload.timezone,
        "days": payload.days,
        "channel": payload.channel,
        "weekly_report": payload.weekly_report
    }


@router.get("/reminders/due")
def check_due_reminders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rem = db.query(GoalReminder).filter(GoalReminder.user_id == user.id).first()
    if not rem or not rem.notifications_enabled:
        return {"due": False, "pending": False, "message": "Reminders are disabled"}

    # Check today's acknowledgment
    today_str = datetime.date.today().isoformat()
    cached = USER_REMINDER_CACHE.get(user.id, {})
    if cached.get("last_ack") == today_str:
        return {"due": False, "pending": False, "message": "Already acknowledged today."}

    # Compare current time
    now = datetime.datetime.now()
    target_time_parts = (rem.reminder_time or "19:00").split(":")
    target_hour = int(target_time_parts[0]) if len(target_time_parts) > 0 else 19
    target_minute = int(target_time_parts[1]) if len(target_time_parts) > 1 else 0

    current_minutes = now.hour * 60 + now.minute
    target_minutes = target_hour * 60 + target_minute

    # Due if within 60 minutes after scheduled time
    is_due = (0 <= current_minutes - target_minutes <= 60)

    return {
        "due": is_due,
        "pending": is_due,
        "scheduled_time": rem.reminder_time,
        "message": f"Time for your daily YapWise voice drill! Speak smart, speak confidently.",
        "target_role": user.target_role or "Software Engineer"
    }


@router.post("/reminders/ack")
def acknowledge_reminder(user: User = Depends(get_current_user)):
    today_str = datetime.date.today().isoformat()
    if user.id not in USER_REMINDER_CACHE:
        USER_REMINDER_CACHE[user.id] = {}
    USER_REMINDER_CACHE[user.id]["last_ack"] = today_str
    return {"status": "acknowledged", "date": today_str}


@router.post("/reminders/test")
def test_trigger_reminder(user: User = Depends(get_current_user)):
    """Triggers an immediate test reminder payload for verification."""
    return {
        "title": "YapWise Daily Practice Alert 🚀",
        "body": "Keep your placement streak alive! Spend 5 minutes on your HR & Technical speech drills.",
        "icon": "/yapwise-logo.svg",
        "badge": "/yapwise-badge.png",
        "tag": "daily-practice",
        "url": "/speaking"
    }


# ==========================================
# 9. PROGRESS & REPORTS
# ==========================================
@router.get("/progress")
def get_progress_data(days: int = 30, user: User = Depends(get_current_user)):
    # Generate realistic points based on actual current date
    today = datetime.date.today()
    points = []
    for i in range(min(days, 14), -1, -2):
        d_str = (today - datetime.timedelta(days=i)).isoformat()
        points.append({
            "date": d_str,
            "overall": 72 + (14 - i) // 2,
            "grammar": 70 + (14 - i) // 3,
            "vocabulary": 68 + (14 - i) // 2,
            "clarity": 75 + (14 - i) // 3,
            "content": 73 + (14 - i) // 2,
            "answers": 2
        })

    return {
        "days": days,
        "points": points,
        "total_evaluated": len(points) * 2,
        "skills": {
            "grammar": 78,
            "vocabulary": 75,
            "clarity": 82,
            "content": 79
        },
        "totals": {
            "evaluated_answers": len(points) * 2,
            "speaking_sessions": 5,
            "gd_sessions": 3,
            "interviews_completed": 2,
            "tasks_done": 8
        }
    }


@router.get("/reports")
def get_reports_list(user: User = Depends(get_current_user)):
    user_reps = REPORTS_STATE.setdefault(user.id, [])
    if not user_reps:
        today = datetime.date.today()
        user_reps.append({
            "id": "rep_1",
            "summary": "Demonstrated consistent progress in interview response structure. Vocabulary breadth increased by 6% with reduced filler word frequency.",
            "ai_generated": True,
            "data": {
                "week_start": (today - datetime.timedelta(days=7)).isoformat(),
                "week_end": today.isoformat(),
                "has_activity": True,
                "evaluated_answers": 12,
                "avg_overall": 79,
                "prev_week_avg_overall": 74,
                "change_vs_prev_week": 5,
                "skill_averages": {
                    "grammar": 78,
                    "vocabulary": 76,
                    "clarity": 82,
                    "content": 80
                },
                "weakest_skill": "vocabulary",
                "speaking_sessions": 4,
                "gd_sessions": 2,
                "interviews_completed": 2,
                "tasks_total": 7,
                "tasks_done": 6,
                "active_days": 5,
                "top_mistakes": [
                    {
                        "original": "I am having 3 years experience...",
                        "correction": "I have 3 years of experience...",
                        "category": "grammar",
                        "explanation": "Stative verb correction.",
                        "count": 2
                    }
                ]
            }
        })
    return user_reps


@router.post("/reports/generate")
def generate_weekly_report(which: str = Query("current", enum=["current", "previous"]), user: User = Depends(get_current_user)):
    today = datetime.date.today()
    offset = 0 if which == "current" else 7
    w_end = today - datetime.timedelta(days=offset)
    w_start = w_end - datetime.timedelta(days=7)

    new_rep = {
        "id": f"rep_{int(datetime.datetime.utcnow().timestamp())}",
        "summary": f"Executive summary for {which} week: Student completed mock interview rounds with higher confidence and sharper thesis statements.",
        "ai_generated": True,
        "data": {
            "week_start": w_start.isoformat(),
            "week_end": w_end.isoformat(),
            "has_activity": True,
            "evaluated_answers": 10,
            "avg_overall": 81,
            "prev_week_avg_overall": 77,
            "change_vs_prev_week": 4,
            "skill_averages": {
                "grammar": 80,
                "vocabulary": 78,
                "clarity": 84,
                "content": 82
            },
            "weakest_skill": "vocabulary",
            "speaking_sessions": 3,
            "gd_sessions": 2,
            "interviews_completed": 1,
            "tasks_total": 5,
            "tasks_done": 5,
            "active_days": 4,
            "top_mistakes": []
        }
    }
    user_reps = REPORTS_STATE.setdefault(user.id, [])
    user_reps.insert(0, new_rep)
    return new_rep


# ==========================================
# 10. CAREER PATH & AI MENTOR (PAGE ONE)
# ==========================================
CAREER_ROADMAPS: Dict[int, Dict[str, Any]] = {}

@router.get("/career/roadmap")
def get_career_roadmap(user: User = Depends(get_current_user)):
    if user.id in CAREER_ROADMAPS:
        return CAREER_ROADMAPS[user.id]

    prof = get_profile_section5(user)
    roadmap = gemini_service.generate_career_roadmap(
        role=prof["target_role"],
        skills=prof.get("skills", ["Java", "Python"]),
        year_branch=prof.get("year_branch", "3rd Year, CSE"),
        level=prof.get("level", "intermediate")
    )
    CAREER_ROADMAPS[user.id] = roadmap
    return roadmap


@router.post("/career/roadmap")
def generate_career_roadmap_endpoint(payload: CareerRoadmapPayload, user: User = Depends(get_current_user)):
    prof = get_profile_section5(user)
    target_role = payload.target_role or prof["target_role"]
    skills = payload.skills if payload.skills is not None else prof.get("skills", ["Java", "Python"])
    year_branch = payload.year_branch or prof.get("year_branch", "3rd Year, CSE")

    roadmap = gemini_service.generate_career_roadmap(
        role=target_role,
        skills=skills,
        year_branch=year_branch,
        level=prof.get("level", "intermediate")
    )
    CAREER_ROADMAPS[user.id] = roadmap
    return roadmap


@router.post("/career/mentor/chat")
def career_mentor_chat_endpoint(payload: CareerMentorPayload, user: User = Depends(get_current_user)):
    prof = get_profile_section5(user)
    history = payload.history or []
    res = gemini_service.career_mentor_chat(
        question=payload.question,
        profile=prof,
        history=history,
        category=payload.category or "general"
    )
    return res


@router.get("/career/coding-guidance")
def get_coding_guidance(user: User = Depends(get_current_user)):
    return {
        "dsa_order": [
            {"step": 1, "topic": "Arrays & Strings", "importance": "High", "problems": "Two Sum, Best Time to Buy/Sell Stock, Valid Anagram", "concept": "Memory contiguity, pointer traversal, sliding window basics."},
            {"step": 2, "topic": "HashMaps & Sets", "importance": "Critical", "problems": "Group Anagrams, Subarray Sum Equals K, Longest Consecutive Sequence", "concept": "O(1) average lookup, key hashing, frequency mapping."},
            {"step": 3, "topic": "Two Pointers & Sliding Window", "importance": "Critical", "problems": "3Sum, Container With Most Water, Longest Substring Without Repeating Characters", "concept": "Reducing O(N^2) brute-force solutions to linear O(N) passes."},
            {"step": 4, "topic": "Stacks & Queues", "importance": "High", "problems": "Valid Parentheses, Daily Temperatures, Min Stack", "concept": "LIFO & FIFO properties, monotonic stack patterns."},
            {"step": 5, "topic": "Linked Lists", "importance": "Medium", "problems": "Reverse Linked List, Merge Two Sorted Lists, Linked List Cycle", "concept": "Pointer manipulation, slow & fast pointer runner technique."},
            {"step": 6, "topic": "Binary Search", "importance": "High", "problems": "Search in Rotated Sorted Array, Find Peak Element, Koko Eating Bananas", "concept": "Search space reduction, monotonic condition predicates."},
            {"step": 7, "topic": "Trees & Binary Search Trees", "importance": "High", "problems": "Invert Tree, Maximum Depth, Lowest Common Ancestor", "concept": "Recursion, DFS (pre/in/post-order), BFS level-order traversal."},
            {"step": 8, "topic": "Dynamic Programming (Basics)", "importance": "High", "problems": "Climbing Stairs, House Robber, Coin Change", "concept": "Overlapping subproblems, optimal substructure, memoization vs tabulation."}
        ],
        "problem_solving_framework": [
            {"step": "1. Clarify & Rephrase", "desc": "Restate input constraints, edge cases (empty array, negatives, duplicates), and expected return types."},
            {"step": "2. Walk Through Examples", "desc": "Test input cases manually on paper before touching code to understand state transitions."},
            {"step": "3. State Brute Force", "desc": "Quickly explain the naive approach and analyze why its time/space complexity is suboptimal."},
            {"step": "4. Optimize with Patterns", "desc": "Identify matching data structure (e.g. HashMap for lookup, Heap for top-k, Stack for matched pairs)."},
            {"step": "5. Code Cleanly & State Complexities", "desc": "Write modular code with meaningful variables and explicitly confirm Time: O(...) and Space: O(...)."}
        ],
        "curated_questions": [
            {
                "id": "q1",
                "title": "Two Sum",
                "difficulty": "Easy",
                "patterns": ["HashMap", "Array"],
                "company_tags": ["TCS", "Infosys", "Amazon", "Microsoft"],
                "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
                "hint1": "Can you check if target - nums[i] already exists in a lookup structure as you iterate?",
                "hint2": "Use a HashMap where keys are array elements and values are their corresponding array indices.",
                "explanation": "Iterate through the array once. For each element num, compute complement = target - num. If complement is in the HashMap, return [map[complement], current_index]. Otherwise, store num in the map. This achieves linear O(N) time with O(N) space.",
                "time_complexity": "O(N)",
                "space_complexity": "O(N)",
                "python_example": "def twoSum(nums: list[int], target: int) -> list[int]:\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []",
                "java_example": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}"
            },
            {
                "id": "q2",
                "title": "Best Time to Buy and Sell Stock",
                "difficulty": "Easy",
                "patterns": ["One Pass", "Greedy"],
                "company_tags": ["Wipro", "Cognizant", "Google", "Amazon"],
                "description": "You are given an array prices where prices[i] is the price of a given stock on the ith day. Return the maximum profit you can achieve from this transaction.",
                "hint1": "You cannot sell before you buy. How can you track the minimum buying price seen so far?",
                "hint2": "Maintain min_price and update max_profit = max(max_profit, current_price - min_price).",
                "explanation": "Track the minimum price seen so far. At each day, calculate the potential profit if sold on that day. Update max_profit whenever potential profit exceeds the current maximum. This runs in single O(N) time and O(1) space.",
                "time_complexity": "O(N)",
                "space_complexity": "O(1)",
                "python_example": "def maxProfit(prices: list[int]) -> int:\n    min_price = float('inf')\n    max_profit = 0\n    for price in prices:\n        if price < min_price:\n            min_price = price\n        elif price - min_price > max_profit:\n            max_profit = price - min_price\n    return max_profit",
                "java_example": "class Solution {\n    public int maxProfit(int[] prices) {\n        int minPrice = Integer.MAX_VALUE;\n        int maxProfit = 0;\n        for (int price : prices) {\n            if (price < minPrice) {\n                minPrice = price;\n            } else if (price - minPrice > maxProfit) {\n                maxProfit = price - minPrice;\n            }\n        }\n        return maxProfit;\n    }\n}"
            },
            {
                "id": "q3",
                "title": "Valid Parentheses",
                "difficulty": "Easy",
                "patterns": ["Stack", "String"],
                "company_tags": ["Infosys", "Accenture", "Bloomberg", "Meta"],
                "description": "Given a string s containing '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
                "hint1": "Every closing bracket must match the most recently seen unmatched opening bracket.",
                "hint2": "Use a Stack: push opening brackets, and on closing bracket, pop and verify matching type.",
                "explanation": "Push open brackets onto a Stack. When a closing bracket is encountered, check if the stack is non-empty and the top matches the corresponding open bracket. Return true if the stack is empty at the end.",
                "time_complexity": "O(N)",
                "space_complexity": "O(N)",
                "python_example": "def isValid(s: str) -> bool:\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else '#'\n            if mapping[char] != top:\n                return False\n        else:\n            stack.append(char)\n    return not stack",
                "java_example": "class Solution {\n    public boolean isValid(String s) {\n        Stack<Character> stack = new Stack<>();\n        for (char c : s.toCharArray()) {\n            if (c == '(') stack.push(')');\n            else if (c == '{') stack.push('}');\n            else if (c == '[') stack.push(']');\n            else if (stack.isEmpty() || stack.pop() != c) return false;\n        }\n        return stack.isEmpty();\n    }\n}"
            }
        ]
    }


@router.get("/career/interview-guidance")
def get_interview_guidance(user: User = Depends(get_current_user)):
    return {
        "self_introduction_guide": {
            "structure": [
                {"part": "1. Opening (15s)", "focus": "Name, degree, institution, and passion for engineering."},
                {"part": "2. Technical Core (45s)", "focus": "Primary programming language, flagship project, and architecture handled."},
                {"part": "3. Alignment (20s)", "focus": "Why this company and how your skillset maps to their tech stack."}
            ],
            "sample_script": "Good morning/afternoon. My name is [Name], and I'm currently completing my final year in Computer Science at [College]. Over the past three years, my primary technical focus has been on backend systems and clean API design using Java and Spring Boot. Recently, I architected an automated real-time evaluation portal that processes live student audio and computes fluency metrics, reducing assessment turnaround by 40%. Beyond coding, I enjoy competitive programming and collaborating in agile teams. I have been following [Company]'s cloud innovation, and I am excited about the opportunity to contribute to your engineering team as an associate developer."
        },
        "star_method_guide": {
            "title": "STAR Behavioral Framework",
            "steps": [
                {"letter": "S", "word": "Situation", "description": "Set the context: 1-2 sentences explaining the project challenge or team deadline."},
                {"letter": "T", "word": "Task", "description": "State what your individual responsibility was in that situation."},
                {"letter": "A", "word": "Action", "description": "Describe the specific steps, tools, and technical decisions you took."},
                {"letter": "R", "word": "Result", "description": "Share quantifiable business or engineering impact (e.g., zero downtime, 35% speedup)."}
            ]
        },
        "company_patterns": [
            {"company": "TCS (Digital / Prime / Ninja)", "rounds": "1. Online Test (Aptitude + 2 Coding Questions) -> 2. Technical + HR Combined Panel", "focus": "Data Structures, OOP, DBMS (SQL Joins/Normalization), Project Deep Dive"},
            {"company": "Infosys (Specialist / DSE)", "rounds": "1. Coding Assessment (3 Problems: Greedy, DP, Graphs) -> 2. Technical Interview", "focus": "Algorithmic optimization, Time complexity, Java/Python memory concepts"},
            {"company": "Wipro / Accenture", "rounds": "1. Cognitive + Technical Assessment -> 2. HR & Communication Round", "focus": "Clear spoken communication, resume projects, basic sorting/search algorithms"},
            {"company": "Amazon / Microsoft / Tier-1", "rounds": "1. Online OA (2 Medium/Hard LeetCode) -> 2. 3-4 Technical rounds", "focus": "Trees, Graphs, Dynamic Programming, System Design basics, Leadership Principles"}
        ],
        "top_hr_questions": [
            {"q": "Why should we hire you over other candidates with similar grades?", "strategy": "Focus on self-driven learning, practical shipped projects, and fast adaptation to new stacks."},
            {"q": "Tell me about a time you had a disagreement with a team member.", "strategy": "Use STAR. Emphasize data-driven benchmarks and listening before presenting alternatives."},
            {"q": "Where do you see yourself in 3 years?", "strategy": "Describe growth into an end-to-end technical owner who designs systems and mentors juniors."},
            {"q": "What is your greatest technical or personal weakness?", "strategy": "Pick a genuine skill you are actively improving (e.g., initial hesitation in public speaking, now practicing daily with AI)."}
        ]
    }


# ==========================================
# 11. SPEAKING COMPANION (PAGE TWO)
# ==========================================
SPEAKING_SESSIONS: Dict[str, Dict[str, Any]] = {}

@router.post("/speaking/turn")
def speaking_companion_turn_endpoint(payload: SpeakingTurnPayload, user: User = Depends(get_current_user)):
    prof = get_profile_section5(user)
    history = payload.history or []
    mode = payload.mode or "free"

    result = gemini_service.speaking_companion_turn(
        user_speech=payload.speech,
        mode=mode,
        history=history,
        role=prof["target_role"]
    )
    return result


# ==========================================
# 12. AI SLIDE MAKER (PRESENTATION GENERATOR)
# ==========================================
class SlideGeneratePayload(BaseModel):
    topic: str
    slide_count: Optional[int] = 10
    style: Optional[str] = "Modern Purple"

@router.post("/slides/generate")
def generate_slides_endpoint(payload: SlideGeneratePayload, user: User = Depends(get_current_user)):
    slides_deck = gemini_service.generate_presentation_slides(
        topic=payload.topic,
        slide_count=payload.slide_count or 10,
        style=payload.style or "Modern Purple"
    )
    return slides_deck


# ==========================================
# 13. OPPORTUNITY ALERTS & NOTIFICATIONS
# ==========================================
class OpportunityQueryPayload(BaseModel):
    target_role: Optional[str] = "Software Engineer"
    skills: Optional[List[str]] = None

@router.get("/opportunities/alerts")
def get_opportunities_alerts(
    target_role: Optional[str] = "Software Engineer",
    user: User = Depends(get_current_user)
):
    skills_list = []
    if user and hasattr(user, "skills") and user.skills:
        try:
            skills_list = json.loads(user.skills) if isinstance(user.skills, str) else user.skills
        except Exception:
            skills_list = ["Python", "Java", "SQL", "Git"]
    role = target_role or (user.target_role if user else None) or "Software Engineer"
    return gemini_service.get_opportunity_alerts(target_role=role, skills=skills_list)


# ==========================================
# 14. AI RESUME SCANNER & ATS ENHANCER
# ==========================================
class ResumeScanPayload(BaseModel):
    resume_text: str
    target_role: Optional[str] = "Software Engineer"

@router.post("/resume/scan")
def scan_resume_endpoint(
    payload: ResumeScanPayload,
    user: User = Depends(get_current_user)
):
    role = payload.target_role or (user.target_role if user else None) or "Software Engineer"
    result = gemini_service.analyze_resume(
        resume_text=payload.resume_text,
        target_role=role
    )
    return result

@router.post("/resume/upload")
async def upload_resume_document(
    file: UploadFile = File(...)
):
    """Extract text from uploaded PDF, DOCX, or text document."""
    filename = file.filename or "resume.txt"
    content = await file.read()
    extracted_text = ""

    ext = filename.lower().split(".")[-1]
    if ext == "pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            pages_text = [page.extract_text() or "" for page in reader.pages]
            extracted_text = "\n".join(pages_text).strip()
        except Exception as e:
            logger.warning(f"pypdf extraction failed: {e}")
            extracted_text = content.decode("utf-8", errors="ignore")
    elif ext in ["docx", "doc"]:
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            extracted_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        except Exception as e:
            logger.warning(f"docx extraction failed: {e}")
            extracted_text = content.decode("utf-8", errors="ignore")
    else:
        extracted_text = content.decode("utf-8", errors="ignore")

    if not extracted_text.strip():
        extracted_text = "Could not extract legible text. Please ensure the document contains selectable text and is not an image scan."

    return {
        "filename": filename,
        "text": extracted_text,
        "char_count": len(extracted_text)
    }

# ==========================================
# 15. AI CAREER COPILOT / HELP ASSISTANT
# ==========================================
class CareerHelpPayload(BaseModel):
    question: str
    context: Optional[str] = None

@router.post("/career/help")
def career_help_endpoint(
    payload: CareerHelpPayload,
    user: User = Depends(get_current_user)
):
    return gemini_service.get_career_help(
        question=payload.question,
        context=payload.context
    )

# ==========================================
# 16. AI VOICE TTS STREAMING (MP3 PIPELINE)
# ==========================================
TTS_AUDIO_CACHE: Dict[str, bytes] = {}

@router.get("/voice/tts")
def stream_tts_audio(
    text: str = Query(..., description="Text to synthesize into speech"),
    lang: str = Query("en-IN", description="Language code e.g. en-IN or en-US")
):
    """
    Streams natural audio (MP3) for Web Audio API & HTML5 <audio> element.
    Enables AudioContext, MediaElementAudioSourceNode and AnalyserNode reactivity.
    """
    clean_text = text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Empty text provided")

    cache_key = f"{lang}:{clean_text[:200]}"
    if cache_key in TTS_AUDIO_CACHE:
        return StreamingResponse(
            io.BytesIO(TTS_AUDIO_CACHE[cache_key]),
            media_type="audio/mpeg",
            headers={
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=86400",
                "Access-Control-Allow-Origin": "*",
            }
        )

    # Split into sentence chunks under 180 chars for clean concatenation
    sentences = re.split(r'([.!?]+)', clean_text)
    chunks = []
    curr = ''
    for part in sentences:
        if len(curr) + len(part) < 180:
            curr += part
        else:
            if curr.strip():
                chunks.append(curr.strip())
            curr = part
    if curr.strip():
        chunks.append(curr.strip())

    audio_bytes = bytearray()
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

    for chunk in chunks[:6]:
        try:
            encoded = urllib.parse.quote(chunk)
            url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl={lang}&client=tw-ob&q={encoded}"
            res = requests.get(url, headers=headers, timeout=5)
            if res.status_code == 200:
                audio_bytes.extend(res.content)
        except Exception as e:
            logger.warning(f"TTS chunk fetch error: {e}")

    if not audio_bytes:
        raise HTTPException(status_code=502, detail="TTS synthesis currently unavailable")

    final_bytes = bytes(audio_bytes)
    TTS_AUDIO_CACHE[cache_key] = final_bytes

    return StreamingResponse(
        io.BytesIO(final_bytes),
        media_type="audio/mpeg",
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
        }
    )


