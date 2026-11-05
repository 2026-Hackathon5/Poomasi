"""E.3 미션 만들기 · E.5 내가 만든 미션 목록·삭제

missions.py(뽑기·목록·수락)와 같은 주소(/api/missions)를 쓰지만 파일을 나눠서 같이 작업해도 겹치지 않게 했다.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_profile
from app.db import get_db
from app.models import Mission, Profile
from app.schemas.created_mission import MissionCreate, MissionDeletedOut
from app.schemas.mission import MissionOut
from app.services.geocode import GeocodeUnavailable, geocode
from app.services.missions import my_statuses, visible_missions

router = APIRouter(prefix="/api/missions", tags=["E. 랜덤미션"])


@router.post(
    "",
    summary="E.3 미션 만들기",
    response_model=MissionOut,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"description": "위치 미션 주소를 찾지 못함"},
        503: {"description": "주소 확인 서버(카카오)에 연결하지 못함"},
    },
)
def create_mission(
    body: MissionCreate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> MissionOut:
    """위치 미션이면 주소를 카카오로 좌표 변환해서 저장한다. 만든 사람은 source=user, creator_id=나."""
    lat = lng = None
    if body.verify_type == "location":
        try:
            coords = geocode(body.address)
        except GeocodeUnavailable:
            raise HTTPException(503, detail="주소를 확인하지 못했어요. 잠시 후 다시 시도해주세요")
        if coords is None:
            raise HTTPException(400, detail="주소를 찾지 못했어요. 다시 입력해주세요")
        lat, lng = coords

    mission = Mission(
        title=body.title,
        description=body.description,
        country=body.country,
        category=body.category,
        verify_type=body.verify_type,
        source="user",
        place_name=body.place_name,
        address=body.address,
        lat=lat,
        lng=lng,
        creator_id=profile.id,
    )
    db.add(mission)
    db.commit()
    db.refresh(mission)
    return MissionOut.from_mission(mission)


@router.get(
    "/mine",
    summary="E.5 내가 만든 미션",
    response_model=list[MissionOut],
)
def list_my_missions(
    limit: int = Query(20, ge=1, le=100, description="한 번에 가져올 개수"),
    offset: int = Query(0, ge=0, description="건너뛸 개수 (다음 페이지)"),
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> list[MissionOut]:
    """최신순. 삭제(숨김)한 미션은 빼고, 내가 직접 수락했다면 my_status도 붙여 준다."""
    stmt = (
        visible_missions()
        .where(Mission.creator_id == profile.id)
        .order_by(Mission.created_at.desc(), Mission.id.desc())
        .limit(limit)
        .offset(offset)
    )
    missions = db.scalars(stmt).all()
    statuses = my_statuses(db, profile.id, (m.id for m in missions))
    return [MissionOut.from_mission(m, statuses.get(m.id)) for m in missions]


@router.delete(
    "/{mission_id}",
    summary="E.5 내가 만든 미션 삭제 (작성자만)",
    response_model=MissionDeletedOut,
    responses={
        403: {"description": "내가 만든 미션이 아님"},
        404: {"description": "없거나 이미 삭제한 미션"},
    },
)
def delete_my_mission(
    mission_id: int,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> MissionDeletedOut:
    """진짜로 지우지 않고 deleted_at만 채운다 → 목록·뽑기·지도에서 숨김. 이미 수락한 사람은 계속 진행 가능."""
    mission = db.get(Mission, mission_id)
    if mission is None or mission.deleted_at is not None:
        raise HTTPException(404, detail="미션을 찾을 수 없어요")
    if mission.creator_id != profile.id:
        raise HTTPException(403, detail="내가 만든 미션만 삭제할 수 있어요")

    mission.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return MissionDeletedOut(id=mission.id, title=mission.title)
