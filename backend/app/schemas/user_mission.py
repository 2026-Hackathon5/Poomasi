from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.models import UserMission
from app.schemas.mission import MissionOut

UserMissionStatus = Literal["in_progress", "reviewing", "completed", "cancelled"]
REVIEW_MAX = 300


class ReviewIn(BaseModel):
    """I.3 후기 작성·수정"""

    review: str = Field(description=f"1~{REVIEW_MAX}자", examples=["떡이 너무 맛있고 색이 예뻤다."])

    @field_validator("review")
    @classmethod
    def check_review(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("후기를 입력해주세요")
        if len(v) > REVIEW_MAX:
            raise ValueError(f"후기는 {REVIEW_MAX}자 이하로 입력해주세요")
        return v


class UserMissionOut(BaseModel):
    """내 미션 하나 (수락, I.2 진행 중, I.3 완료, B.1 추천 미션에서 같이 씀)

     /api/me/missions/{id}의 id는 이 id(내 미션 id)이고, 미션 id(mission.id)가 아니다.
    """

    id: int = Field(description="내 미션 id (인증·취소·후기 API 주소에 사용)")
    status: UserMissionStatus = Field(
        description="in_progress: 진행 중 / reviewing: 사진 확인 중 / completed: 완료 / cancelled: 취소"
    )
    accepted_at: datetime = Field(description="수락한 시각")
    completed_at: datetime | None = Field(description="완료한 시각, 완료 전이면 null")
    xp_awarded: int | None = Field(description="받은 경험치, 완료 전이면 null")
    photo_url: str | None = Field(description="사진 인증 썸네일 주소")
    review: str | None = Field(description="후기 (I.3), 없으면 null → 후기 작성 버튼")
    reviewed_at: datetime | None = Field(description="후기 작성 날짜 (고치면 고친 시각), 후기가 없으면 null")
    mission: MissionOut

    @classmethod
    def from_user_mission(cls, um: UserMission) -> "UserMissionOut":
        # 미션 카드 안의 my_status도 이 기록의 상태로 맞춘다 (취소면 null)
        my_status = None if um.status == "cancelled" else um.status
        return cls(
            id=um.id,
            status=um.status,
            accepted_at=um.accepted_at,
            completed_at=um.completed_at,
            xp_awarded=um.xp_awarded,
            photo_url=um.photo_url,
            review=um.review,
            reviewed_at=um.reviewed_at,
            mission=MissionOut.from_mission(um.mission, my_status),
        )
