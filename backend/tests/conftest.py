import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app
from backend.core.database import Base, get_db
from backend.models.user import User

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def db_engine():
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def auth_headers(client):
    """Registers and authenticates a test user and returns Authorization headers."""
    user_payload = {
        "email": "tester@yapwise.ai",
        "password": "Password123!",
        "full_name": "Test User",
        "target_role": "Backend Engineer",
        "experience_level": "Senior"
    }
    resp = client.post("/api/v1/auth/register", json=user_payload)
    if resp.status_code == 201:
        token = resp.json()["access_token"]
    else:
        login_resp = client.post("/api/v1/auth/login", json={
            "email": "tester@yapwise.ai",
            "password": "Password123!"
        })
        token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
