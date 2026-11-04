"""서비스에서 쓰는 나라 목록. 미션 나라(missions.country)와 프로필 국적(profiles.nationality)에 같이 쓴다.

DB에는 2글자 코드(KR 등)만 저장하고, 화면에 보일 이름은 프론트가 이 목록을 보고 언어에 맞게 바꾼다.
나라를 추가하려면 COUNTRIES와 CountryCode 두 곳에 같이 추가한다.
"""

from typing import Literal

from pydantic import BaseModel

CountryCode = Literal["KR", "JP", "CN", "US"]


class CountryOut(BaseModel):
    code: str
    name_ko: str
    name_en: str


COUNTRIES: list[CountryOut] = [
    CountryOut(code="KR", name_ko="대한민국", name_en="Korea"),
    CountryOut(code="JP", name_ko="일본", name_en="Japan"),
    CountryOut(code="CN", name_ko="중국", name_en="China"),
    CountryOut(code="US", name_ko="미국", name_en="USA"),
]

COUNTRY_CODES: frozenset[str] = frozenset(c.code for c in COUNTRIES)

# 국적은 4개 나라 + 기타. 미션 나라는 4개만 (기타 없음)
OTHER = CountryOut(code="OTHER", name_ko="기타", name_en="Other")
NATIONALITY_CODES: frozenset[str] = COUNTRY_CODES | {OTHER.code}
