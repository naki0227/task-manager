"""
Email/Password Authentication Router with Database
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import jwt
from sqlalchemy.orm import Session
import hashlib

from app.database import get_db
from app.models import User

router = APIRouter()

# Secret key for JWT (in production, use a proper secret from env)
SECRET_KEY = "vision-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str = ""


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


def hash_password(password: str) -> str:
    """Simple password hashing (use bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Email/Password login"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="メールアドレスまたはパスワードが正しくありません")
    
    if not user.password_hash or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="メールアドレスまたはパスワードが正しくありません")
    
    access_token = create_access_token({"sub": user.email, "user_id": user.id})
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name or "",
        }
    )


@router.post("/signup", response_model=TokenResponse)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Create new account"""
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="このメールアドレスは既に登録されています")
    
    # Create new user
    new_user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        name=request.name or request.email.split("@")[0],
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token({"sub": new_user.email, "user_id": new_user.id})
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name or "",
        }
    )
