import re
from typing import Dict, Tuple

COMMON_FILLER_WORDS = [
    "um", "uh", "er", "ah", "like", "you know", "actually", "basically",
    "literally", "sort of", "kind of", "i mean", "right", "honestly", "okay"
]


class SpeechService:
    @staticmethod
    def analyze_filler_words(transcript: str) -> Tuple[int, Dict[str, int]]:
        """Detect and count filler words in a given transcript."""
        text = transcript.lower()
        counts: Dict[str, int] = {}
        total = 0

        # Multi-word fillers first
        multi_word = ["you know", "sort of", "kind of", "i mean"]
        for phrase in multi_word:
            matches = len(re.findall(r'\b' + re.escape(phrase) + r'\b', text))
            if matches > 0:
                counts[phrase] = matches
                total += matches
                # Replace with placeholder to avoid double-counting single words
                text = re.sub(r'\b' + re.escape(phrase) + r'\b', ' ', text)

        # Single word fillers
        single_word = ["um", "uh", "er", "ah", "like", "actually", "basically", "literally", "right", "honestly"]
        for word in single_word:
            matches = len(re.findall(r'\b' + re.escape(word) + r'\b', text))
            if matches > 0:
                counts[word] = matches
                total += matches

        return total, counts

    @staticmethod
    def calculate_wpm(transcript: str, duration_seconds: float) -> float:
        """Calculate words per minute."""
        words = transcript.strip().split()
        word_count = len(words)
        if duration_seconds <= 0:
            duration_seconds = max(1.0, word_count / 2.2)  # heuristic approx ~130 wpm
        minutes = duration_seconds / 60.0
        wpm = round(word_count / minutes, 1)
        return min(max(wpm, 0.0), 300.0)

    @staticmethod
    def heuristic_scoring(transcript: str, wpm: float, filler_count: int) -> Dict[str, float]:
        """Provides heuristic fallback scores if AI service is offline."""
        word_count = len(transcript.strip().split())
        
        # Pacing score (optimal is 130-160 WPM)
        if 125 <= wpm <= 165:
            fluency = 92.0
        elif 100 <= wpm < 125 or 165 < wpm <= 185:
            fluency = 82.0
        elif 80 <= wpm < 100 or 185 < wpm <= 210:
            fluency = 72.0
        else:
            fluency = 60.0

        # Filler word penalty
        filler_ratio = filler_count / max(word_count, 1)
        if filler_ratio < 0.02:
            clarity = 94.0
        elif filler_ratio < 0.05:
            clarity = 84.0
        elif filler_ratio < 0.10:
            clarity = 72.0
        else:
            clarity = 58.0

        vocabulary = min(88.0, 65.0 + (word_count * 0.2))
        confidence = max(55.0, (fluency * 0.6) + (clarity * 0.4) - (filler_count * 1.5))
        relevance = 85.0
        overall = round((clarity + fluency + vocabulary + confidence + relevance) / 5.0, 1)

        return {
            "clarity_score": round(clarity, 1),
            "fluency_score": round(fluency, 1),
            "vocabulary_score": round(vocabulary, 1),
            "confidence_score": round(min(confidence, 98.0), 1),
            "relevance_score": round(relevance, 1),
            "overall_score": overall,
        }
