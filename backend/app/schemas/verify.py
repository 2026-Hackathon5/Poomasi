from typing import Literal

from pydantic import BaseModel, Field


class VerifyResultOut(BaseModel):
    """F.1 · F.2 · F.3 인증 결과 (공통)

    실패해도 HTTP 200 + success: false 로 보낸다. 이때 경험치 관련 값은 null.
    """

    success: bool = Field(description="인증 성공 여부")
    user_mission_id: int
    status: Literal["in_progress", "reviewing", "completed"] = Field(description="인증 후 내 미션 상태")
    message: str = Field(description="화면에 그대로 보여줄 안내 문구", examples=["미션 완료! 30 경험치를 얻었어요"])
    distance_m: int | None = Field(default=None, description="위치 인증일 때 미션 장소까지 거리(m)")
    xp_gained: int | None = Field(default=None, description="이번에 얻은 경험치")
    total_xp: int | None = Field(default=None, description="누적 경험치")
    level: int | None = None
    title: str | None = Field(default=None, description="칭호")
    leveled_up: bool | None = Field(default=None, description="true면 레벨업 축하 팝업(G.2)")
    next_level_xp: int | None = Field(default=None, description="다음 레벨 시작 xp, 최고 레벨이면 null")
