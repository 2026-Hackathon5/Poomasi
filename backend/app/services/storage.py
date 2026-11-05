"""F.2 인증 사진 저장 (Supabase Storage, httpx로 REST 호출)

- 버킷 mission-photos: 공개(public), 8MB, image/*만 허용 (대시보드에서 만들어 둠)
- 경로: {user_id}/{user_mission_id}.{확장자} — 다시 올리면 덮어쓴다
- 비밀 키(sb_secret_...)는 apikey 헤더로만 보낸다. JWT가 아니라서 Authorization에 넣지 않는다
"""

import time
import uuid

import httpx

from app.config import settings

BUCKET = "mission-photos"
TIMEOUT_SEC = 20.0

# content-type → 확장자 (목록에 없으면 jpg)
EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/heic": "heic",
    "image/heif": "heif",
}


class StorageUnavailable(Exception):
    """Storage 키가 없거나, Supabase에 올리지 못함"""


def _auth_headers() -> dict[str, str]:
    key = settings.supabase_service_role_key
    headers = {"apikey": key}
    if key.startswith("eyJ"):
        # Legacy service_role 키(JWT)는 Authorization에도 넣어야 한다
        headers["Authorization"] = f"Bearer {key}"
    return headers


def upload_photo(user_id: uuid.UUID, user_mission_id: int, data: bytes, content_type: str) -> str:
    """사진을 올리고 공개 주소를 돌려준다."""
    if not (settings.supabase_url and settings.supabase_service_role_key):
        raise StorageUnavailable("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없어요")

    path = f"{user_id}/{user_mission_id}.{EXTENSIONS.get(content_type, 'jpg')}"
    try:
        res = httpx.post(
            f"{settings.supabase_url}/storage/v1/object/{BUCKET}/{path}",
            content=data,
            headers={**_auth_headers(), "Content-Type": content_type, "x-upsert": "true"},
            timeout=TIMEOUT_SEC,
        )
        res.raise_for_status()
    except httpx.HTTPError as e:
        raise StorageUnavailable(str(e)) from e

    # 같은 경로에 덮어쓰면 브라우저가 옛날 사진을 보여줄 수 있어서 ?v=시각을 붙인다
    return f"{settings.supabase_url}/storage/v1/object/public/{BUCKET}/{path}?v={int(time.time())}"
