from dataclasses import asdict

from pydantic import BaseModel, Field

from app.services.level import level_info


class LevelOut(BaseModel):
    """G.1 레벨 정보 (B.1.1 경험치 바, I.1 내 정보)"""

    level: int = Field(examples=[2])
    title: str = Field(examples=["동네 산책러"])
    total_xp: int = Field(examples=[80])
    current_level_xp: int = Field(description="지금 레벨의 시작 xp (경험치 바 왼쪽 끝)", examples=[50])
    next_level_xp: int | None = Field(description="다음 레벨 시작 xp, 최고 레벨이면 null", examples=[150])
    xp_to_next: int = Field(description="다음 레벨까지 남은 xp, 최고 레벨이면 0", examples=[70])

    @classmethod
    def from_xp(cls, xp: int) -> "LevelOut":
        return cls(**asdict(level_info(xp)))
