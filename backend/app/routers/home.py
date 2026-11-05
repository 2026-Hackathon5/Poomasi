"""B.1 메인 화면 — 닉네임, 레벨, 추천 미션, 나의 활동을 한 번에"""

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


def _count(db: Session, model, *conditions) -> int:
    """조건에 맞는 행 수"""
    return db.scalar(select(func.count()).select_from(model).where(*conditions)) or 0


def my_stats(db: Session, user_id: uuid.UUID) -> StatsOut:
    """나의 활동. 미션 숫자는 I.2·I.3 목록과 같게 삭제한 기록은 뺀다."""
    mine = (UserMission.user_id == user_id, UserMission.deleted_at.is_(None))
    return StatsOut(
        completed_missions=_count(db, UserMission, *mine, UserMission.status == "completed"),
        in_progress=_count(db, UserMission, *mine, UserMission.status.in_(ACTIVE_STATUSES)),
        reviews=_count(db, UserMission, *mine, UserMission.review.is_not(None)),
        posts=_count(db, Post, Post.author_id == user_id),
        comments=_count(db, Comment, Comment.author_id == user_id),
    )


@router.get(
    "",
    summary="B.1 메인 (닉네임, 레벨, 추천 미션, 나의 활동) · I.4 프로필 나의 활동",
    response_model=HomeOut,
)
def get_home(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> HomeOut:
    """recommended가 null이면 프론트는 '미션 뽑으러 가기' 버튼을 보여준다. 다음 미션은 I.2 목록에서 본다."""
    active = oldest_active_mission(db, profile.id)
    return HomeOut(
        nickname=profile.nickname,
        level=LevelOut.from_xp(profile.xp),
        recommended=UserMissionOut.from_user_mission(active) if active else None,
        stats=my_stats(db, profile.id),
    )
