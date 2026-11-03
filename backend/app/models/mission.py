import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

VERIFY_TYPES = ("location", "photo", "none")
MISSION_SOURCES = ("ai", "user")


class Mission(Base):
    __tablename__ = "missions"
    __table_args__ = (
        CheckConstraint("verify_type IN ('location', 'photo', 'none')", name="ck_missions_verify_type"),
        CheckConstraint("source IN ('ai', 'user')", name="ck_missions_source"),
        # 위치 미션은 좌표가 꼭 있어야 한다
        CheckConstraint(
            "verify_type <> 'location' OR (lat IS NOT NULL AND lng IS NOT NULL)",
            name="ck_missions_location_coords",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    country: Mapped[str] = mapped_column(String(50), index=True)
    category: Mapped[str] = mapped_column(String(50))
    verify_type: Mapped[str] = mapped_column(String(10))
    source: Mapped[str] = mapped_column(String(10), default="user", server_default="user")
    place_name: Mapped[str | None] = mapped_column(String(100))
    address: Mapped[str | None] = mapped_column(String(255))
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    radius_m: Mapped[int] = mapped_column(Integer, default=300, server_default="300")
    # null이면 팀 시드 미션
    creator_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("profiles.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # E.5 삭제 = 숨김. 이미 수락한 사람은 계속 수행 가능
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
