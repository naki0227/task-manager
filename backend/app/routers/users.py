"""
User Profile Router
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from jose import jwt, JWTError

from app.database import get_db
from app.models import User, OAuthToken
from app.routers.login import SECRET_KEY, ALGORITHM

router = APIRouter()


class UserProfile(BaseModel):
    id: int
    email: str
    name: str
    avatar_url: str
    bio: str
    connected_services: list[str]

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    """Get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="認証が必要です")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="無効なトークンです")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
        
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="無効なトークンです")


@router.get("/users/me", response_model=UserProfile)
async def get_my_profile(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    user = get_current_user(authorization, db)
    
    # Get connected services
    oauth_tokens = db.query(OAuthToken).filter(OAuthToken.user_id == user.id).all()
    connected_services = [token.provider for token in oauth_tokens]
    
    return UserProfile(
        id=user.id,
        email=user.email,
        name=user.name or "",
        avatar_url=user.avatar_url or "",
        bio=user.bio or "",
        connected_services=connected_services,
    )


@router.patch("/users/me", response_model=UserProfile)
async def update_my_profile(
    request: UpdateProfileRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    user = get_current_user(authorization, db)
    
    # Update fields if provided
    if request.name is not None:
        user.name = request.name
    if request.avatar_url is not None:
        user.avatar_url = request.avatar_url
    if request.bio is not None:
        user.bio = request.bio
    
    db.commit()
    db.refresh(user)
    
    # Get connected services
    oauth_tokens = db.query(OAuthToken).filter(OAuthToken.user_id == user.id).all()
    connected_services = [token.provider for token in oauth_tokens]
    
    return UserProfile(
        id=user.id,
        email=user.email,
        name=user.name or "",
        avatar_url=user.avatar_url or "",
        bio=user.bio or "",
        connected_services=connected_services,
    )
