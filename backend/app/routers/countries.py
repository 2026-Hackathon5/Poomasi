from fastapi import APIRouter, Query

from app.schemas.country import COUNTRIES, OTHER, CountryOut

router = APIRouter(prefix="/api/countries", tags=["공통"])


@router.get("", summary="나라 목록 (미션 나라·국적 선택용)", response_model=list[CountryOut])
def list_countries(
    include_other: bool = Query(False, description="true면 맨 뒤에 기타(OTHER) 추가 → 국적 선택용"),
) -> list[CountryOut]:
    """로그인 없이 쓸 수 있다 (가입 화면에서도 필요).
    - 미션 나라 선택(E.1, E.3): 그대로 호출 → KR, JP, CN, US
    - 국적 선택(0.1): include_other=true → KR, JP, CN, US, OTHER
    화면에는 name_ko / name_en, 요청에는 code를 보낸다.
    """
    return [*COUNTRIES, OTHER] if include_other else COUNTRIES
