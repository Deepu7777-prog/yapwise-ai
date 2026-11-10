import json
from backend.services.gemini_service import gemini_service

def run_tests():
    print("=== TEST 1: User asks about speaking skills and fumbling ===")
    history = []
    q1 = "Can you know about my how is my speaking skills and where I was fumbling?"
    res1 = gemini_service.speaking_companion_turn(
        user_speech=q1,
        mode="free",
        history=history,
        role="Java Developer"
    )
    print("RES 1 Spoken Response:")
    print(res1["spoken_response"])
    print("Has correction:", res1["has_correction"])
    print("Original:", res1.get("original_phrase"))
    print("Corrected:", res1.get("corrected_phrase"))
    print("Explanation:", res1.get("correction_explanation"))
    print("Follow up:", res1.get("follow_up_question"))

    history.append({"speaker": "user", "text": q1})
    history.append({"speaker": "ai", "text": res1["spoken_response"]})

    print("\n=== TEST 2: User calls out repetition / not listening ===")
    q2 = "Are you asking the question repeatedly without knowing what I was sending to you?"
    res2 = gemini_service.speaking_companion_turn(
        user_speech=q2,
        mode="free",
        history=history,
        role="Java Developer"
    )
    print("RES 2 Spoken Response:")
    print(res2["spoken_response"])
    print("Has correction:", res2["has_correction"])
    print("Follow up:", res2.get("follow_up_question"))

    print("\n=== TEST 3: Fallback Verification (Offline simulation) ===")
    res_fb1 = gemini_service._fallback_speaking_companion(q1, "free", [], "Java Developer")
    print("Fallback 1 Spoken:", res_fb1["spoken_response"][:120])
    res_fb2 = gemini_service._fallback_speaking_companion(q2, "free", [], "Java Developer")
    print("Fallback 2 Spoken:", res_fb2["spoken_response"][:120])
    
    assert "That's really fascinating" not in res_fb1["spoken_response"], "Generic fallback detected in 1!"
    assert "That's really fascinating" not in res_fb2["spoken_response"], "Generic fallback detected in 2!"
    assert res1["spoken_response"] != res2["spoken_response"], "Repetition detected between turns!"
    print("\nALL CONVERSATION TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
