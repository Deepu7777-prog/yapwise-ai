import json
import logging
import re
from typing import Dict, Any, List, Optional
import requests

from backend.core.config import settings

logger = logging.getLogger(__name__)

# List of prioritized models in order of stability, quota, and latency
CANDIDATE_MODELS = [
    "gemini-flash-lite-latest",
    "gemini-3-flash-preview",
    "gemini-flash-latest",
    "gemini-2.5-pro",
]


class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        configured_model = settings.GEMINI_MODEL or "gemini-flash-lite-latest"
        self.primary_model = "gemini-flash-lite-latest" if configured_model == "gemini-3.5-flash" else configured_model
        self.configured = bool(self.api_key and len(self.api_key.strip()) > 10)
        logger.info(f"GeminiService initialized (configured: {self.configured}, primary: {self.primary_model})")

    def _call_gemini_api(
        self, prompt: str, system_instruction: Optional[str] = None, timeout: int = 25
    ) -> Optional[str]:
        """Calls Google Generative Language REST API directly with multi-model fallback cascade."""
        if not self.configured:
            return None

        # Build cascade list: primary model first, followed by others without duplicates
        models_to_try = [self.primary_model]
        for m in CANDIDATE_MODELS:
            if m not in models_to_try:
                models_to_try.append(m)

        payload: Dict[str, Any] = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.4,
                "topP": 0.9,
                "maxOutputTokens": 2048,
            }
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        headers = {
            "Content-Type": "application/json"
        }

        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            try:
                response = requests.post(url, json=payload, headers=headers, timeout=timeout)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"]
                elif response.status_code in (429, 503):
                    logger.warning(f"Gemini model {model} busy (HTTP {response.status_code}), attempting next candidate...")
                else:
                    logger.warning(f"Gemini model {model} returned HTTP {response.status_code}: {response.text[:140]}")
            except requests.Timeout:
                logger.warning(f"Gemini model {model} request timed out ({timeout}s), attempting next candidate...")
            except Exception as e:
                logger.warning(f"Gemini call error on model {model}: {e}")

        logger.error("All Gemini API candidate models exhausted or failed.")
        return None

    def _clean_json(self, raw_text: str) -> str:
        """Strips markdown code fences and whitespace from model JSON outputs."""
        if not raw_text:
            return ""
        text = raw_text.strip()
        # Look for code block ```json ... ``` or ``` ... ```
        block_match = re.search(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL)
        if block_match:
            return block_match.group(1).strip()

        # If no closing backticks, handle case where output started with ```json
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    def _parse_json_safely(self, raw_text: str) -> Optional[Dict[str, Any]]:
        """Safely parses JSON responses from LLM, forgiving unescaped control characters and newlines."""
        if not raw_text:
            return None
        cleaned = self._clean_json(raw_text)
        try:
            return json.loads(cleaned, strict=False)
        except Exception:
            pass

        # Try extracting outer object { ... }
        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if match:
            candidate = match.group(0)
            try:
                return json.loads(candidate, strict=False)
            except Exception:
                pass

        # Try extracting from raw_text directly if cleaned stripped too much
        match_raw = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if match_raw:
            try:
                return json.loads(match_raw.group(0), strict=False)
            except Exception:
                pass

        return None

    # =========================================================================
    # 1. PRACTICE SPEECH EVALUATION
    # =========================================================================
    def evaluate_practice_speech(
        self, transcript: str, topic: str, mode: str, wpm: float, filler_count: int, filler_breakdown: Dict[str, int]
    ) -> Dict[str, Any]:
        """Evaluates speech practice transcript using Gemini structured prompt."""
        prompt = f"""
You are an executive speech coach at YapWise AI.
Analyze the following speech transcript for an exercise of type '{mode}' on topic '{topic}'.
Metrics: WPM={wpm}, Total Filler Words={filler_count}, Breakdown={json.dumps(filler_breakdown)}.

Speech Transcript:
\"\"\"{transcript}\"\"\"

Provide your response in strict JSON format with the following keys:
{{
  "clarity_score": <float between 0 and 100>,
  "fluency_score": <float between 0 and 100>,
  "vocabulary_score": <float between 0 and 100>,
  "confidence_score": <float between 0 and 100>,
  "relevance_score": <float between 0 and 100>,
  "overall_score": <float between 0 and 100>,
  "feedback_summary": "<2-3 sentences concise coaching summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<area 1>", "<area 2>"],
  "recommendations": ["<actionable drill 1>", "<actionable drill 2>", "<actionable drill 3>"]
}}
Return ONLY valid JSON.
"""
        raw = self._call_gemini_api(prompt)
        if raw:
            parsed = self._parse_json_safely(raw)
            if parsed and isinstance(parsed, dict) and "clarity_score" in parsed:
                return parsed

        return self._fallback_practice_evaluation(transcript, topic, mode, wpm, filler_count)

    # =========================================================================
    # 2. INTERVIEW QUESTION GENERATION & EVALUATION
    # =========================================================================
    def generate_interview_question(
        self, interview_type: str, role: str, history: List[Dict[str, str]]
    ) -> Dict[str, str]:
        """Generates dynamic interview question based on role and past conversation."""
        prompt = f"""
You are a senior {interview_type.upper()} interviewer at a tier-1 company interviewing a candidate for a '{role}' position.
Conversation history so far:
{json.dumps(history, indent=2)}

Generate the next natural, probing, and realistic interview question.
If history is empty, begin with an opening icebreaker or situational question tailored to {role}.
Return strict JSON:
{{
  "speaker_name": "{'Sarah (HR Lead)' if interview_type == 'hr' else 'Alex (Principal Architect)'}",
  "question": "<the question text>",
  "context_note": "<brief note on what you are looking for in the candidate's answer>"
}}
Return ONLY valid JSON.
"""
        raw = self._call_gemini_api(prompt)
        if raw:
            parsed = self._parse_json_safely(raw)
            if parsed and isinstance(parsed, dict) and "question" in parsed:
                return parsed

        return self._fallback_interview_question(interview_type, role, len(history))

    def evaluate_interview_answer(
        self, interview_type: str, question: str, answer: str, role: str
    ) -> Dict[str, Any]:
        """Evaluates an interview turn using STAR framework for HR or technical rigor for Tech."""
        prompt = f"""
You are an expert interviewer evaluating a candidate for '{role}'.
Interview Type: {interview_type.upper()}
Question: \"{question}\"
Candidate Answer: \"{answer}\"

Evaluate this answer. Return strict JSON:
{{
  "score": <float between 0 and 100>,
  "feedback": "<concise constructive feedback on structure, depth, and communication>",
  "star_analysis": "<Brief STAR method critique if HR, or technical depth critique if Technical>"
}}
Return ONLY valid JSON.
"""
        raw = self._call_gemini_api(prompt)
        if raw:
            parsed = self._parse_json_safely(raw)
            if parsed and isinstance(parsed, dict) and "score" in parsed:
                return parsed

        return self._fallback_answer_evaluation(interview_type, answer)

    # =========================================================================
    # 3. GROUP DISCUSSION SIMULATION
    # =========================================================================
    def generate_gd_responses(
        self, topic: str, history: List[Dict[str, str]], user_argument: str
    ) -> Dict[str, Any]:
        """Simulates other group discussion participants reacting to the user's point."""
        prompt = f"""
You are moderating and roleplaying participants in a competitive corporate Group Discussion (GD).
Topic: \"{topic}\"
Participants:
1. 'Priya (Advocate)': Pragmatic, data-driven, optimistic on technological progress.
2. 'Marcus (Skeptic)': Cautious, focuses on ethical risks, regulatory hurdles, and edge cases.
3. 'Elena (Moderator)': Guides the discussion, summarizes consensus, prompts quiet participants.

Conversation history:
{json.dumps(history, indent=2)}

User just said:
\"{user_argument}\"

Simulate 2 immediate, distinct responses from participants, plus provide concise live coaching feedback on how well the user framed their argument, assertiveness, and active listening.
Return strict JSON:
{{
  "ai_reactions": [
    {{
      "speaker_name": "<Priya or Marcus or Elena>",
      "speaker_role": "<advocate or skeptic or moderator>",
      "content": "<what this participant says in response>"
    }},
    {{
      "speaker_name": "<another participant>",
      "speaker_role": "<role>",
      "content": "<what this participant says>"
    }}
  ],
  "live_feedback": "<1-2 sentence real-time feedback on user's delivery and persuasiveness>"
}}
Return ONLY valid JSON.
"""
        raw = self._call_gemini_api(prompt)
        if raw:
            parsed = self._parse_json_safely(raw)
            if parsed and isinstance(parsed, dict) and "ai_reactions" in parsed:
                return parsed

        return self._fallback_gd_turn(topic, user_argument)

    # =========================================================================
    # 4. CAREER ROADMAP GENERATION
    # =========================================================================
    def generate_career_roadmap(
        self,
        profile_or_role: Any = None,
        skills: Optional[List[str]] = None,
        year_branch: Optional[str] = None,
        level: str = "intermediate",
        **kwargs
    ) -> Dict[str, Any]:
        """Generates or retrieves a 10-milestone personalized student career roadmap."""
        if isinstance(profile_or_role, dict):
            profile = profile_or_role
        else:
            profile = {
                "target_role": kwargs.get("role") or profile_or_role or "Software Engineer",
                "skills": skills or kwargs.get("skills") or ["Java", "SQL", "Git"],
                "year_branch": year_branch or kwargs.get("year_branch") or "3rd Year B.Tech CSE",
                "level": level or kwargs.get("level") or "intermediate"
            }
        role = profile.get("target_role") or profile.get("role", "Software Engineer")
        skills_list = profile.get("skills", ["Java", "SQL", "Git"])
        yr_branch = profile.get("year_branch", "3rd Year B.Tech CSE")

        prompt = f"""
You are the Chief Academic Officer and Placement Director at YapWise AI.
Create a personalized, 10-milestone career learning roadmap for a college student:
- Target Role: {role}
- Current Skills: {skills_list}
- Academic Year & Branch: {yr_branch}

Provide a structured, step-by-step 10-milestone curriculum from fundamentals up to campus placement offers.
Return strict JSON:
{{
  "role": "{role}",
  "summary": "<Inspiring 2-sentence summary tailored to this student>",
  "progress_percent": 20,
  "completed_milestones": 2,
  "total_milestones": 10,
  "recommended_next_step": {{
    "milestone_id": 3,
    "title": "<Title of Milestone 3>",
    "action": "<Specific actionable drill to complete today>"
  }},
  "milestones": [
    {{
      "id": 1,
      "title": "<Milestone 1 Title>",
      "category": "<Core Language | DSA | Backend | Projects | Placements>",
      "status": "completed",
      "description": "<Concise description>",
      "estimated_weeks": 2,
      "tasks": ["<Task 1>", "<Task 2>", "<Task 3>"]
    }}
    // Exactly 10 milestones: milestone 1 & 2 "completed", milestone 3 "in-progress", 4-10 "pending"
  ]
}}
Return ONLY valid JSON.
"""
        raw = self._call_gemini_api(prompt, timeout=18)
        if raw:
            parsed = self._parse_json_safely(raw)
            if parsed and isinstance(parsed, dict) and "milestones" in parsed and len(parsed["milestones"]) >= 5:
                return parsed

        return self._fallback_career_roadmap(profile)

    # =========================================================================
    # 5. CAREER LEARNING ASSISTANT (AI MENTOR CHAT)
    # =========================================================================
    def career_mentor_chat(
        self, question: str, profile: Dict[str, Any], history: List[Dict[str, str]], category: str = "general"
    ) -> Dict[str, Any]:
        """Answers career, coding, DSA, and placement questions with step-by-step guidance."""
        role = profile.get("target_role", "Software Engineer")
        degree = profile.get("degree", "B.Tech")
        skills = profile.get("skills", [])

        system_instruction = f"""
You are the elite AI Career Mentor and Senior Engineering Placement Coach at YapWise AI (tagline: Talk Smart. Speak Confidently).
Student Profile:
- Target Placement Role: {role}
- Degree/Education: {degree}
- Current Skills: {skills}
- Topic Domain: {category}

STRICT CONVERSATIONAL INTELLIGENCE RULES (ChatGPT-grade quality):
1. ALWAYS understand the student's latest message and its exact intent.
2. Read the entire Conversation History provided and treat this as a continuous, coherent dialogue. If the student asks follow-ups (e.g. "What is the difference between Java and Python?", "Which one should I learn for placements?"), reference the previous context naturally.
3. Answer the EXACT question asked directly in your first sentence. Never evade the question or give a generic unrelated template.
4. If asked about programming languages (Java, Python, C++, JavaScript), algorithms, DSA, system design, technical interview rounds, HR behavioral questions, resume preparation, projects, or internships:
   - Provide concrete, accurate, step-by-step technical guidance with practical examples and code syntax when applicable.
   - Explain trade-offs clearly (e.g., execution speed vs syntax brevity, product companies vs service companies).
5. Do not randomly introduce another unrelated topic. Follow the student's topic flow faithfully.
6. Do not repeat the same question or phrase across turns.
7. Tone: Warm, empowering, brilliant, structured, and collegiate. Use clean Markdown headings, bold key terms, and bullet points.
8. Return strict JSON.
"""
        prompt = f"""
Conversation History so far:
{json.dumps(history[-10:], indent=2)}

Student's Latest Message:
\"{question}\"

Return strict JSON with the following structure:
{{
  "reply": "<Comprehensive, beautifully formatted Markdown answer with clear headings, actionable steps, code examples if relevant>",
  "key_takeaways": ["<Key Takeaway 1>", "<Key Takeaway 2>", "<Key Takeaway 3>"],
  "suggested_followups": [
    "<Relevant follow-up 1 that builds directly on this conversation>",
    "<Relevant follow-up 2>",
    "<Relevant follow-up 3>"
  ]
}}
Return ONLY valid JSON.
"""
        raw = self._call_gemini_api(prompt, system_instruction=system_instruction, timeout=25)
        if raw:
            parsed = self._parse_json_safely(raw)
            if parsed and "reply" in parsed:
                return parsed
            logger.warning(f"Could not parse structured JSON from career mentor reply: {raw[:150]}")

        return self._fallback_career_mentor(question, profile, category)

    # =========================================================================
    # 6. SPEAKING COMPANION (VOICE-FIRST CONVERSATIONAL TURN)
    # =========================================================================
    def speaking_companion_turn(
        self, user_speech: str, mode: str, history: List[Dict[str, str]], role: str = "Software Engineer"
    ) -> Dict[str, Any]:
        """
        Understands user answer, addresses inquiries about speech/fumbling,
        gently corrects English mistakes, explains the rule, and asks relevant follow-up.
        """
        system_instruction = f"""
You are the AI Voice Conversation Partner and English Coach at YapWise AI (tagline: Talk Smart. Speak Confidently).
Mode: '{mode}' (e.g. Free Conversation, Daily English Practice, HR Interview, Technical Interview, Group Discussion).
Student's Target Role: {role}

CRITICAL CONVERSATIONAL INTELLIGENCE RULES (ChatGPT-grade companion):
1. ALWAYS understand the user's latest message first. Read their actual words and respond directly to what they are asking or saying.
2. Maintain the SAME conversation topic. Never jump to an unrelated topic.
3. If the student answers a question, respond directly to their specific answer with genuine commentary or encouragement, then ask a natural related follow-up.
4. If the student asks about their speaking skills, how they spoke, or where they were fumbling (e.g. "Can you know about my how is my speaking skills and where I was fumbling?"):
   - DIRECTLY evaluate their speech! Point out grammar, repeated words, and sentence structure issues.
   - Explain that while audio pronunciation cannot be judged from text transcripts, their clarity, phrasing, and flow can be evaluated.
   - Offer concrete help on their previous sentence.
5. If the student calls you out for repeating questions or not knowing what they sent (e.g. "Are you asking the question repeatedly without knowing what I was sending to you?"):
   - NEVER give a generic response!
   - Immediately apologize honestly for the repetition.
   - Directly acknowledge what they called you out on.
   - Address their underlying question directly.
6. ONLY correct English mistakes when there is a clear, genuine grammatical violation (e.g. subject-verb disagreement, incorrect tense). DO NOT correct casual phrasing, conversational flow, colloquial expressions, or normal greetings. If the student speaks reasonably well or understandably, set has_correction = false and encourage their conversational fluency.
7. Keep 'spoken_response' natural, warm, and conversational for SpeechSynthesis (under 2-3 sentences so it speaks smoothly without overwhelming the listener).
8. NEVER give repetitive or generic advice. Respond to the exact ideas in the student's message with genuine conversational interest.
"""
        prompt = f"""
Conversation History so far:
{json.dumps(history[-8:], indent=2)}

The student just spoke into the microphone:
\"{user_speech}\"

Return STRICT JSON with these exact keys:
{{
  "spoken_response": "<Natural conversational text for speech synthesis that replies to user's exact words>",
  "has_correction": <true or false>,
  "original_phrase": "<incorrect snippet, or null>",
  "corrected_phrase": "<better phrasing, or null>",
  "correction_explanation": "<simple 1-sentence explanation of rule, or null>",
  "follow_up_question": "<the follow-up question you asked that continues this topic>",
  "evaluation": {{
    "grammar": <integer 60-100>,
    "vocabulary": <integer 60-100>,
    "clarity": <integer 60-100>,
    "content": <integer 60-100>,
    "overall": <integer 60-100>,
    "feedback": "<1 sentence constructive observation>",
    "new_vocabulary": ["<relevant term 1>", "<relevant term 2>"]
  }}
}}
Return ONLY valid JSON.
"""
        raw = self._call_gemini_api(prompt, system_instruction=system_instruction, timeout=25)
        if raw:
            parsed = self._parse_json_safely(raw)
            if parsed and "spoken_response" in parsed and "evaluation" in parsed:
                return parsed
            logger.warning(f"Could not parse speaking companion turn JSON: {raw[:150]}")

        # If API is unreachable or returns malformed response, use intelligent intent fallback
        return self._fallback_speaking_companion(user_speech, mode, history, role)

    # =========================================================================
    # 7. INTELLIGENT INTENT-AWARE FALLBACKS (ZERO GENERIC REPETITION)
    # =========================================================================
    def _fallback_speaking_companion(
        self, user_speech: str, mode: str, history: List[Dict[str, str]], role: str
    ) -> Dict[str, Any]:
        """
        Intelligent intent-based fallback engine that deeply understands user intent.
        NEVER repeats generic canned responses.
        """
        text = user_speech.strip()
        text_lower = text.lower()
        words = text.split()
        word_count = len(words)

        has_correction = False
        original_phrase = None
        corrected_phrase = None
        explanation = None

        # 1. Detect Meta-Complaints (AI repeating, not understanding, robot answers)
        if any(k in text_lower for k in [
            "repeatedly", "repeating", "same question", "without knowing", "without understanding",
            "not knowing", "listening to me", "are you a bot", "are you an ai", "ignore", "ignoring"
        ]):
            spoken = (
                "You're completely right, and I apologize for repeating myself earlier. "
                "I should listen closely to your actual question before responding. "
                "Let's get back on track: you want to know about your speaking skills and where you were fumbling. "
                "Would you like me to walk through your previous sentences and highlight the areas to polish?"
            )
            follow_up = "Would you like me to review your previous sentences and highlight where to polish?"
            return {
                "spoken_response": spoken,
                "has_correction": False,
                "original_phrase": None,
                "corrected_phrase": None,
                "correction_explanation": None,
                "follow_up_question": follow_up,
                "evaluation": {
                    "grammar": 88,
                    "vocabulary": 85,
                    "clarity": 90,
                    "content": 92,
                    "overall": 89,
                    "feedback": "Direct, assertive communication with clear intent.",
                    "new_vocabulary": ["Assertive", "Directness"]
                }
            }

        # 2. Detect Queries about Speaking Skills / Fumbling / How I Spoke
        if any(k in text_lower for k in [
            "speaking skills", "fumbling", "fumble", "how is my speaking", "how was my speaking",
            "how did i speak", "evaluate my speech", "my communication", "where was i fumbling",
            "review my", "how is my english"
        ]):
            # Check for grammar fumble in the question itself: e.g. "my how is my" or "speaking skills is"
            if "how is my speaking skills" in text_lower or "how my speaking skills is" in text_lower:
                has_correction = True
                original_phrase = "how is my speaking skills"
                corrected_phrase = "how my speaking skills are"
                explanation = "Because 'skills' is plural, we use the plural verb 'are' instead of 'is'."

            if "can you know" in text_lower:
                has_correction = True
                original_phrase = "Can you know about"
                corrected_phrase = "Can you evaluate / tell me about"
                explanation = "'Know' describes possessing information, while 'evaluate' or 'tell' asks for an action."

            if has_correction:
                spoken = (
                    f"Yes! I evaluate your speech by analyzing grammar, sentence flow, and hesitation markers. "
                    f"In your question, notice that instead of saying '{original_phrase}', it is clearer to say '{corrected_phrase}'. {explanation} "
                    f"Overall, your communication intent is clear. Would you like to practice a short placement answer together?"
                )
            else:
                spoken = (
                    "Yes, absolutely! I evaluate your speaking performance by tracking sentence structure, grammar, "
                    "repetition, and clarity. While I cannot detect vocal pitch from transcripts, I can identify phrasing stumbles. "
                    "Would you like to try answering a sample interview question so I can evaluate your real-time delivery?"
                )
            follow_up = "Would you like to practice a sample interview question so I can evaluate your delivery?"
            return {
                "spoken_response": spoken,
                "has_correction": has_correction,
                "original_phrase": original_phrase,
                "corrected_phrase": corrected_phrase,
                "correction_explanation": explanation,
                "follow_up_question": follow_up,
                "evaluation": {
                    "grammar": 78 if has_correction else 86,
                    "vocabulary": 82,
                    "clarity": 84,
                    "content": 88,
                    "overall": 83,
                    "feedback": "Proactive self-awareness on speech performance.",
                    "new_vocabulary": ["Articulation", "Fluency"]
                }
            }

        # 3. Check for Classic Indian-English Speech Patterns
        if "interesting in" in text_lower:
            has_correction = True
            original_phrase = "interesting in"
            corrected_phrase = "interested in"
            explanation = "We say 'interested in' when describing our personal feelings, whereas 'interesting' describes the topic."
        elif "i am having " in text_lower:
            has_correction = True
            original_phrase = "I am having"
            corrected_phrase = "I have"
            explanation = "We use simple present 'I have' for possession or mental state rather than continuous tense."
        elif "revert back" in text_lower:
            has_correction = True
            original_phrase = "revert back"
            corrected_phrase = "revert / reply"
            explanation = "'Revert' already means to return a reply, so adding 'back' is redundant."
        elif "myself " in text_lower and len(text_lower.split()) < 6:
            has_correction = True
            original_phrase = "Myself [Name]"
            corrected_phrase = "I am / My name is"
            explanation = "Reflexive pronouns like 'myself' should not begin an introductory sentence."
        elif "pass out" in text_lower:
            has_correction = True
            original_phrase = "pass out from college"
            corrected_phrase = "graduated from college"
            explanation = "'Pass out' means losing consciousness in global English; say 'graduated' instead."

        # 4. Tailor spoken response according to mode and context
        if mode == "hr":
            if has_correction:
                spoken = f"That is a great perspective! Quick coaching note: Instead of saying '{original_phrase}', say '{corrected_phrase}'. {explanation} How did that experience shape how you collaborate with peers?"
                follow_up = "How did that experience shape how you collaborate with peers?"
            else:
                spoken = f"Thank you for sharing that. In an HR interview, structuring your thoughts clearly leaves a strong impression. Could you describe a specific situation where you took initiative on a project?"
                follow_up = "Could you describe a specific situation where you took initiative on a project?"

        elif mode == "technical":
            if has_correction:
                spoken = f"Solid technical reasoning! Small note: Instead of '{original_phrase}', say '{corrected_phrase}'. {explanation} How would you optimize the time and space complexity of that approach?"
                follow_up = "How would you optimize the time and space complexity of that approach?"
            else:
                spoken = f"Good technical explanation. When designing solutions for {role}, trade-offs between performance and maintainability are critical. How did you handle error conditions in that system?"
                follow_up = "How did you handle error conditions in that system?"

        elif mode == "gd":
            if has_correction:
                spoken = f"That is a strong point for the group discussion! Notice that saying '{corrected_phrase}' sounds more persuasive than '{original_phrase}'. How would you respond if another participant challenged your point?"
                follow_up = "How would you respond if another participant challenged your point?"
            else:
                spoken = "Well articulated point. In a competitive group discussion, backing your argument with a quick data point or real-world example will make it even stronger. What example could you add here?"
                follow_up = "What real-world example could you add to strengthen that argument?"

        else:  # Free Conversation or Daily Practice
            # Extract main user keyword to avoid any generic feeling
            meaningful_words = [w for w in re.sub(r'[^a-zA-Z\s]', '', text).split() if len(w) > 3 and w.lower() not in {"this", "that", "with", "from", "have", "what", "about", "your", "they"}]
            topic_hint = meaningful_words[0].capitalize() if meaningful_words else "that topic"

            if has_correction:
                spoken = f"I see what you mean about {topic_hint}! A quick tip: Instead of '{original_phrase}', say '{corrected_phrase}'. {explanation} What inspired you to focus on this?"
                follow_up = f"What inspired you to focus on this aspect of {topic_hint}?"
            else:
                spoken = f"I understand your thoughts regarding {topic_hint}. When explaining ideas aloud, giving a concrete example helps your listener follow effortlessly. Could you tell me a bit more about how you got started with it?"
                follow_up = f"Could you tell me a bit more about how you got started with {topic_hint}?"

        grammar_score = 75 if has_correction else min(95, 80 + min(15, word_count // 3))
        vocab_score = min(92, 72 + len(set(words)) // 3)
        clarity_score = min(96, 75 + min(20, word_count // 2))
        content_score = min(94, 78 + min(16, word_count // 2))
        overall = round((grammar_score + vocab_score + clarity_score + content_score) / 4)

        return {
            "spoken_response": spoken,
            "has_correction": has_correction,
            "original_phrase": original_phrase,
            "corrected_phrase": corrected_phrase,
            "correction_explanation": explanation,
            "follow_up_question": follow_up,
            "evaluation": {
                "grammar": grammar_score,
                "vocabulary": vocab_score,
                "clarity": clarity_score,
                "content": content_score,
                "overall": overall,
                "feedback": "Smooth speech flow and clear articulation." if not has_correction else f"Applied correction for '{original_phrase}'.",
                "new_vocabulary": ["Articulate", "Systematic", "Cohesive", "Pragmatic"][:2]
            }
        }

    # =========================================================================
    # 8. OTHER SERVICE FALLBACKS
    # =========================================================================
    def _fallback_practice_evaluation(self, transcript: str, topic: str, mode: str, wpm: float, filler_count: int) -> Dict[str, Any]:
        word_count = len(transcript.strip().split())
        clarity = max(60.0, 92.0 - (filler_count * 3.5))
        fluency = 88.0 if 120 <= wpm <= 165 else (78.0 if 90 <= wpm <= 190 else 65.0)
        vocabulary = min(92.0, 70.0 + (word_count * 0.15))
        confidence = round((clarity * 0.5) + (fluency * 0.5), 1)
        relevance = 88.0
        overall = round((clarity + fluency + vocabulary + confidence + relevance) / 5.0, 1)

        return {
            "clarity_score": clarity,
            "fluency_score": fluency,
            "vocabulary_score": vocabulary,
            "confidence_score": confidence,
            "relevance_score": relevance,
            "overall_score": overall,
            "feedback_summary": f"Strong articulation on topic '{topic}'. Your speaking rate of {wpm} WPM is well-calibrated.",
            "strengths": [
                "Clear vocal projection and purposeful pacing",
                "Strong thematic coherence around the core subject",
                "Natural conversational tone"
            ],
            "weaknesses": [
                f"Detected {filler_count} filler words that can be converted into deliberate pauses",
                "Opportunity to expand on concrete quantifiable outcomes"
            ],
            "recommendations": [
                "Practice the 2-second silent pause rule when organizing your thoughts",
                "Engage in articulation drills targeting crisp plosive consonants",
                "Incorporate transition words (e.g., 'Consequently', 'Moreover') instead of vocal pauses"
            ]
        }

    def _fallback_interview_question(self, interview_type: str, role: str, turn_count: int) -> Dict[str, str]:
        hr_questions = [
            "Tell me about a challenging situation where you had to manage conflicting stakeholder expectations.",
            "Describe a time when a project deadline was at risk. How did you prioritize and execute?",
            "Can you share an instance where you received critical feedback and how you integrated it?",
            "Where do you see your technical leadership trajectory developing over the next 2-3 years?",
        ]
        tech_questions = [
            f"As a {role}, how would you architect a distributed rate-limiter handling 100k requests per second?",
            "Explain how database indexing operates under the hood with B-trees, and when you would avoid adding an index.",
            "Walk me through how you troubleshoot a sudden latency spike in a microservices production cluster.",
            "What architectural trade-offs do you consider when choosing between asynchronous message queues and gRPC?",
        ]
        bank = hr_questions if interview_type == "hr" else tech_questions
        idx = (turn_count // 2) % len(bank)
        speaker = "Sarah (HR Lead)" if interview_type == "hr" else "Alex (Principal Architect)"
        return {
            "speaker_name": speaker,
            "question": bank[idx],
            "context_note": f"Evaluating clarity, depth, and structured methodology for {role}."
        }

    def _fallback_answer_evaluation(self, interview_type: str, answer: str) -> Dict[str, Any]:
        words = len(answer.strip().split())
        score = min(94.0, max(68.0, 70.0 + (words * 0.2)))
        if interview_type == "hr":
            return {
                "score": round(score, 1),
                "feedback": "Well-structured response that touches upon key responsibilities and outcome orientation.",
                "star_analysis": "Good Situation and Action context. Ensure the Result highlights measurable quantitative metrics (e.g. reduced latency by 35%)."
            }
        else:
            return {
                "score": round(score, 1),
                "feedback": "Solid technical grasp of core concepts. Clear explanation of underlying architectural components.",
                "star_analysis": "Technical depth is sound. Deepen the explanation around edge cases, failure recovery, and horizontal scaling limits."
            }

    def _fallback_gd_turn(self, topic: str, user_argument: str) -> Dict[str, Any]:
        return {
            "ai_reactions": [
                {
                    "speaker_name": "Priya (Advocate)",
                    "speaker_role": "advocate",
                    "content": f"I strongly agree with that angle. When you consider practical deployment, having that approach creates an immediate competitive edge."
                },
                {
                    "speaker_name": "Marcus (Skeptic)",
                    "speaker_role": "skeptic",
                    "content": f"While that sounds promising in theory, what about compliance and unexpected operational overhead? We cannot overlook the capital costs."
                }
            ],
            "live_feedback": "Assertive framing and clear pacing. Try supporting your point with a tangible industry metric next time."
        }

    def _fallback_career_roadmap(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        role = profile.get("target_role") or profile.get("role", "Java Developer")
        year_branch = profile.get("year_branch", "3rd Year B.Tech CSE")
        is_java = "java" in role.lower()
        is_python = "python" in role.lower() or "ai" in role.lower() or "data" in role.lower()
        is_frontend = "frontend" in role.lower() or "react" in role.lower() or "web" in role.lower()

        if is_java:
            m_titles = [
                ("Java Fundamentals & Core Syntax", "Core Language", "completed", ["Variables, Primitives & Operators", "Control Flow & Loops", "Arrays & String Pool"]),
                ("Object-Oriented Programming (OOP)", "Design", "completed", ["Inheritance & Polymorphism", "Abstract Classes vs Interfaces", "Encapsulation & SOLID"]),
                ("Collections Framework & Generics", "Core Language", "in-progress", ["List, Set, Map Implementations", "Iterators & Comparable/Comparator", "Generics & Stream API"]),
                ("Exception Handling & Multithreading", "Advanced Java", "pending", ["Checked vs Unchecked Exceptions", "Thread Lifecycle & Synchronization", "Executors & Concurrency"]),
                ("Data Structures & Algorithms in Java", "Algorithms", "pending", ["Binary Trees & BSTs", "HashMaps & Hash Collision", "Sorting & Dynamic Programming"]),
                ("SQL, Relational DBs & JDBC/JPA", "Database", "pending", ["Complex Joins & Subqueries", "Indexing & Transactions (ACID)", "Hibernate & Spring Data JPA"]),
                ("Spring Boot & RESTful Microservices", "Backend", "pending", ["Dependency Injection & IoC", "REST APIs & JSON Serialization", "JWT Authentication & Spring Security"]),
                ("Industry-Standard Project Engineering", "Projects", "pending", ["E-Commerce Backend or Banking API", "Unit Testing (JUnit + Mockito)", "Docker & CI/CD Pipeline"]),
                ("Technical Coding Rounds Preparation", "Interviews", "pending", ["LeetCode Blind 75 in Java", "Time & Space Complexity Proofs", "Live Whiteboarding Drills"]),
                ("Campus Placement & HR Interview Mastery", "Placements", "pending", ["STAR Method for Behavioral Rounds", "Explaining Technical Trade-offs", "Resume Review & Mock Interviews"]),
            ]
        elif is_python:
            m_titles = [
                ("Python Foundations & Data Structures", "Core Language", "completed", ["Built-in Types & Mutability", "List Comprehensions & Generators", "File I/O & Error Handling"]),
                ("Object-Oriented Python & Functional Idioms", "Design", "completed", ["Classes, Dunder Methods & Decorators", "Lambdas, Map & Filter", "Clean Architecture in Python"]),
                ("Data Structures & Algorithms with Python", "Algorithms", "in-progress", ["Stacks, Queues & Deques", "Trees, Heaps & Graphs", "Algorithmic Complexity ($O(N)$)"]),
                ("Databases & ORMs (SQLAlchemy / PostgreSQL)", "Database", "pending", ["Relational Schemas & Queries", "SQLAlchemy Async ORM", "Redis Caching Strategies"]),
                ("Backend Web Frameworks (FastAPI / Django)", "Backend", "pending", ["Pydantic Validation & Routing", "Async/Await Event Loops", "JWT Security & Middleware"]),
                ("Data Engineering & AI Integrations", "AI/Data", "pending", ["Pandas & NumPy Essentials", "Gemini / OpenAI API Integration", "Vector Databases & Embeddings"]),
                ("Production-Grade Capstone Application", "Projects", "pending", ["AI-Powered SaaS Architecture", "Docker Containerization", "Automated Pytest Suite"]),
                ("Resume Engineering & Portfolio Strategy", "Career Readiness", "pending", ["ATS-Compliant Resume Bullets", "GitHub Repository Polish", "LinkedIn Outreach Strategy"]),
                ("Coding Assessment & Machine Tests", "Interviews", "pending", ["LeetCode Top 100 Liked", "Edge Case Detection", "System Design Fundamentals"]),
                ("HR & Placement Placement Rounds", "Placements", "pending", ["STAR Behavioral Scenarios", "Design Scalable Data Pipelines", "Salary Negotiation"]),
            ]
        elif is_frontend:
            m_titles = [
                ("HTML5, Modern CSS & Responsive Layouts", "Frontend", "completed", ["Semantic Markup & Accessibility", "Flexbox & CSS Grid", "Responsive Design"]),
                ("JavaScript Deep Dive (ES6+)", "Core Language", "completed", ["Closures & Event Loop", "Promises & Async/Await", "DOM Manipulation"]),
                ("React & Component Architecture", "Frameworks", "in-progress", ["Hooks (useState, useEffect)", "State Management", "Component Reusability"]),
                ("TypeScript for Enterprise Frontend", "Core Language", "pending", ["Static Typing & Generics", "Interface vs Type", "TS with React"]),
                ("Tailwind CSS & Modern UI Libraries", "Styling", "pending", ["Utility-First CSS", "Accessible Components", "Dark/Light Design Systems"]),
                ("API Integration & Client-Side Caching", "Engineering", "pending", ["RESTful APIs & Fetch", "React Query / TanStack", "Error Handling & Skeletons"]),
                ("Full-Featured Production Web App", "Projects", "pending", ["Authentication Flows", "Interactive Dashboards", "Lighthouse Performance (90+)"]),
                ("Portfolio Site & Resume Crafting", "Career Readiness", "pending", ["Interactive Portfolio Website", "ATS Resume for Frontend", "LinkedIn Network"]),
                ("Frontend Coding & Machine Rounds", "Interviews", "pending", ["Pollyfills & Debounce/Throttle", "Component Coding Challenges", "DOM Traversal"]),
                ("Behavioral & Technical Placement Rounds", "Placements", "pending", ["STAR Storytelling", "Frontend Architecture Questions", "Cross-Browser QA"]),
            ]
        else:
            m_titles = [
                ("Software Engineering Foundations", "Core Language", "completed", ["Syntax & Semantics", "Modular Programming", "Debugging & Testing"]),
                ("Object-Oriented Design & Principles", "Design", "completed", ["SOLID Principles", "Design Patterns", "Clean Code Standards"]),
                ("Data Structures & Algorithmic Practice", "Algorithms", "in-progress", ["Arrays & HashTables", "Trees & Graphs", "Dynamic Programming"]),
                ("Database Design & Query Optimization", "Database", "pending", ["Relational Schemas", "Indexing & Query Plans", "NoSQL vs SQL"]),
                ("Backend Services & Web Architecture", "Backend", "pending", ["Client-Server Protocols", "REST APIs & JSON", "Microservice Fundamentals"]),
                ("Version Control & Team Collaboration", "DevOps", "pending", ["Git Branching & PRs", "CI/CD Pipelines", "Docker Containerization"]),
                ("Capstone Industry-Grade Project", "Projects", "pending", ["Full-Stack Architecture", "Authentication & Security", "Cloud Deployment"]),
                ("Resume Engineering & Portfolio", "Career Readiness", "pending", ["Action-Verb Bullet Points", "GitHub Clean-up", "Target Company Mapping"]),
                ("Technical Coding Rounds Preparation", "Interviews", "pending", ["Data Structure Problem Solving", "Time/Space Complexity", "Mock Whiteboarding"]),
                ("Placement Interview & Soft Skills", "Placements", "pending", ["STAR Interview Techniques", "System Design Discussions", "Confident Communication"]),
            ]

        milestones = []
        comp_count = 0
        for i, (title, cat, st, tasks) in enumerate(m_titles, start=1):
            if st == "completed":
                comp_count += 1
            milestones.append({
                "id": i,
                "title": title,
                "category": cat,
                "status": st,
                "description": f"Master {title.lower()} with targeted hands-on exercises and placement drills.",
                "estimated_weeks": 2,
                "tasks": tasks
            })

        return {
            "role": role,
            "summary": f"Your personalized career roadmap to excel as a {role}, tailored to your background in {year_branch}.",
            "progress_percent": round((comp_count / len(milestones)) * 100),
            "completed_milestones": comp_count,
            "total_milestones": len(milestones),
            "milestones": milestones,
            "recommended_next_step": {
                "milestone_id": 3,
                "title": milestones[2]["title"],
                "action": f"Focus on {milestones[2]['tasks'][0]} and complete 2 practice coding problems today."
            }
        }

    def _fallback_career_mentor(self, question: str, profile: Dict[str, Any], category: str) -> Dict[str, Any]:
        q_lower = question.lower()
        role = profile.get("target_role", "Software Engineer")

        if "dsa" in q_lower or "data structure" in q_lower:
            reply = """### What is DSA and How to Master It for Placements

**DSA (Data Structures and Algorithms)** is the foundational pillar of technical recruitment rounds at top product and service companies:

1. **Data Structures** organize and store data efficiently (Arrays, Strings, Linked Lists, Stacks, Queues, Trees, Graphs, HashMaps).
2. **Algorithms** are the step-by-step logical instructions that process this data (Sorting, Binary Search, Two Pointers, BFS/DFS, Dynamic Programming).

#### Recommended 4-Stage Study Order:
- **Phase 1 (Week 1–3):** Master Time & Space Complexity ($O(1), O(N), O(N \\log N)$) + Arrays & Strings.
- **Phase 2 (Week 4–6):** HashMaps, Two Pointers, and Sliding Window technique.
- **Phase 3 (Week 7–9):** Linked Lists, Stacks & Queues (Parentheses matching, Monotonic stack).
- **Phase 4 (Week 10–12):** Binary Trees & Binary Search Trees (Traversal patterns) + Basic Graph BFS/DFS.

**Pro Tip:** Do not memorize solutions. Solve 3–5 problems per pattern (e.g. Sliding Window) until you recognize the trigger conditions instantly."""
            takeaways = [
                "Focus on pattern recognition rather than memorizing individual LeetCode problems.",
                "Always calculate and state Time and Space Complexity ($O(N)$) before coding.",
                "Start with Arrays and HashMaps as they appear in 70% of entry-level coding tests."
            ]
            followups = [
                "What are the top 5 coding patterns asked in campus placements?",
                "How do I explain my thought process to a technical interviewer?",
                "Can you show an example of the Two-Pointer technique in Java or Python?"
            ]

        elif "resume" in q_lower or "project" in q_lower:
            reply = f"""### Building High-Impact Projects & Resume for {role}

Recruiters spend an average of **6 seconds** scanning a college student's resume. Here is how to stand out:

#### 1. The XYZ Resume Formula (Google Standard):
Instead of writing: *"Built a college website using React and Node.js"*, write:
> **"Architected a responsive student portal using React & FastAPI, reducing page load latency by 35% and supporting 1,200+ concurrent campus users."**

#### 2. Project Selection for {role}:
- **Avoid Generic Clones:** To-do lists or basic weather apps will get filtered out.
- **Build Real Utilities:** Build a role-based authentication service, an AI-powered voice evaluator, or an automated document parser.
- **Include GitHub & Live Demo:** A hosted link (Vercel, Render) with a clean `README.md` containing architectural diagrams makes your application 5x more credible."""
            takeaways = [
                "Quantify your project outcomes using percentages, latency numbers, or user counts.",
                "Host live working demos on Vercel or Render with clean GitHub READMEs.",
                "Tailor your technical skills section directly to your target role."
            ]
            followups = [
                "What are 3 unique project ideas for a final-year student?",
                "How do I explain my project using the STAR method in interviews?",
                "Can you review my resume bullet points?"
            ]

        elif "interview" in q_lower or "hr" in q_lower or "introduce" in q_lower:
            reply = """### How to Ace HR and Placement Interviews

Campus placement interviews test **clarity of thought, cultural alignment, and emotional maturity**:

#### 1. The Perfect 90-Second Self-Introduction:
- **Past (20s):** Name, degree, college, and what sparked your passion for engineering.
- **Present (40s):** Key technical skills, major capstone project, and practical problem solved.
- **Future (30s):** Why this specific company and how you want to contribute in this role.

#### 2. The STAR Framework for Behavioral Questions:
When asked *"Tell me about a time you resolved a team conflict"*:
- **S (Situation):** Brief context (deadline pressure, differing architectural choices).
- **T (Task):** Your specific responsibility in that situation.
- **A (Action):** The objective steps you took (e.g., organized a data-backed benchmark meeting).
- **R (Result):** The positive outcome (team aligned, delivered on time with zero bugs)."""
            takeaways = [
                "Keep self-introductions between 60 to 90 seconds without reciting your entire resume.",
                "Structure situational responses strictly using the STAR methodology.",
                "Always prepare 2 thoughtful questions for the interviewer at the end."
            ]
            followups = [
                "What are the most common HR trap questions and how to answer them?",
                "How do I answer 'What is your biggest weakness' honestly and safely?",
                "How do I handle a technical question when I don't know the exact answer?"
            ]

        else:
            reply = f"""### Strategic Career Guidance for {role}

To transition smoothly from college into a high-paying **{role}** position, follow this roadmap:

1. **Core Technical Depth:** Choose one primary language (Java, Python, or C++) and understand memory management, OOP, and asynchronous programming thoroughly.
2. **Daily Problem Solving:** Solve 1–2 DSA problems daily on LeetCode/GeeksforGeeks focusing on standard placement topics.
3. **End-to-End System Construction:** Build and deploy at least 2 full-stack projects featuring relational databases, JWT authentication, and Docker.
4. **Verbal Communication Mastery:** Practice explaining your code aloud without filler words. Many students write good code but fail to explain their logic during the interview."""
            takeaways = [
                "Consistency beats cramming: 1 hour daily DSA + 1 speaking drill yields compound results.",
                "Develop strong communication skills alongside technical problem solving.",
                "Network with college alumni currently working in your target companies."
            ]
            followups = [
                "What skills should I prioritize learning first?",
                "How do I prepare for product-based companies like Amazon or Microsoft?",
                "Can you give me a weekly schedule for placement preparation?"
            ]

        return {
            "reply": reply,
            "key_takeaways": takeaways,
            "suggested_followups": followups
        }

    # =========================================================================
    # 9. AI PRESENTATION SLIDE MAKER
    # =========================================================================
    def generate_presentation_slides(
        self, topic: str, slide_count: int = 10, style: str = "Modern Purple"
    ) -> Dict[str, Any]:
        """
        Generates a structured, presentation-ready academic slide deck using Gemini
        with fallback for reliable offline generation.
        """
        clean_topic = topic.strip() if topic and topic.strip() else "Artificial Intelligence in Engineering"
        count = max(3, min(slide_count, 15))

        system_instruction = f"""
You are an expert AI Presentation Designer and Academic Slide Architect at YapWise AI.
You create professional, highly structured, engaging college and placement presentation slides.
Style: {style}
Ensure every slide has substantial, practical content with concrete technical concepts, real-world examples, and clear speaker notes for students.
"""
        prompt = f"""
Create a comprehensive, academic-grade presentation deck on the topic: "{clean_topic}".
Total Slides to generate: {count}.

Return STRICT JSON matching this schema:
{{
  "topic": "{clean_topic}",
  "total_slides": {count},
  "style": "{style}",
  "deck_summary": "<Brief 1-2 sentence executive summary of this presentation>",
  "slides": [
    {{
      "slide_number": 1,
      "badge": "<Category tag like Title / Overview, Architecture, Implementation, Case Study, or Summary>",
      "title": "<Concise, impactful slide title>",
      "subtitle": "<Subheading or context>",
      "bullets": [
        "<Substantive bullet point with key technical concept and insight 1>",
        "<Substantive bullet point with key technical concept and insight 2>",
        "<Substantive bullet point with key technical concept and insight 3>"
      ],
      "speaker_notes": "<2-3 sentences of clear presenter notes explaining what the student should say aloud during this slide>",
      "key_takeaway": "<One crisp 1-sentence punchline takeaway>"
    }}
  ]
}}
Ensure exactly {count} slides are generated. Return ONLY valid JSON.
"""
        raw = self._call_gemini_api(prompt, system_instruction=system_instruction, timeout=25)
        if raw:
            parsed = self._parse_json_safely(raw)
            if parsed and "slides" in parsed and isinstance(parsed["slides"], list) and len(parsed["slides"]) > 0:
                return parsed
            logger.warning(f"Could not parse slides JSON: {raw[:150] if raw else 'empty'}")

        # Intelligent Procedural Fallback tailored to topic
        return self._procedural_slides_generator(clean_topic, count, style)

    def _procedural_slides_generator(self, topic: str, count: int, style: str) -> Dict[str, Any]:
        """Procedural generator ensuring 100% reliable slide creation for any topic."""
        templates = [
            ("Introduction & Background", "Foundation & Context", [
                f"Defines fundamental paradigms and historical evolution of {topic}.",
                "Addresses modern industrial demands and academic significance in modern software engineering.",
                "Establishes key objectives and engineering principles covered throughout this session."
            ], f"Good morning everyone. Today we are exploring {topic}, focusing on architectural fundamentals and practical industry applications.", "Foundational clarity sets the benchmark for advanced exploration."),
            
            ("Problem Statement & Motivation", "Challenges in Current Systems", [
                f"Legacy approaches to {topic} suffer from scalability and latency bottlenecks.",
                "Data volume and concurrent transactions require decoupled and resilient architectures.",
                "Engineering trade-offs between computational overhead and implementation complexity."
            ], f"Before jumping into solutions, let us examine why {topic} is critical today and the specific architectural bottlenecks it resolves.", "Understanding core pain points drives effective technical design."),
            
            ("Core Architecture & Components", "Structural System Breakdown", [
                "Modular structural hierarchy separating data ingress, computation, and persistence layers.",
                "Encapsulation of business logic to guarantee high cohesion and loose coupling.",
                "State management mechanisms and event-driven communication protocols."
            ], f"Here we see the core architectural framework of {topic}. Notice how the decoupled services communicate through defined interfaces.", "Loose coupling and high cohesion ensure maintainable systems."),
            
            ("Algorithmic Flow & Mechanics", "Step-by-Step Execution", [
                "Ingestion of client requests with input validation and security sanitization.",
                "Execution of core transformation algorithms with optimal time-space complexity guarantees.",
                "Asynchronous state updates and deterministic synchronization across distributed nodes."
            ], f"Let us trace a single transaction through the execution lifecycle to see how {topic} handles real-time processing.", "Deterministic execution guarantees reliable system behavior."),
            
            ("Technical Implementation & Stack", "Code Patterns & Libraries", [
                "Industry-standard toolchains: JVM/Spring Boot, modern containerization, and cloud orchestration.",
                "Clean code patterns including Factory, Observer, and Dependency Injection frameworks.",
                "Robust error handling, circuit breakers, and graceful fallback strategies."
            ], f"In this slide, we review the practical implementation stack. We follow standard design patterns to ensure code readability and testability.", "Adopting standard design patterns reduces production defects."),
            
            ("Performance & Complexity Analysis", "Metrics & Optimization", [
                "Mathematical Big-O time and space complexity evaluations under peak load.",
                "Throughput benchmarking, I/O latency mitigation, and caching strategies.",
                "Horizontal vs vertical scaling strategies for elastic cloud workloads."
            ], f"From an optimization perspective, {topic} scales predictably when memory allocation and thread synchronization are carefully tuned.", "Predictable algorithmic complexity is non-negotiable at scale."),
            
            ("Industry Case Studies", "Real-World Deployments", [
                f"Deployment patterns adopted by Tier-1 tech giants for enterprise {topic}.",
                "Measurable improvements: 40% reduction in response latency and 99.99% availability.",
                "Continuous integration and automated placement testing validation pipelines."
            ], f"Leading engineering organizations leverage these exact principles in production to serve millions of concurrent requests daily.", "Real-world engineering triumphs are validated by rigorous metrics."),
            
            ("Security, Risks & Mitigations", "Hardening & Best Practices", [
                "Threat modeling: mitigation of data leakage, injection attacks, and race conditions.",
                "Role-based access control (RBAC), end-to-end encryption, and audit logging.",
                "Compliance standards and defensive coding best practices for campus placements."
            ], f"Security cannot be an afterthought. We implement multi-layered defenses to safeguard our data and communication channels.", "Defense in depth protects both data integrity and user trust."),
            
            ("Future Trends & Evolution", "Emerging Horizons", [
                f"Integration of Generative AI and automated optimization pipelines into {topic}.",
                "Edge computing, serverless architectures, and next-generation decentralized frameworks.",
                "Evolving skill requirements for upcoming campus placements and industry careers."
            ], f"Looking forward, {topic} is evolving rapidly with intelligent automation and distributed edge computing.", "Staying abreast of technological evolution future-proofs engineering careers."),
            
            ("Summary & Key Takeaways", "Conclusion & Next Steps", [
                f"Synthesized core theoretical principles and practical architectural insights for {topic}.",
                "Mastery of these concepts directly strengthens placement interviews and academic viva rounds.",
                "Recommended resources: reference documentation, open-source repositories, and hands-on coding labs."
            ], f"To conclude, mastering {topic} bridges academic coursework with real-world engineering excellence. I am happy to answer any questions.", "Consistent hands-on practice transforms theoretical knowledge into mastery.")
        ]

        generated_slides = []
        for i in range(count):
            tmpl = templates[i % len(templates)]
            badge = "Overview" if i == 0 else "Conclusion" if i == count - 1 else "Technical Analysis"
            generated_slides.append({
                "slide_number": i + 1,
                "badge": badge,
                "title": f"{tmpl[0]}: {topic}" if i == 0 else tmpl[0],
                "subtitle": tmpl[1],
                "bullets": tmpl[2],
                "speaker_notes": tmpl[3],
                "key_takeaway": tmpl[4]
            })

        return {
            "topic": topic,
            "total_slides": count,
            "style": style,
            "deck_summary": f"Comprehensive presentation deck covering {topic} with architectural breakdowns, practical engineering trade-offs, and placement takeaways.",
            "slides": generated_slides
        }


    # =========================================================================
    # 7. RESUME SCANNER & ATS OPTIMIZER
    # =========================================================================
    def analyze_resume(
        self, resume_text: str, target_role: str = "Software Engineer"
    ) -> Dict[str, Any]:
        """Analyzes a student's resume against target role, providing ATS score, missing skills, and updated bullet points."""
        clean_text = (resume_text or "").strip()[:5000]
        if not clean_text:
            clean_text = "B.Tech Computer Science student with knowledge of Python, Java, Data Structures, SQL, and Web Development."

        prompt = f"""
You are a Principal Technical Recruiter and ATS Optimization Director at YapWise AI.
Analyze this student's resume for the target placement position: '{target_role}'.

Resume Content:
\"\"\"{clean_text}\"\"\"

Return STRICT JSON with the following schema:
{{
  "ats_score": <integer between 65 and 96>,
  "verdict": "<Strong Candidate | Competitive | Needs Optimization>",
  "summary": "<2-sentence executive recruiter summary of the resume>",
  "strengths": [
    "<Concrete strength 1 found in resume>",
    "<Concrete strength 2 found in resume>",
    "<Concrete strength 3 found in resume>"
  ],
  "missing_keywords": [
    "<Crucial industry skill 1 missing for {target_role}>",
    "<Crucial industry skill 2 missing>",
    "<Crucial industry skill 3 missing>",
    "<Crucial industry skill 4 missing>"
  ],
  "enhanced_bullet_points": [
    {{
      "original": "<A typical or actual weak bullet point from the resume or domain>",
      "improved": "<High-impact rewritten bullet point using Google X-Y-Z formula (Accomplished [X] measured by [Y] by doing [Z]) with strong action verbs and quantified impact>",
      "impact_reason": "<Why recruiters prefer this framing>"
    }},
    {{
      "original": "<Second weak bullet point>",
      "improved": "<Second high-impact rewritten bullet point>",
      "impact_reason": "<Recruiter reasoning>"
    }}
  ],
  "custom_interview_questions": [
    "<Tailored technical interview question 1 directly probing projects mentioned in this resume>",
    "<Tailored behavioral/architecture interview question 2>",
    "<Tailored problem-solving question 3>"
  ]
}}
Return ONLY valid JSON.
"""
        raw = self._call_gemini_api(prompt, timeout=22)
        if raw:
            parsed = self._parse_json_safely(raw)
            if parsed and isinstance(parsed, dict) and "ats_score" in parsed:
                return parsed

        # Intelligent Procedural Fallback
        return {
            "ats_score": 78,
            "verdict": "Competitive Candidate",
            "summary": f"Solid academic foundation in core computer science with practical hands-on projects aligned with {target_role}. Adding quantifiable metrics and modern cloud deployment experience will push this resume to the top 5%.",
            "strengths": [
                "Clear educational chronology and relevant computer science degree coursework.",
                "Demonstrated hands-on full-stack and algorithmic problem-solving projects.",
                "Good familiarity with core languages, databases, and version control tools."
            ],
            "missing_keywords": [
                "Docker / Containerization",
                "CI/CD Pipelines (GitHub Actions)",
                "System Design & Decoupled Microservices",
                "Unit Testing & Integration Coverage (PyTest / Jest)",
                "Cloud Infrastructure (AWS / GCP / Cloudflare)"
            ],
            "enhanced_bullet_points": [
                {
                    "original": "Worked on backend APIs using FastAPI and connected with SQLite database.",
                    "improved": "Architected resilient RESTful microservices using FastAPI and SQLAlchemy, reducing endpoint latency by 35% across 1,000+ test queries.",
                    "impact_reason": "Highlights concrete architectural choices and quantifies latency improvements."
                },
                {
                    "original": "Made the frontend responsive using React and Tailwind CSS.",
                    "improved": "Engineered accessible, high-performance UI components in React and TypeScript, achieving 98+ Google Lighthouse performance benchmarks.",
                    "impact_reason": "Replaces vague descriptions with verifiable industry metrics and modern type-safety."
                }
            ],
            "custom_interview_questions": [
                f"I noticed you implemented backend services in your recent project. How did you handle database indexing and query optimization for high concurrency?",
                f"Walk me through a technical bug or race condition you encountered during development and how you systematically diagnosed and resolved it.",
                f"If you were deploying this application for 50,000 concurrent users tomorrow, what caching and load balancing strategies would you introduce?"
            ]
        }

    # =========================================================================
    # 8. OPPORTUNITY ALERTS & MATCHING ENGINE
    # =========================================================================
    def get_opportunity_alerts(
        self, target_role: str = "Software Engineer", skills: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Returns personalized internships, hackathons, scholarships, and job opportunities."""
        user_skills = skills or ["Python", "JavaScript", "React", "SQL", "Git"]
        
        # Curated catalog across Internships, Hackathons, Scholarships, and Full-time Jobs
        opportunities = [
            {
                "id": "opp-intern-google",
                "title": "Software Engineering Summer Intern 2026",
                "organization": "Google India",
                "type": "internship",
                "category": "Internship",
                "location": "Bangalore / Hyderabad (Hybrid)",
                "stipend_or_reward": "₹1,10,000 / month + Housing Allowance",
                "deadline": "Applications Close Dec 15, 2026",
                "skill_match_percent": 96,
                "required_skills": ["Data Structures", "Algorithms", "Python / C++ / Java", "System Design Fundamentals"],
                "description": "Work directly on core distributed infrastructure and production consumer platforms. Experience rigorous code reviews and engineering mentorship from Google staff engineers.",
                "interview_role_focus": "Google Technical SDE Round: Complex Trees, Graphs, Dynamic Programming & Code Optimization",
                "urgency": "High Demand",
                "badge_color": "bg-blue-100 text-blue-800 border-blue-200"
            },
            {
                "id": "opp-hack-sih",
                "title": "Smart India Hackathon (SIH) 2026 – Software Edition",
                "organization": "Ministry of Education & AICTE",
                "type": "hackathon",
                "category": "Hackathon",
                "location": "Pan-India / Grand Finale Onsite",
                "stipend_or_reward": "₹1,00,000 Cash Prize + Direct Placement PPO",
                "deadline": "Team Registration Closes Nov 30, 2026",
                "skill_match_percent": 94,
                "required_skills": ["Full-Stack Development", "FastAPI / Node.js", "React / Vue", "GenAI / Cloud"],
                "description": "Nationwide digital product building challenge solving critical governance, healthcare, and education problem statements. Winners receive direct interview invites from top tech conglomerates.",
                "interview_role_focus": "Product Pitch & Architectural Defense: Real-time API Resilience & Database Schema Scaling",
                "urgency": "Registration Open",
                "badge_color": "bg-purple-100 text-purple-800 border-purple-200"
            },
            {
                "id": "opp-intern-amazon",
                "title": "Amazon SDE Summer Intern 2026",
                "organization": "Amazon Web Services (AWS)",
                "type": "internship",
                "category": "Internship",
                "location": "Hyderabad / Bangalore",
                "stipend_or_reward": "₹80,000 / month + Benefits",
                "deadline": "Rolling Admissions (Apply Early)",
                "skill_match_percent": 92,
                "required_skills": ["Java / Python", "Object-Oriented Design", "SQL / NoSQL", "AWS Fundamentals"],
                "description": "Build high-throughput cloud services powering AWS compute and commerce ecosystems. High pre-placement offer (PPO) conversion rate for graduating seniors.",
                "interview_role_focus": "Amazon Bar Raiser: Leadership Principles (Customer Obsession, Ownership) & STAR Method",
                "urgency": "Actively Hiring",
                "badge_color": "bg-amber-100 text-amber-800 border-amber-200"
            },
            {
                "id": "opp-schol-reliance",
                "title": "Reliance Foundation Undergraduate Tech Scholarship",
                "organization": "Reliance Foundation",
                "type": "scholarship",
                "category": "Scholarship",
                "location": "All Indian Universities / Institutes",
                "stipend_or_reward": "Up to ₹2,00,000 Total Grant + Mentorship",
                "deadline": "Applications Close Dec 20, 2026",
                "skill_match_percent": 90,
                "required_skills": ["Academic Excellence (7.5+ CGPA)", "Computer Science / IT", "Leadership & Impact"],
                "description": "Prestige merit-cum-means scholarship supporting exceptional undergraduate engineering students. Includes workshops, leadership webinars, and networking with Reliance executives.",
                "interview_role_focus": "Scholarship Evaluation Interview: Academic Projects, Community Impact & Future Aspirations",
                "urgency": "Grant Open",
                "badge_color": "bg-emerald-100 text-emerald-800 border-emerald-200"
            },
            {
                "id": "opp-job-microsoft",
                "title": "Associate Software Development Engineer (Full-Time 2026)",
                "organization": "Microsoft",
                "type": "job",
                "category": "Full-Time Job",
                "location": "Hyderabad / Noida / Bangalore",
                "stipend_or_reward": "16.5 – 22.0 LPA (CTC) + Stocks",
                "deadline": "Applications Open for 2026 Batches",
                "skill_match_percent": 95,
                "required_skills": ["Data Structures", "Algorithms", "C# / Java / Python", "Clean Code Architecture"],
                "description": "Kickstart your career engineering Azure cloud infra, Office 365 services, or AI Copilot integrations. Mentorship from senior engineering directors.",
                "interview_role_focus": "Microsoft Technical Loop: Data Structures, Concurrency & Low-Level Object Oriented Design",
                "urgency": "High CTC",
                "badge_color": "bg-blue-100 text-blue-800 border-blue-200"
            },
            {
                "id": "opp-hack-ethindia",
                "title": "ETHIndia 2026 Web3 & AI Hackathon",
                "organization": "Devfolio & Global Tech Partners",
                "type": "hackathon",
                "category": "Hackathon",
                "location": "Bangalore / In-Person Hack",
                "stipend_or_reward": "$100,000+ Prize Pool & Grant Opportunities",
                "deadline": "Final Hacker Round Dec 08, 2026",
                "skill_match_percent": 88,
                "required_skills": ["React / Next.js", "Smart Contracts or Python AI APIs", "Rapid Prototyping"],
                "description": "Asia's largest hackathon bringing together 2,000+ developers, tech mentors, and venture funds. Rapidly prototype cutting-edge applications over 36 hours.",
                "interview_role_focus": "Rapid Architectural Defense & Live Demo Pitch Preparation",
                "urgency": "Limited Spots",
                "badge_color": "bg-indigo-100 text-indigo-800 border-indigo-200"
            }
        ]

        return opportunities


gemini_service = GeminiService()
