"""H.1 내 기록 지도 — 위치 인증으로 완료한 장소 깃발

H.2 장소 찾기 핀은 이 파일이 아니라 GET /api/missions?verify_type=location (my_status가 null인 것)을 쓴다.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_profile
from app.db import get_db
from app.models import Mission, Profile, UserMission
from app.schemas.user_mission import UserMissionOut

router = APIRouter(prefix="/api/map", tags=["H. 미션 지도"])


@router.get(
    "/flags",
    summary="H.1 내 완료 장소 깃발",
    response_model=list[UserMissionOut],
)
def list_my_flags(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> list[UserMissionOut]:
    """위치 미션을 완료한 기록만, 최근에 완료한 것부터. 빈 배열이면 빈 상태 안내.

    - 깃발 좌표는 mission.lat / mission.lng
    - 카드의 기록 삭제·후기 작성은 응답의 id(내 미션 id)로 부른다
    - 완료 기록을 삭제하면 깃발도 사라진다. 미션 자체가 삭제(숨김)돼도 내가 완료한 깃발은 남는다
    - 지도에 한 번에 다 그려야 해서 limit / offset 없이 전부 돌려준다
    """
    rows = db.scalars(
        select(UserMission)
        .join(Mission, UserMission.mission_id == Mission.id)
        .where(
            UserMission.user_id == profile.id,
            UserMission.status == "completed",
            UserMission.deleted_at.is_(None),
            Mission.verify_type == "location",
        )
        .order_by(UserMission.completed_at.desc(), UserMission.id.desc())
    ).all()
    return [UserMissionOut.from_user_mission(um) for um in rows]
