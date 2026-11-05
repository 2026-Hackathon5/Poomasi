"""B.1 메인 화면 응답 모양"""

from pydantic import BaseModel, Field

from app.schemas.level import LevelOut
from app.schemas.user_mission import UserMissionOut


class StatsOut(BaseModel):
    """B.1.3 나의 활동 / I.4 프로필 나의 활동"""

    completed_missions: int = Field(description="완료한 미션 수 (완료 기록을 삭제한 미션은 빼고 셈)", examples=[12])
    in_progress: int = Field(description="진행 중 미션 수 (사진 확인 중 포함)", examples=[3])
    reviews: int = Field(description="후기를 작성한 미션 수", examples=[5])
    posts: int = Field(description="내가 쓴 숨은 뜻 게시글 수", examples=[1])
    comments: int = Field(description="내가 단 댓글 수", examples=[5])


class HomeOut(BaseModel):
    """B.1 메인 화면"""

    nickname: str = Field(description="인사말 'OO 님의 품앗이에요!'", examples=["해커톤"])
    level: LevelOut = Field(description="B.1.1 내 레벨·칭호·경험치 바")
    recommended: UserMissionOut | None = Field(
        description="B.1.2 진행 중·확인 중 미션 중 가장 오래전에 수락한 1개. null이면 '미션 뽑으러 가기' 버튼"
    )
    stats: StatsOut
