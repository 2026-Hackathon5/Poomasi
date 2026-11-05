"""내 미션 (I.2 진행 중·취소, I.3 완료·후기·삭제) + 인증 API (F)

주소의 {user_mission_id}는 "내 미션 id"다 (수락 API 응답의 id). 미션 id가 아니다.
"""

from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_profile
from app.db import get_db
from app.models import ACTIVE_STATUSES, Profile, UserMission
from app.schemas.user_mission import ReviewIn, UserMissionOut
from app.schemas.verify import LocationIn, VerifyResultOut
from app.services.verify import check_verifiable, complete_mission, distance_m, format_distance

VERIFY_TAG = "F. 미션 인증"
VERIFY_ERRORS = {
    400: {"description": "이 미션의 인증 방식이 아님"},
    404: {"description": "내 미션이 아님"},
    409: {"description": "이미 완료했거나 진행 중이 아님"},
}

router = APIRouter(prefix="/api/me/missions")


def get_my_user_mission(db: Session, profile: Profile, user_mission_id: int) -> UserMission:
    """내 미션 하나 가져오기. 없거나 다른 사람 것이면 404 (인증 API에서도 재사용)."""
    um = db.get(UserMission, user_mission_id)
    if um is None or um.user_id != profile.id or um.deleted_at is not None:
        raise HTTPException(404, detail="미션을 찾을 수 없어요")
    return um


@router.get(
    "",
    summary="I.2 진행 중 / I.3 완료 미션 목록",
    tags=["I. 내 프로필"],
    response_model=list[UserMissionOut],
)
def list_my_missions(
    status: Literal["in_progress", "completed"] = Query(
        description="in_progress: 진행 중(사진 확인 중 포함, 수락 순서) / completed: 완료(최신순)"
    ),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> list[UserMissionOut]:
    """숨긴(삭제된) 미션도 이미 수락했다면 그대로 보인다 (E.5)."""
    stmt = select(UserMission).where(UserMission.user_id == profile.id, UserMission.deleted_at.is_(None))
    if status == "in_progress":
        # 수락만 하고 잊은 미션이 위로 오도록 오래된 것부터 (I.2, B.1.2)
        stmt = stmt.where(UserMission.status.in_(ACTIVE_STATUSES)).order_by(
            UserMission.accepted_at.asc(), UserMission.id.asc()
        )
    else:
        stmt = stmt.where(UserMission.status == "completed").order_by(
            UserMission.completed_at.desc(), UserMission.id.desc()
        )
    rows = db.scalars(stmt.limit(limit).offset(offset)).all()
    return [UserMissionOut.from_user_mission(um) for um in rows]


@router.post(
    "/{user_mission_id}/cancel",
    summary="I.2 진행 중 미션 취소",
    tags=["I. 내 프로필"],
    response_model=UserMissionOut,
    responses={404: {"description": "내 미션이 아님"}, 409: {"description": "진행 중이 아님"}},
)
def cancel_my_mission(
    user_mission_id: int,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> UserMissionOut:
    """취소한 미션은 목록에서 빠지고, 뽑기·수락으로 다시 할 수 있다."""
    um = get_my_user_mission(db, profile, user_mission_id)
    if um.status not in ACTIVE_STATUSES:
        raise HTTPException(409, detail="진행 중인 미션만 취소할 수 있어요")
    um.status = "cancelled"
    db.commit()
    db.refresh(um)
    return UserMissionOut.from_user_mission(um)


@router.patch(
    "/{user_mission_id}/review",
    summary="I.3 후기 작성·수정",
    tags=["I. 내 프로필"],
    response_model=UserMissionOut,
    responses={404: {"description": "내 미션이 아님"}, 409: {"description": "완료한 미션이 아님"}},
)
def write_review(
    user_mission_id: int,
    body: ReviewIn,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> UserMissionOut:
    """완료한 미션에만 쓸 수 있다. 다시 보내면 후기를 고치고 reviewed_at(작성 날짜)도 지금으로 바뀐다."""
    um = get_my_user_mission(db, profile, user_mission_id)
    if um.status != "completed":
        raise HTTPException(409, detail="완료한 미션에만 후기를 쓸 수 있어요")
    um.review = body.review
    um.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(um)
    return UserMissionOut.from_user_mission(um)


@router.delete(
    "/{user_mission_id}",
    summary="I.3 완료 기록 삭제",
    tags=["I. 내 프로필"],
    status_code=204,
    responses={404: {"description": "내 미션이 아니거나 이미 삭제함"}, 409: {"description": "완료한 미션이 아님"}},
)
def delete_my_record(
    user_mission_id: int,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> None:
    """진짜로 지우지 않고 숨긴다 → 완료 목록·지도 깃발·나의 활동 숫자에서 빠진다.
    이미 받은 경험치와 레벨은 그대로. 진행 중 미션은 취소 API를 쓴다."""
    um = get_my_user_mission(db, profile, user_mission_id)
    if um.status != "completed":
        raise HTTPException(409, detail="완료한 미션만 삭제할 수 있어요")
    um.deleted_at = datetime.now(timezone.utc)
    db.commit()


@router.post(
    "/{user_mission_id}/verify/none",
    summary="F.3 인증 없음 미션 완료 (완료 버튼)",
    tags=[VERIFY_TAG],
    response_model=VerifyResultOut,
    responses=VERIFY_ERRORS,
)
def verify_none(
    user_mission_id: int,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> VerifyResultOut:
    """확인할 조건 없이 바로 완료하고 경험치 10을 준다. 레벨이 오르면 leveled_up: true."""
    um = get_my_user_mission(db, profile, user_mission_id)
    check_verifiable(um, "none")
    return complete_mission(db, profile, um)


@router.post(
    "/{user_mission_id}/verify/location",
    summary="F.1 위치 인증 (미션 장소 반경 안이면 성공)",
    tags=[VERIFY_TAG],
    response_model=VerifyResultOut,
    responses=VERIFY_ERRORS,
)
def verify_location(
    user_mission_id: int,
    body: LocationIn,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> VerifyResultOut:
    """반경(기본 300m) 안이면 경험치 30. 밖이면 200 + success: false와 남은 거리를 돌려준다.
    현재 위치는 저장하지 않는다."""
    um = get_my_user_mission(db, profile, user_mission_id)
    check_verifiable(um, "location")
    mission = um.mission
    dist = round(distance_m(body.lat, body.lng, mission.lat, mission.lng))

    if dist > mission.radius_m:
        return VerifyResultOut(
            success=False,
            user_mission_id=um.id,
            status=um.status,
            message=f"{format_distance(dist)} 떨어져 있어요. {mission.place_name or '미션 장소'} 근처에서 다시 시도해주세요",
            distance_m=dist,
        )

    result = complete_mission(db, profile, um)
    result.distance_m = dist
    return result
