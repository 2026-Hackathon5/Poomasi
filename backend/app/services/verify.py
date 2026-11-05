"""F.4 인증 성공 처리 — 위치(F.1) · 사진(F.2) · 없음(F.3) 인증이 모두 이 함수를 거친다.

하는 일 (한 트랜잭션):
1. 내 미션 상태를 completed로, completed_at · xp_awarded 채우기
2. 프로필 경험치 더하기
3. 레벨업 여부 계산해서 응답 만들기

경험치 중복 지급 방지:
버튼을 빠르게 두 번 누르면 요청 2개가 동시에 "아직 완료 안 됨"을 보고 둘 다 지급할 수 있다.
그래서 "진행 중일 때만 완료로 바꿔라"를 DB에 한 번에 요청(조건부 UPDATE)한다.
DB는 같은 줄을 한 번에 한 요청만 바꾸게 해 주므로, 두 번째 요청은 바뀐 줄이 0개 → 409가 된다.
"""

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.models import ACTIVE_STATUSES, Profile, UserMission
from app.schemas.verify import VerifyResultOut
from app.services.level import level_info, mission_xp

ALREADY_COMPLETED = "이미 완료한 미션이에요"


def check_verifiable(um: UserMission, verify_type: str, allowed_statuses: tuple[str, ...] = ("in_progress",)) -> None:
    """인증 API 공통 검사. 통과 못 하면 HTTPException."""
    if um.status == "completed":
        raise HTTPException(409, detail=ALREADY_COMPLETED)
    if um.status not in allowed_statuses:
        raise HTTPException(409, detail="진행 중인 미션만 인증할 수 있어요")
    if um.mission.verify_type != verify_type:
        raise HTTPException(400, detail="이 미션의 인증 방식이 아니에요")


def complete_mission(
    db: Session,
    profile: Profile,
    um: UserMission,
    photo_url: str | None = None,
) -> VerifyResultOut:
    xp = mission_xp(um.mission.verify_type)
    now = datetime.now(timezone.utc)

    values: dict = {"status": "completed", "completed_at": now, "xp_awarded": xp}
    if photo_url is not None:
        values["photo_url"] = photo_url

    # 1) 진행 중(또는 사진 확인 중)일 때만 완료로 바꾼다 → 동시에 두 번 와도 한 번만 성공
    changed = db.execute(
        update(UserMission)
        .where(UserMission.id == um.id, UserMission.status.in_(ACTIVE_STATUSES))
        .values(**values)
        .returning(UserMission.id)
    ).first()
    if changed is None:
        db.rollback()
        raise HTTPException(409, detail=ALREADY_COMPLETED)

    # 2) 경험치 더하기: 읽고-더하고-쓰기 대신 DB에서 xp = xp + 10 으로 한 번에 (동시 요청에도 안전)
    total_xp = db.execute(
        update(Profile).where(Profile.id == profile.id).values(xp=Profile.xp + xp).returning(Profile.xp)
    ).scalar_one()
    db.commit()

    # 3) 레벨업 계산 (지급 전 xp = 지급 후 - 이번 xp)
    before = level_info(total_xp - xp)
    after = level_info(total_xp)
    leveled_up = after.level > before.level
    message = f"미션 완료! {xp} 경험치를 얻었어요"
    if leveled_up:
        message += f" 🎉 Lv.{after.level} {after.title}(으)로 올랐어요"

    db.refresh(um)
    db.refresh(profile)
    return VerifyResultOut(
        success=True,
        user_mission_id=um.id,
        status="completed",
        message=message,
        xp_gained=xp,
        total_xp=total_xp,
        level=after.level,
        title=after.title,
        leveled_up=leveled_up,
        next_level_xp=after.next_level_xp,
    )
