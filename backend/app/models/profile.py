import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

USER_TYPES = ("korean", "foreign_resident")


class Profile(Base):
    __tablename__ = "profiles"
    __table_args__ = (
        CheckConstraint("user_type IN ('korean', 'foreign_resident')", name="ck_profiles_user_type"),
    )

    # Supabase auth 사용자 ID (토큰의 sub)
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    email: Mapped[str | None] = mapped_column(String(255))
    nickname: Mapped[str] = mapped_column(String(20), unique=True)
    user_type: Mapped[str] = mapped_column(String(20))
    nationality: Mapped[str] = mapped_column(String(50))
    xp: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
