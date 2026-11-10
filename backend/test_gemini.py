import requests
import json
from backend.core.config import settings

def test_all():
    api_key = settings.GEMINI_API_KEY
    candidates = [
        "gemini-3.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-flash-latest",
        "gemini-pro-latest",
        "gemini-3.7-flash",
        "gemini-2.0-flash"
    ]
    working = []
    for m in candidates:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        try:
            r = requests.post(url, json={"contents": [{"parts": [{"text": "Hi"}]}]}, timeout=5)
            if r.status_code == 200:
                print(f"Working: {m}")
                working.append(m)
            else:
                print(f"Failed: {m} (HTTP {r.status_code})")
        except Exception as e:
            print(f"Error {m}: {e}")
    print("ALL WORKING MODELS:", working)

if __name__ == "__main__":
    test_all()
