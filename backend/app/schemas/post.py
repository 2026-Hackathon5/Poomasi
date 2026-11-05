"""D 숨은 뜻 지식인 — 게시글·댓글 요청/응답 모양"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models import Comment, Post, Profile
from app.schemas.me import UserType

POST_MAX = 1000
COMMENT_MAX = 500


def _check_content(v: str, max_len: int, what: str) -> str:
    """앞뒤 공백을 지우고 1~max_len자인지 확인한다."""
    v = v.strip()
    if not v:
        raise ValueError("내용을 입력해주세요")
    if len(v) > max_len:
        raise ValueError(f"{what}은 {max_len}자 이하로 입력해주세요")
    return v


# ---------- 요청 ----------


class PostCreate(BaseModel):
    """D.2 게시글 등록 / D.3.3 게시글 수정"""

    content: str = Field(description=f"1~{POST_MAX}자", examples=["'눈치'가 무슨 뜻이에요?"])

    @field_validator("content")
    @classmethod
    def check_content(cls, v: str) -> str:
        return _check_content(v, POST_MAX, "게시글")


class CommentCreate(BaseModel):
    """D.3.4 댓글 등록"""

    content: str = Field(description=f"1~{COMMENT_MAX}자", examples=["분위기를 읽는 능력이에요!"])

    @field_validator("content")
    @classmethod
    def check_content(cls, v: str) -> str:
        return _check_content(v, COMMENT_MAX, "댓글")


# ---------- 응답 ----------


class AuthorOut(BaseModel):
    """게시글·댓글 작성자"""

    id: uuid.UUID
    nickname: str = Field(examples=["Minh"])
    nationality: str = Field(description="국적 코드 KR / JP / CN / US / OTHER", examples=["KR"])
    user_type: UserType = Field(description="korean: 한국인 / foreign_resident: 한국에 거주하는 외국인")

    @classmethod
    def from_profile(cls, p: Profile) -> "AuthorOut":
        return cls(id=p.id, nickname=p.nickname, nationality=p.nationality, user_type=p.user_type)


class CommentOut(BaseModel):
    """댓글 하나 (D.3.2 상세의 comments, D.3.4 응답)"""

    id: int
    content: str
    author: AuthorOut
    created_at: datetime

    @classmethod
    def from_comment(cls, c: Comment) -> "CommentOut":
        return cls(
            id=c.id,
            content=c.content,
            author=AuthorOut.from_profile(c.author),
            created_at=c.created_at,
        )


class PostOut(BaseModel):
    """게시글 하나 (D.3.1 목록 항목)"""

    id: int
    content: str
    author: AuthorOut
    comment_count: int = Field(description="댓글 수", examples=[2])
    is_mine: bool = Field(description="true면 수정 버튼 노출 (D.3.3)")
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_post(cls, p: Post, comment_count: int, viewer_id: uuid.UUID) -> "PostOut":
        return cls(
            id=p.id,
            content=p.content,
            author=AuthorOut.from_profile(p.author),
            comment_count=comment_count,
            is_mine=p.author_id == viewer_id,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )


class PostDetailOut(PostOut):
    """게시글 상세 + 댓글 (D.2·D.3.2·D.3.3 응답). 댓글은 오래된 순"""

    comments: list[CommentOut]
