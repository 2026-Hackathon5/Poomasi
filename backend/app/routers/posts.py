"""D 숨은 뜻 지식인 — 게시글·댓글"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import get_current_profile
from app.db import get_db
from app.models import Comment, Post, Profile
from app.schemas.post import CommentCreate, CommentOut, PostCreate, PostDetailOut, PostOut

POST_NOT_FOUND = "삭제되었거나 없는 글이에요"

router = APIRouter(prefix="/api/posts", tags=["D. 숨은 뜻 지식인"])


def get_post_or_404(db: Session, post_id: int) -> Post:
    """게시글 하나 가져오기. 없으면 404 (상세·수정·댓글에서 같이 씀)."""
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(404, detail=POST_NOT_FOUND)
    return post


def comment_counts(db: Session, post_ids: list[int]) -> dict[int, int]:
    """게시글 id → 댓글 수. 댓글이 없는 글은 결과에 없으니 .get(id, 0)으로 읽는다."""
    if not post_ids:
        return {}
    rows = db.execute(
        select(Comment.post_id, func.count())
        .where(Comment.post_id.in_(post_ids))
        .group_by(Comment.post_id)
    ).all()
    return {post_id: count for post_id, count in rows}


def to_detail(db: Session, post: Post, viewer_id: uuid.UUID) -> PostDetailOut:
    """게시글 + 댓글(오래된 순)을 상세 응답 모양으로 만든다."""
    comments = db.scalars(
        select(Comment)
        .where(Comment.post_id == post.id)
        .order_by(Comment.created_at.asc(), Comment.id.asc())
    ).all()
    base = PostOut.from_post(post, comment_count=len(comments), viewer_id=viewer_id)
    return PostDetailOut(**base.model_dump(), comments=[CommentOut.from_comment(c) for c in comments])


@router.get(
    "",
    summary="D.3.1 게시글 목록",
    response_model=list[PostOut],
)
def list_posts(
    limit: int = Query(20, ge=1, le=100, description="한 번에 가져올 개수"),
    offset: int = Query(0, ge=0, description="건너뛸 개수 (다음 페이지)"),
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> list[PostOut]:
    """최신순. 각 글에 작성자(닉네임·국적·유형), 댓글 수, 내 글 여부(is_mine)를 붙여 준다."""
    posts = db.scalars(
        select(Post).order_by(Post.created_at.desc(), Post.id.desc()).limit(limit).offset(offset)
    ).all()
    counts = comment_counts(db, [p.id for p in posts])
    return [PostOut.from_post(p, counts.get(p.id, 0), profile.id) for p in posts]


@router.post(
    "",
    summary="D.2 게시글 등록",
    response_model=PostDetailOut,
    status_code=status.HTTP_201_CREATED,
)
def create_post(
    body: PostCreate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> PostDetailOut:
    """등록한 글을 상세 모양으로 돌려준다 → 프론트는 상세 화면으로 이동."""
    post = Post(author_id=profile.id, title=body.title, content=body.content)
    db.add(post)
    db.commit()
    db.refresh(post)
    return to_detail(db, post, profile.id)


@router.get(
    "/{post_id}",
    summary="D.3.2 게시글 상세 + 댓글",
    response_model=PostDetailOut,
    responses={404: {"description": "없는 글 → 목록으로 이동"}},
)
def get_post(
    post_id: int,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> PostDetailOut:
    """댓글은 오래된 순. is_mine이 true면 수정 버튼을 보여준다."""
    post = get_post_or_404(db, post_id)
    return to_detail(db, post, profile.id)


@router.patch(
    "/{post_id}",
    summary="D.3.3 게시글 수정 (작성자만)",
    response_model=PostDetailOut,
    responses={
        403: {"description": "내가 쓴 글이 아님"},
        404: {"description": "없는 글"},
    },
)
def update_post(
    post_id: int,
    body: PostCreate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> PostDetailOut:
    """제목과 본문을 바꾼다. updated_at은 DB가 자동으로 지금 시간으로 바꾼다."""
    post = get_post_or_404(db, post_id)
    if post.author_id != profile.id:
        raise HTTPException(403, detail="내가 쓴 글만 수정할 수 있어요")
    post.title = body.title
    post.content = body.content
    db.commit()
    db.refresh(post)
    return to_detail(db, post, profile.id)


@router.post(
    "/{post_id}/comments",
    summary="D.3.4 댓글 등록",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
    responses={404: {"description": "없는 글"}},
)
def create_comment(
    post_id: int,
    body: CommentCreate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> CommentOut:
    """등록한 댓글 1개를 돌려준다 → 프론트는 댓글 목록 맨 아래에 붙인다."""
    get_post_or_404(db, post_id)
    comment = Comment(post_id=post_id, author_id=profile.id, content=body.content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return CommentOut.from_comment(comment)
