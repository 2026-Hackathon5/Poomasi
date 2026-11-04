from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import get_current_profile
from app.db import get_db
from app.models import ACTIVE_STATUSES, Mission, Profile, UserMission
from app.schemas.country import CountryCode
from app.schemas.mission import MissionOut, VerifyType
from app.services.missions import my_statuses, visible_missions

router = APIRouter(prefix="/api/missions", tags=["E. 랜덤미션"])


@router.get(
    "",
    summary="E.4 미션 목록 (H.2 장소 찾기는 verify_type=location)",
    response_model=list[MissionOut],
)
def list_missions(
    country: CountryCode | None = Query(None, description="나라 코드 KR / JP / CN / US (없으면 전체)"),
    verify_type: VerifyType | None = Query(None, description="인증 방식으로 거르기"),
    limit: int = Query(20, ge=1, le=100, description="한 번에 가져올 개수"),
    offset: int = Query(0, ge=0, description="건너뛸 개수 (다음 페이지)"),
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> list[MissionOut]:
    """최신순. 숨긴(삭제한) 미션은 빼고, 각 미션에 내 진행 상태(my_status)를 붙여 준다."""
    stmt = visible_missions()
    if country:
        stmt = stmt.where(Mission.country == country)
    if verify_type:
        stmt = stmt.where(Mission.verify_type == verify_type)
    stmt = stmt.order_by(Mission.created_at.desc(), Mission.id.desc()).limit(limit).offset(offset)

    missions = db.scalars(stmt).all()
    statuses = my_statuses(db, profile.id, (m.id for m in missions))
    return [MissionOut.from_mission(m, statuses.get(m.id)) for m in missions]


@router.get(
    "/random",
    summary="E.2 미션 뽑기 / 다시 뽑기",
    response_model=MissionOut,
    responses={404: {"description": "뽑을 수 있는 미션이 없음 → 기존 결과 유지"}},
)
def draw_mission(
    country: CountryCode | None = Query(None, description="나라 코드 KR / JP / CN / US (없으면 전체 나라에서 뽑기)"),
    exclude_id: int | None = Query(None, description="다시 뽑기: 직전에 뽑은 미션 id"),
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> MissionOut:
    """숨긴 미션, 내가 진행 중이거나 완료한 미션은 빼고 무작위로 1개 고른다."""
    # 내가 이미 하고 있거나 끝낸 미션 id 목록 (취소한 미션은 다시 뽑힐 수 있다)
    taken = select(UserMission.mission_id).where(
        UserMission.user_id == profile.id,
        UserMission.status.in_((*ACTIVE_STATUSES, "completed")),
    )
    candidates = visible_missions().where(Mission.id.not_in(taken))
    if country:
        candidates = candidates.where(Mission.country == country)

    stmt = candidates
    if exclude_id is not None:
        stmt = stmt.where(Mission.id != exclude_id)

    # ORDER BY random() LIMIT 1 = 후보를 섞어서 맨 앞 하나
    mission = db.scalars(stmt.order_by(func.random()).limit(1)).first()
    if mission is None:
        if exclude_id is not None and db.scalar(candidates.where(Mission.id == exclude_id)) is not None:
            # 남은 후보가 직전 미션 하나뿐인 경우 (E.2 "다른 미션이 없으면 안내 후 기존 결과 유지")
            raise HTTPException(404, detail="다른 미션이 없어요. 지금 미션에 도전해 보세요")
        raise HTTPException(404, detail="뽑을 수 있는 미션이 없어요")
    # 후보에서 내가 하는 미션을 이미 뺐으니 my_status는 항상 null
    return MissionOut.from_mission(mission)
