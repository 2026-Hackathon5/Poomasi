"""B.1 메인 화면 — 레벨, 추천 미션, 활동 통계를 한 번에"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import get_current_profile
from app.db import get_db
from app.models import ACTIVE_STATUSES, Comment, Post, Profile, UserMission
from app.schemas.home import HomeOut, StatsOut
from app.schemas.level import LevelOut
from app.schemas.user_mission import UserMissionOut

router = APIRouter(prefix="/api/home", tags=["B. 메인"])


def oldest_active_mission(db: Session, user_id: uuid.UUID) -> UserMission | None:
    """진행 중·확인 중 미션 중 가장 오래전에 수락한 1개 (I.2 진행 중 목록의 맨 앞과 같다)."""
    return db.scalars(
        select(UserMission)
        .where(
            UserMission.user_id == user_id,
            UserMission.status.in_(ACTIVE_STATUSES),
            UserMission.deleted_at.is_(None),
        )
        .order_by(UserMission.accepted_at.asc(), UserMission.id.asc())
        .limit(1)
    ).first()


def my_stats(db: Session, user_id: uuid.UUID) -> StatsOut:
    """완료 미션 수(I.3 목록과 같게 삭제한 기록은 뺌), 내가 쓴 글 수, 내가 단 댓글 수."""
    completed = db.scalar(
        select(func.count())
        .select_from(UserMission)
        .where(
            UserMission.user_id == user_id,
            UserMission.status == "completed",
            UserMission.deleted_at.is_(None),
        )
    )
    posts = db.scalar(select(func.count()).select_from(Post).where(Post.author_id == user_id))
    comments = db.scalar(select(func.count()).select_from(Comment).where(Comment.author_id == user_id))
    return StatsOut(completed_missions=completed or 0, posts=posts or 0, comments=comments or 0)


@router.get(
    "",
    summary="B.1 메인 (레벨, 추천 미션, 통계) · I.4 프로필 통계",
    response_model=HomeOut,
)
def get_home(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> HomeOut:
    """recommended가 null이면 프론트는 '미션 뽑으러 가기' 버튼을 보여준다. 다음 미션은 I.2 목록에서 본다."""
    active = oldest_active_mission(db, profile.id)
    return HomeOut(
        level=LevelOut.from_xp(profile.xp),
        recommended=UserMissionOut.from_user_mission(active) if active else None,
        stats=my_stats(db, profile.id),
    )
