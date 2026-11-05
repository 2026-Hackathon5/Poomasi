import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.mission import Mission

USER_MISSION_STATUSES = ("in_progress", "reviewing", "completed", "cancelled")
ACTIVE_STATUSES = ("in_progress", "reviewing")  # I.2 진행 중 목록에 보이는 상태


class UserMission(Base):
    __tablename__ = "user_missions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('in_progress', 'reviewing', 'completed', 'cancelled')",
            name="ck_user_missions_status",
        ),
        CheckConstraint("char_length(review) <= 300", name="ck_user_missions_review_len"),
        # 같은 미션을 동시에 두 번 진행할 수 없다
        Index(
            "uq_user_missions_active",
            "user_id",
            "mission_id",
            unique=True,
            postgresql_where=text("status IN ('in_progress', 'reviewing')"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    mission_id: Mapped[int] = mapped_column(ForeignKey("missions.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="in_progress", server_default="in_progress")
    accepted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    xp_awarded: Mapped[int | None] = mapped_column(Integer)
    photo_url: Mapped[str | None] = mapped_column(String(500))
    review: Mapped[str | None] = mapped_column(String(300))
    # I.3 후기 작성(마지막으로 고친) 날짜
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # I.3 완료 기록 삭제 (soft delete, xp는 유지)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    mission: Mapped[Mission] = relationship(lazy="joined")
