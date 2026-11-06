"""E.3 미션 만들기 · E.5 내가 만든 미션 삭제 — 요청/응답 모양

미션 응답 자체는 schemas/mission.py의 MissionOut을 그대로 쓴다.
"""

from typing import Literal

from pydantic import BaseModel, Field, ValidationInfo, field_validator, model_validator

from app.schemas.country import CountryCode
from app.schemas.mission import VerifyType

# 미션 분야. DB와 API에는 코드만 쓰고, 화면 이름(체험·음식·장소 / 영어)은 프론트가 바꾼다 (나라 코드와 같은 방식)
CategoryCode = Literal["experience", "food", "place"]

# (최대 글자 수, 안내 문구 앞부분) — 길이는 DB 칸 크기에 맞춤
LIMITS = {
    "title": (100, "제목은"),
    "description": (1000, "설명은"),
    "place_name": (100, "장소 이름은"),
    "address": (255, "주소는"),
}


class MissionCreate(BaseModel):
    """E.3 미션 만들기"""

    title: str = Field(description="1~100자", examples=["쌀국수 가게에서 고수 도전"])
    description: str = Field(description="1~1000자", examples=["베트남 음식점에서 고수를 넣은 쌀국수를 먹어요"])
    country: CountryCode = Field(description="나라 코드 KR / JP / CN / US", examples=["KR"])
    category: CategoryCode = Field(description="분야 코드 experience: 체험 / food: 음식 / place: 장소", examples=["place"])
    verify_type: VerifyType = Field(description="location: 위치 / photo: 사진 / none: 인증 없음")
    place_name: str | None = Field(default=None, description="location이면 필수", examples=["OO 쌀국수"])
    address: str | None = Field(
        default=None,
        description="location이면 필수. 서버가 카카오로 좌표를 찾는다",
        examples=["경기 안산시 단원구 다문화길 1"],
    )

    @field_validator("title", "description", "place_name", "address")
    @classmethod
    def check_length(cls, v: str | None, info: ValidationInfo) -> str | None:
        if v is None:
            return None
        v = v.strip()
        max_len, label = LIMITS[info.field_name]
        if len(v) > max_len:
            raise ValueError(f"{label} {max_len}자 이하로 입력해주세요")
        return v or None  # 공백만 입력하면 빈 값으로 본다

    @model_validator(mode="after")
    def check_required(self) -> "MissionCreate":
        if not (self.title and self.description):
            raise ValueError("제목과 설명을 모두 입력해주세요")
        if self.verify_type == "location":
            if not (self.place_name and self.address):
                raise ValueError("위치 미션은 장소 이름과 주소를 입력해주세요")
        else:
            # 위치 미션이 아니면 장소 정보는 저장하지 않는다
            self.place_name = None
            self.address = None
        return self


class MissionDeletedOut(BaseModel):
    """E.5 삭제 결과 → 삭제 완료 팝업에 제목 표시"""

    id: int
    title: str
