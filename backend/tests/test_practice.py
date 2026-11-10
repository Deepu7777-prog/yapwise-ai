def test_evaluate_speech_practice(client, auth_headers):
    payload = {
        "title": "Opening Extempore",
        "topic": "The Future of Artificial Intelligence",
        "mode": "extempore",
        "transcript": "Um, artificial intelligence is basically revolutionizing software engineering, like you know, we are writing code much faster.",
        "audio_duration_seconds": 15.0,
    }
    response = client.post("/api/v1/practice/evaluate", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["wpm"] > 0
    assert data["filler_words_count"] >= 3
    assert "um" in data["filler_words_breakdown"]
    assert "like" in data["filler_words_breakdown"]
    assert data["overall_score"] > 0
    assert len(data["strengths"]) > 0
    assert len(data["recommendations"]) > 0


def test_evaluate_empty_transcript_fails(client, auth_headers):
    payload = {
        "title": "Bad Speech",
        "topic": "Empty",
        "mode": "extempore",
        "transcript": "   ",
        "audio_duration_seconds": 10.0,
    }
    response = client.post("/api/v1/practice/evaluate", json=payload, headers=auth_headers)
    assert response.status_code == 400


def test_get_practice_history(client, auth_headers):
    # Submit one practice first
    client.post(
        "/api/v1/practice/evaluate",
        json={
            "title": "Pacing Session",
            "topic": "Leadership",
            "mode": "pacing",
            "transcript": "Leadership requires steady pacing and empathetic listening across teams.",
            "audio_duration_seconds": 10.0,
        },
        headers=auth_headers,
    )

    response = client.get("/api/v1/practice/history", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) >= 1
