from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import health, me, missions

# Swagger에서 명세서 구분 순서대로 보이게 한다
TAGS = [
    {"name": "B. 메인"},
    {"name": "D. 숨은 뜻 지식인"},
    {"name": "E. 랜덤미션"},
    {"name": "F. 미션 인증"},
    {"name": "H. 미션 지도"},
    {"name": "I. 내 프로필"},
    {"name": "health"},
]

app = FastAPI(
    title="POOMASI API",
    description=(
        "문화를 미션으로 주고받는 서비스 백엔드.\n\n"
        "로그인이 필요한 API는 오른쪽 위 **Authorize**에 Supabase access token을 넣고 테스트하세요.\n"
        "오류 응답은 `{\"detail\": \"한국어 안내 문구\"}` 형식이에요."
    ),
    version="0.1.0",
    openapi_tags=TAGS,
    swagger_ui_parameters={"persistAuthorization": True},  # 새로고침해도 토큰 유지
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """입력 검증 오류도 detail을 한국어 문자열 하나로 보낸다 (프론트가 그대로 표시)."""
    first = exc.errors()[0] if exc.errors() else {}
    msg = str(first.get("msg", ""))
    if first.get("type") == "value_error":
        # validator에서 ValueError("한국어 문구")로 던진 경우
        detail = msg.removeprefix("Value error, ")
    else:
        field = ".".join(str(p) for p in first.get("loc", []) if p not in ("body", "query", "path"))
        detail = f"입력값을 확인해주세요 ({field})" if field else "입력값을 확인해주세요"
    return JSONResponse(status_code=422, content={"detail": detail})


app.include_router(health.router)
app.include_router(me.router)
app.include_router(missions.router)
