import re
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.models import Profile
from app.schemas.level import LevelOut

NICKNAME_RE = re.compile(r"^[가-힣a-zA-Z0-9]{1,20}$")

UserType = Literal["korean", "foreign_resident"]


class ProfileCreate(BaseModel):
    """0.1 회원가입 직후 프로필 생성"""

    nickname: str = Field(description="한글·영문·숫자 1~20자", examples=["푸마시"])
    user_type: UserType = Field(description="korean: 한국인 / foreign_resident: 한국 거주 외국인")
    nationality: str = Field(examples=["대한민국"])

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
    def check_nationality(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("사용자 정보를 입력해주세요")
        if len(v) > 50:
            raise ValueError("국적은 50자 이하로 입력해주세요")
        return v


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
