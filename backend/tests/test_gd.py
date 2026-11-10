def test_start_group_discussion(client, auth_headers):
    payload = {
        "topic": "Ethics of Generative AI in Code Automation",
        "category": "Tech Ethics"
    }
    response = client.post("/api/v1/gd/start", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["topic"] == payload["topic"]
    assert len(data["turns"]) >= 3  # Moderator, Priya, Marcus


def test_submit_gd_turn(client, auth_headers):
    # 1. Start GD
    start_resp = client.post("/api/v1/gd/start", json={}, headers=auth_headers)
    session_id = start_resp.json()["id"]

    # 2. User joins debate
    turn_resp = client.post("/api/v1/gd/turn", json={
        "session_id": session_id,
        "user_argument": "While Priya is right about productivity, Marcus raises a valid point on provenance and security. We need automated policy guards at the IDE level."
    }, headers=auth_headers)

    assert turn_resp.status_code == 200
    data = turn_resp.json()
    assert data["user_turn"]["speaker_role"] == "user"
    assert len(data["ai_reactions"]) >= 1
    assert "live_feedback" in data
