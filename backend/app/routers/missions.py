from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_profile
from app.db import get_db
from app.models import Mission, Profile
from app.schemas.mission import MissionOut, VerifyType
from app.services.missions import my_statuses, visible_missions

router = APIRouter(prefix="/api/missions", tags=["E. 랜덤미션"])


@router.get(
    "",
    summary="E.4 미션 목록 (H.2 장소 찾기는 verify_type=location)",
    response_model=list[MissionOut],
)
def list_missions(
    country: str | None = Query(None, description="나라 (없으면 전체)", examples=["베트남"]),
    verify_type: VerifyType | None = Query(None, description="인증 방식으로 거르기"),
    limit: int = Query(20, ge=1, le=100, description="한 번에 가져올 개수"),
    offset: int = Query(0, ge=0, description="건너뛸 개수 (다음 페이지)"),
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> list[MissionOut]:
    """최신순. 숨긴(삭제한) 미션은 빼고, 각 미션에 내 진행 상태(my_status)를 붙여 준다."""
    stmt = visible_missions()
    if country and country.strip():
        stmt = stmt.where(Mission.country == country.strip())
    if verify_type:
        stmt = stmt.where(Mission.verify_type == verify_type)
    stmt = stmt.order_by(Mission.created_at.desc(), Mission.id.desc()).limit(limit).offset(offset)

    missions = db.scalars(stmt).all()
    statuses = my_statuses(db, profile.id, (m.id for m in missions))
    return [MissionOut.from_mission(m, statuses.get(m.id)) for m in missions]
