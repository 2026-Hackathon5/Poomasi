"""Supabase Auth 토큰 검증.

- Legacy JWT secret(HS256) 프로젝트: SUPABASE_JWT_SECRET으로 검증
- 새 JWT Signing Keys(ES256/RS256) 프로젝트: SUPABASE_URL의 JWKS로 검증
토큰 헤더의 alg를 보고 알아서 고른다.
"""

import uuid
from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient, PyJWKClientError
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models import Profile

ALLOWED_ALGS = {"HS256", "ES256", "RS256"}

# Swagger 오른쪽 위 Authorize 버튼이 이걸로 생긴다
bearer = HTTPBearer(auto_error=False, description="Supabase 로그인 후 받은 access token")

_jwks_client = (
    PyJWKClient(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json", cache_keys=True)
    if settings.supabase_url
    else None
)


@dataclass(frozen=True)
class CurrentUser:
    id: uuid.UUID
    email: str | None


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _decode(token: str) -> dict:
    try:
        alg = jwt.get_unverified_header(token).get("alg")
    except jwt.PyJWTError:
        raise _unauthorized("로그인 정보가 올바르지 않아요. 다시 로그인해주세요")
    if alg not in ALLOWED_ALGS:
        raise _unauthorized("로그인 정보가 올바르지 않아요. 다시 로그인해주세요")

    try:
        if alg == "HS256":
            if not settings.supabase_jwt_secret:
                raise HTTPException(500, detail="서버 설정 오류: SUPABASE_JWT_SECRET이 없어요")
            key = settings.supabase_jwt_secret
        else:
            if _jwks_client is None:
                raise HTTPException(500, detail="서버 설정 오류: SUPABASE_URL이 없어요")
            key = _jwks_client.get_signing_key_from_jwt(token).key
        return jwt.decode(token, key, algorithms=[alg], audience="authenticated")
    except PyJWKClientError:
        raise HTTPException(503, detail="로그인 확인 서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요")
    except jwt.ExpiredSignatureError:
        raise _unauthorized("로그인이 만료되었어요. 다시 로그인해주세요")
    except jwt.PyJWTError:
        raise _unauthorized("로그인 정보가 올바르지 않아요. 다시 로그인해주세요")


def get_current_user(
    cred: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> CurrentUser:
    """토큰만 확인한다. 프로필이 아직 없어도 된다 (POST /api/me 전용)."""
    if cred is None:
        raise _unauthorized("로그인이 필요해요")
    claims = _decode(cred.credentials)
    try:
        user_id = uuid.UUID(claims["sub"])
    except (KeyError, ValueError):
        raise _unauthorized("로그인 정보가 올바르지 않아요. 다시 로그인해주세요")
    return CurrentUser(id=user_id, email=claims.get("email"))


def get_current_profile(
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Profile:
    """토큰 확인 + 프로필까지 있어야 하는 API에서 쓴다."""
    profile = db.get(Profile, user.id)
    if profile is None:
        raise HTTPException(404, detail="프로필을 먼저 만들어주세요")
    return profile
