def test_register_user(client):
    payload = {
        "email": "sarah@yapwise.ai",
        "password": "SecurePassword99",
        "full_name": "Sarah Connor",
        "target_role": "Product Manager",
        "experience_level": "Director"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "sarah@yapwise.ai"
    assert data["user"]["full_name"] == "Sarah Connor"


def test_login_user(client):
    payload = {
        "email": "john@yapwise.ai",
        "password": "Password123!",
        "full_name": "John Doe",
    }
    client.post("/api/v1/auth/register", json=payload)

    login_resp = client.post("/api/v1/auth/login", json={
        "email": "john@yapwise.ai",
        "password": "Password123!"
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


def test_duplicate_registration_fails(client):
    payload = {
        "email": "dup@yapwise.ai",
        "password": "Password123!",
        "full_name": "Dup User",
    }
    resp1 = client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"]


def test_get_current_user_profile(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "tester@yapwise.ai"
    assert data["full_name"] == "Test User"
