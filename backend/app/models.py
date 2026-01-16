"""
Database Models
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), default="")
    password_hash = Column(String(255), nullable=True)  # Null for OAuth-only users
    avatar_url = Column(String(500), default="")
    bio = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    oauth_tokens = relationship("OAuthToken", back_populates="user")
    tasks = relationship("Task", back_populates="user")
    skills = relationship("Skill", back_populates="user")


class OAuthToken(Base):
    __tablename__ = "oauth_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String(50), nullable=False)  # github, google, slack, etc.
    access_token = Column(String(500), nullable=False)
    refresh_token = Column(String(500), nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="oauth_tokens")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, default="")
    status = Column(String(50), default="pending")  # pending, ready, in_progress, completed
    source = Column(String(50), default="manual")  # manual, github, calendar, slack
    estimated_time = Column(String(50), default="")
    prepared_items = Column(Text, default="[]")  # JSON array
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="tasks")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    skill_id = Column(String(50), nullable=False)  # react, typescript, python, etc.
    level = Column(Integer, default=1)
    max_level = Column(Integer, default=3)
    exp = Column(Integer, default=0)
    unlocked = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="skills")


class Snapshot(Base):
    __tablename__ = "snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    windows = Column(Text, default="[]")  # JSON array
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
