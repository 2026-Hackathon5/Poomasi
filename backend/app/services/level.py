"""G.1 경험치 → 레벨·칭호 계산. 레벨은 DB에 저장하지 않고 누적 xp로 계산한다."""

from dataclasses import dataclass

# F.4 인증 방식별 획득 경험치
MISSION_XP: dict[str, int] = {"location": 30, "photo": 20, "none": 10}

# (레벨, 칭호, 필요한 누적 xp) — 오름차순
LEVELS: list[tuple[int, str, int]] = [
    (1, "새내기 여행자", 0),
    (2, "동네 산책러", 50),
    (3, "시장 탐험가", 150),
    (4, "문화 교환가", 300),
    (5, "세계를 잇는 다리", 500),
]


@dataclass(frozen=True)
class LevelInfo:
    level: int
    title: str
    total_xp: int
    current_level_xp: int  # 지금 레벨의 시작 xp (경험치 바 왼쪽 끝)
    next_level_xp: int | None  # 다음 레벨 시작 xp, 최고 레벨이면 None
    xp_to_next: int  # 다음 레벨까지 남은 xp, 최고 레벨이면 0


def mission_xp(verify_type: str) -> int:
    return MISSION_XP[verify_type]


def level_info(total_xp: int) -> LevelInfo:
    idx = 0
    for i, (_, _, need) in enumerate(LEVELS):
        if total_xp >= need:
            idx = i
    level, title, current = LEVELS[idx]
    next_xp = LEVELS[idx + 1][2] if idx + 1 < len(LEVELS) else None
    return LevelInfo(
        level=level,
        title=title,
        total_xp=total_xp,
        current_level_xp=current,
        next_level_xp=next_xp,
        xp_to_next=(next_xp - total_xp) if next_xp is not None else 0,
    )
