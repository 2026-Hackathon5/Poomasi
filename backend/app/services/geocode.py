"""H.3 · E.3 주소 → 좌표 변환 (카카오 로컬 API)

미션 만들기(E.3)와 시드 스크립트(H.3)에서 같이 쓴다.
- 주소 검색으로 먼저 찾고, 없으면 키워드 검색(가게 이름·건물 이름 등)으로 한 번 더 찾는다.
- 못 찾으면 None, 카카오에 연결하지 못하면 GeocodeUnavailable 예외.
"""

import httpx

from app.config import settings

ADDRESS_URL = "https://dapi.kakao.com/v2/local/search/address.json"
KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"
TIMEOUT_SEC = 5.0


class GeocodeUnavailable(Exception):
    """카카오 API 키가 없거나, 카카오 서버에 연결하지 못함 (주소가 틀린 것과는 다름)"""


def _first_coords(url: str, query: str) -> tuple[float, float] | None:
    """카카오 검색 결과 첫 번째의 (위도, 경도). 결과가 없으면 None."""
    try:
        res = httpx.get(
            url,
            params={"query": query, "size": 1},
            headers={"Authorization": f"KakaoAK {settings.kakao_rest_api_key}"},
            timeout=TIMEOUT_SEC,
        )
        res.raise_for_status()
    except httpx.HTTPError as e:
        raise GeocodeUnavailable(str(e)) from e

    docs = res.json().get("documents", [])
    if not docs:
        return None
    # 카카오는 x = 경도(lng), y = 위도(lat)를 문자열로 준다
    return float(docs[0]["y"]), float(docs[0]["x"])


def geocode(address: str) -> tuple[float, float] | None:
    """주소 → (lat, lng). 찾지 못하면 None."""
    if not settings.kakao_rest_api_key:
        raise GeocodeUnavailable("KAKAO_REST_API_KEY가 없어요")
    query = address.strip()
    if not query:
        return None
    return _first_coords(ADDRESS_URL, query) or _first_coords(KEYWORD_URL, query)
