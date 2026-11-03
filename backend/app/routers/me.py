from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import CurrentUser, get_current_profile, get_current_user
from app.db import get_db
from app.models import Profile
from app.schemas.me import MeOut, ProfileCreate

router = APIRouter(prefix="/api/me", tags=["I. 내 프로필"])

NICKNAME_TAKEN = "이미 사용 중인 닉네임이에요"


@router.post(
    "",
    summary="0.1 프로필 생성 (회원가입 직후)",
    response_model=MeOut,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"description": "이미 프로필이 있거나 닉네임이 중복됨"}},
)
def create_profile(
    body: ProfileCreate,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeOut:
    """Supabase Auth로 가입한 뒤 한 번 호출한다. 이메일은 로그인 토큰에서 가져온다."""
    if db.get(Profile, user.id) is not None:
        raise HTTPException(409, detail="이미 프로필이 있어요")
    if db.scalar(select(Profile.id).where(Profile.nickname == body.nickname)) is not None:
        raise HTTPException(409, detail=NICKNAME_TAKEN)

    profile = Profile(
        id=user.id,
        email=user.email,
        nickname=body.nickname,
        user_type=body.user_type,
        nationality=body.nationality,
    )
    db.add(profile)
    try:
        db.commit()
    except IntegrityError:
        # 동시에 같은 닉네임으로 가입한 경우
        db.rollback()
        raise HTTPException(409, detail=NICKNAME_TAKEN)
    db.refresh(profile)
    return MeOut.from_profile(profile)


@router.get(
    "",
    summary="I.1 내 정보 (레벨·칭호·경험치 포함)",
    response_model=MeOut,
    responses={404: {"description": "프로필을 아직 만들지 않음 → POST /api/me"}},
)
def get_me(profile: Profile = Depends(get_current_profile)) -> MeOut:
    return MeOut.from_profile(profile)
