def test_start_hr_interview(client, auth_headers):
    payload = {
        "interview_type": "hr",
        "title": "Senior PM Behavioral",
        "target_role": "Product Manager"
    }
    response = client.post("/api/v1/interview/start", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["interview_type"] == "hr"
    assert data["status"] == "in_progress"
    assert len(data["turns"]) == 1
    assert data["turns"][0]["role"] == "interviewer"


def test_submit_interview_turn(client, auth_headers):
    # 1. Start interview
    start_resp = client.post("/api/v1/interview/start", json={"interview_type": "technical", "target_role": "Architect"}, headers=auth_headers)
    session_id = start_resp.json()["id"]

    # 2. Answer question
    turn_resp = client.post("/api/v1/interview/turn", json={
        "session_id": session_id,
        "user_response": "I approach high-throughput architectures by separating read and write pathways with CQRS and using Redis as an invalidation cache.",
        "audio_duration_seconds": 25.0
    }, headers=auth_headers)

    assert turn_resp.status_code == 200
    turn_data = turn_resp.json()
    assert turn_data["session_id"] == session_id
    assert turn_data["user_turn"]["role"] == "candidate"
    assert turn_data["user_turn"]["score"] is not None
    assert turn_data["next_question"]["role"] == "interviewer"
