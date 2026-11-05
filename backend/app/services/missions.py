"""미션 조회에서 여러 API가 같이 쓰는 부품 (E.2 뽑기, E.4 목록, E.5 내가 만든 미션, H.2 장소 찾기)"""

import uuid
from collections.abc import Iterable

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models import ACTIVE_STATUSES, Mission, UserMission

# 같은 미션에 기록이 여러 개일 때(취소 후 다시 수락 등) 어떤 상태를 보여줄지 우선순위
_STATUS_PRIORITY = {"in_progress": 3, "reviewing": 3, "completed": 2}


def visible_missions() -> Select[tuple[Mission]]:
    """숨기지(삭제하지) 않은 미션만 고르는 기본 쿼리 (E.5 삭제 = 숨김)"""
    return select(Mission).where(Mission.deleted_at.is_(None))


def taken_mission_ids(user_id: uuid.UUID) -> Select[tuple[int]]:
    """내가 진행 중이거나 완료한 미션 id 목록 (취소한 미션은 빠져서 다시 할 수 있다).
    뽑기(E.2)와 장소 찾기(H.2)에서 '아직 안 한 미션'만 고를 때 쓴다."""
    return select(UserMission.mission_id).where(
        UserMission.user_id == user_id,
        UserMission.status.in_((*ACTIVE_STATUSES, "completed")),
    )


def my_statuses(db: Session, user_id: uuid.UUID, mission_ids: Iterable[int]) -> dict[int, str]:
    """미션 id → 내 진행 상태. 한 번도 수락 안 했거나 취소만 했으면 dict에 없다."""
    ids = list(mission_ids)
    if not ids:
        return {}
    rows = db.execute(
        select(UserMission.mission_id, UserMission.status).where(
            UserMission.user_id == user_id,
            UserMission.mission_id.in_(ids),
            UserMission.status != "cancelled",
        )
    ).all()
    result: dict[int, str] = {}
    for mission_id, status in rows:
        current = result.get(mission_id)
        if current is None or _STATUS_PRIORITY[status] > _STATUS_PRIORITY[current]:
            result[mission_id] = status
    return result
