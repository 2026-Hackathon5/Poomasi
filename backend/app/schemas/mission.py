import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models import Mission
from app.services.level import mission_xp

VerifyType = Literal["location", "photo", "none"]
MissionSource = Literal["ai", "user"]
# 미션 목록에 보여줄 내 진행 상태. 취소(cancelled)한 미션은 null로 보낸다
MyStatus = Literal["in_progress", "reviewing", "completed"]


class MissionOut(BaseModel):
    """미션 하나 (E.2 뽑기, E.4 목록, H.2 지도 핀에서 같이 씀)"""

    id: int
    title: str = Field(examples=["경복궁에서 한복 사진 찍기"])
    description: str
    country: str = Field(description="나라 코드 KR / JP / CN / US", examples=["KR"])
    category: str = Field(examples=["전통문화"])
    verify_type: VerifyType = Field(description="location: 위치 / photo: 사진 / none: 인증 없음")
    xp: int = Field(description="획득 경험치 (위치 30, 사진 20, 없음 10)", examples=[30])
    source: MissionSource = Field(description="ai: 팀이 만든 시드 / user: 사용자가 만든 미션")
    place_name: str | None = Field(description="위치 미션만 값 있음")
    address: str | None = Field(description="위치 미션만 값 있음")
    lat: float | None = Field(description="위치 미션만 값 있음")
    lng: float | None = Field(description="위치 미션만 값 있음")
    radius_m: int = Field(description="위치 인증 반경(m)", examples=[300])
    creator_id: uuid.UUID | None = Field(description="null이면 팀 시드 미션")
    created_at: datetime
    my_status: MyStatus | None = Field(
        default=None,
        description="내 진행 상태. null이 아니면 수락 버튼 비활성화 (E.4.1)",
    )

    @classmethod
    def from_mission(cls, m: Mission, my_status: str | None = None) -> "MissionOut":
        return cls(
            id=m.id,
            title=m.title,
            description=m.description,
            country=m.country,
            category=m.category,
            verify_type=m.verify_type,
            xp=mission_xp(m.verify_type),
            source=m.source,
            place_name=m.place_name,
            address=m.address,
            lat=m.lat,
            lng=m.lng,
            radius_m=m.radius_m,
            creator_id=m.creator_id,
            created_at=m.created_at,
            my_status=my_status,
        )
