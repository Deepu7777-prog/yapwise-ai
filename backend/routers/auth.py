import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.security import create_access_token
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.schemas.user import UserCreate, UserLogin, GoogleLoginRequest, UserResponse, UserUpdate, Token
from backend.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = AuthService.get_user_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    user = AuthService.create_user(db, user_in)
    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = AuthService.authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/google", response_model=Token)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    clean_email = str(payload.email).strip().lower()
    user = AuthService.get_user_by_email(db, clean_email)
    if not user:
        raw_name = payload.full_name or clean_email.split("@")[0].replace(".", " ").title()
        random_pwd = secrets.token_urlsafe(32)
        user_in = UserCreate(
            email=clean_email,
            password=random_pwd,
            full_name=raw_name,
            target_role="Software Engineer",
            experience_level="Student"
        )
        user = AuthService.create_user(db, user_in)

    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_in: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_in.full_name is not None:
        user.full_name = profile_in.full_name
    if profile_in.target_role is not None:
        user.target_role = profile_in.target_role
    if profile_in.experience_level is not None:
        user.experience_level = profile_in.experience_level
    if profile_in.avatar_url is not None:
        user.avatar_url = profile_in.avatar_url
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)
