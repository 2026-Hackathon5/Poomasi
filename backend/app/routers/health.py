from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health", summary="서버 상태 확인 (Render 깨우기·모니터링용)")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
