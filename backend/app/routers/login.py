"""
Email/Password Authentication Router
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import jwt
from app.config import get_settings

router = APIRouter()
settings = get_settings()

# Secret key for JWT (in production, use a proper secret)
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


class UserResponse(BaseModel):
    id: int
    email: str
    name: str


# Mock user database (replace with real database)
MOCK_USERS = {
    "user@example.com": {
        "id": 1,
        "email": "user@example.com",
        "password": "password123",  # In production, hash passwords!
        "name": "Test User",
    }
}


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Email/Password login"""
    user = MOCK_USERS.get(request.email)
    
    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="メールアドレスまたはパスワードが正しくありません")
    
    access_token = create_access_token({"sub": user["email"], "user_id": user["id"]})
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
        }
    )


@router.post("/signup", response_model=TokenResponse)
async def signup(request: SignupRequest):
    """Create new account"""
    if request.email in MOCK_USERS:
        raise HTTPException(status_code=400, detail="このメールアドレスは既に登録されています")
    
    # Create new user (in production, hash password and save to database)
    new_user = {
        "id": len(MOCK_USERS) + 1,
        "email": request.email,
        "password": request.password,
        "name": request.name or request.email.split("@")[0],
    }
    MOCK_USERS[request.email] = new_user
    
    access_token = create_access_token({"sub": new_user["email"], "user_id": new_user["id"]})
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": new_user["id"],
            "email": new_user["email"],
            "name": new_user["name"],
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: str = None):
    """Get current user from token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="認証が必要です")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = MOCK_USERS.get(email)
        if not user:
            raise HTTPException(status_code=401, detail="ユーザーが見つかりません")
        return UserResponse(id=user["id"], email=user["email"], name=user["name"])
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="無効なトークンです")
