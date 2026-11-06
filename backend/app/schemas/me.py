import re
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models import Profile
from app.schemas.country import NATIONALITY_CODES
from app.schemas.level import LevelOut

NICKNAME_RE = re.compile(r"^[가-힣a-zA-Z0-9]{1,20}$")

UserType = Literal["korean", "foreign_resident"]


class ProfileCreate(BaseModel):
    """0.1 회원가입 직후 프로필 생성"""

    nickname: str = Field(description="한글·영문·숫자 1~20자", examples=["푸마시"])
    user_type: UserType = Field(description="korean: 한국인 / foreign_resident: 한국 거주 외국인")
    nationality: str | None = Field(
        default=None,
        description=(
            "국적 코드: KR / JP / CN / US / OTHER(기타) (GET /api/countries?include_other=true). "
            "user_type이 korean이면 보내지 않아도 되고, 보내도 무조건 KR로 저장한다"
        ),
        examples=["JP"],
    )

    @field_validator("nickname")
    @classmethod
    def check_nickname(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("사용자 정보를 입력해주세요")
        if not NICKNAME_RE.fullmatch(v):
            raise ValueError("닉네임은 한글·영문·숫자 20자 이하로 입력해주세요")
        return v

    @field_validator("nationality")
    @classmethod
    def check_nationality(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip().upper()
        if not v:
            return None  # 빈 값은 안 보낸 것으로 본다 → 아래 check_korean에서 판단
        if v not in NATIONALITY_CODES:
            raise ValueError("국적을 목록에서 선택해주세요")
        return v

    @model_validator(mode="after")
    def check_korean(self) -> "ProfileCreate":
        """한국인은 국적 선택 없이 무조건 대한민국(KR). 한국 거주 외국인은 국적이 꼭 있어야 한다."""
        if self.user_type == "korean":
            self.nationality = "KR"
        elif self.nationality is None:
            raise ValueError("국적을 선택해주세요")
        return self


class MeOut(BaseModel):
    """I.1 내 정보"""

    id: uuid.UUID
    email: str | None
    nickname: str
    user_type: UserType
    nationality: str
    xp: int
    level: LevelOut
    created_at: datetime

    @classmethod
    def from_profile(cls, p: Profile) -> "MeOut":
        return cls(
            id=p.id,
            email=p.email,
            nickname=p.nickname,
            user_type=p.user_type,
            nationality=p.nationality,
            xp=p.xp,
            level=LevelOut.from_xp(p.xp),
            created_at=p.created_at,
        )
