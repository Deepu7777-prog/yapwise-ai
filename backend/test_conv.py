import requests
import json
from backend.core.config import settings

def test_turn2():
    api_key = settings.GEMINI_API_KEY
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}"
    
    prompt = """
You are the AI Voice Conversation Partner and English Coach at YapWise AI.
Conversation History:
User: "Can you know about my how is my speaking skills and where I was fumbling?"
Model: "That's really fascinating! Tell me more about what you enjoy most about it, or what you plan to learn next."

User just said:
"Are you asking the question repeatedly without knowing what I was sending to you?"

CRITICAL INSTRUCTIONS:
The user is rightly calling you out for ignoring their question and giving a generic response earlier.
1. Immediately acknowledge and apologize for the repetitive, unhelpful response.
2. Directly answer their core request: they want to know how their speaking skills are and where they were fumbling.
3. Offer a constructive evaluation of their sentences and ask how they'd like to proceed.
Return strict JSON with spoken_response, has_correction, original_phrase, corrected_phrase, correction_explanation, follow_up_question, evaluation.
"""
    r = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=15)
    print("Turn 2 status:", r.status_code)
    data = r.json()
    print("Turn 2 text:\n", data["candidates"][0]["content"]["parts"][0]["text"])

if __name__ == "__main__":
    test_turn2()
