"""F.2 사진 판정 (Google Gemini, Interactions API를 httpx로 호출)

judge()는 "사진에 미션 내용이 보이는가"만 본다.
- 사람 얼굴이 있는지, 지금 찍은 사진인지는 판단하지 않는다 (한복 사진처럼 사람이 나와야 하는 미션도 있음)
- 모델이 바쁘면(503·429 등) FALLBACK_MODELS 순서로 다른 모델에 다시 요청한다
- 키가 없거나 모든 모델이 실패하면 AIUnavailable → 라우터가 "잠시 후 다시 시도" 안내
"""

import base64
import json

import httpx

from app.config import settings

URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
API_REVISION = "2026-05-20"
TIMEOUT_SEC = 15.0
# AI_MODEL이 바쁠 때 차례로 시도할 모델 (모두 이미지 입력 가능)
FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash"]
RETRY_STATUS = {429, 500, 502, 503, 504}

PROMPT = """너는 미션 인증 사진을 확인하는 심사위원이다.
아래 미션을 하면서 찍은 사진인지 판단해라.

미션 제목: {title}
미션 설명: {description}

판단 기준:
- 사진에 미션의 핵심 대상(장소, 음식, 물건, 활동 등)이 보이면 match = true
- 미션과 관련 없는 사진, 대상이 거의 안 보이는 사진(까만 화면, 흐릿한 화면, 바닥·벽만 찍은 사진)이면 match = false
- 사람 얼굴이 나오는지는 판단 기준이 아니다
- 너무 엄격하게 보지 말고, 미션 대상이 알아볼 수 있게 보이면 통과시켜라

reason에는 판단 이유를 한국어 한 문장으로 적어라."""

SCHEMA = {
    "type": "object",
    "properties": {
        "match": {"type": "boolean"},
        "reason": {"type": "string"},
    },
    "required": ["match", "reason"],
}


class AIUnavailable(Exception):
    """AI 키가 없거나, Gemini를 부르지 못했거나, 응답을 해석하지 못함"""


def _find_result(node) -> dict | None:
    """응답 JSON 어딘가에 들어 있는 {"match": ..., "reason": ...}를 찾는다."""
    if isinstance(node, dict):
        if isinstance(node.get("match"), bool):
            return node
        for value in node.values():
            found = _find_result(value)
            if found:
                return found
    elif isinstance(node, list):
        for value in node:
            found = _find_result(value)
            if found:
                return found
    elif isinstance(node, str) and '"match"' in node:
        try:
            return _find_result(json.loads(node))
        except ValueError:
            return None
    return None


def judge(image: bytes, content_type: str, mission_title: str, mission_description: str) -> tuple[bool, str]:
    """(통과 여부, 이유)를 돌려준다."""
    if not settings.ai_api_key:
        raise AIUnavailable("AI_API_KEY가 없어요")

    body = {
        "input": [
            {"type": "text", "text": PROMPT.format(title=mission_title, description=mission_description)},
            {"type": "image", "data": base64.b64encode(image).decode(), "mime_type": content_type},
        ],
        "response_format": {"type": "text", "mime_type": "application/json", "schema": SCHEMA},
        "generation_config": {"thinking_level": "minimal"},
    }
    models = [settings.ai_model] + [m for m in FALLBACK_MODELS if m != settings.ai_model]
    errors = []
    data = None
    for model in models:
        try:
            res = httpx.post(
                URL,
                json={**body, "model": model},
                headers={"x-goog-api-key": settings.ai_api_key, "Api-Revision": API_REVISION},
                timeout=TIMEOUT_SEC,
            )
        except httpx.HTTPError as e:
            errors.append(f"{model}: {e}")
            continue
        if res.status_code in RETRY_STATUS:
            errors.append(f"{model}: {res.status_code}")
            continue
        if res.status_code != 200:
            # 키가 틀렸거나 요청 형식 오류 → 다른 모델로 바꿔도 같으니 바로 실패
            raise AIUnavailable(f"{model}: {res.status_code} {res.text[:300]}")
        try:
            data = res.json()
        except ValueError as e:
            raise AIUnavailable(f"{model}: 응답이 JSON이 아니에요") from e
        break
    if data is None:
        raise AIUnavailable("모든 모델이 응답하지 않았어요: " + " / ".join(errors))

    result = _find_result(data)
    if result is None:
        raise AIUnavailable(f"응답에서 판정 결과를 찾지 못했어요: {str(data)[:300]}")
    return result["match"], str(result.get("reason", ""))
