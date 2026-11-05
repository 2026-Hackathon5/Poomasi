"""H.3 시드 미션 — 팀이 만든 미션 20개를 DB에 넣는다 (source=ai, creator_id=null)

backend 폴더에서 실행:
    python -m seed.seed_missions --dry-run   # 카카오로 좌표만 찾아보고 DB에는 안 넣음
    python -m seed.seed_missions             # 실제로 DB에 넣기

- 장소 미션은 주소(또는 geocode_query)로 카카오에서 좌표를 찾는다. 하나라도 못 찾으면 아무것도 넣지 않는다.
- 같은 제목의 시드 미션이 이미 있으면 건너뛰어서, 두 번 실행해도 중복으로 안 들어간다.
- 미션 목록은 최신순이라, 덕성여대 대강의동 미션을 맨 마지막에 넣어 목록 맨 위에 오게 한다.
"""

import sys

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Mission
from app.services.geocode import GeocodeUnavailable, geocode

# 위치 인증 10개 (한국 7 + 일본·중국·미국 1개씩)
LOCATION_MISSIONS = [
    {
        "title": "창덕궁 후원 산책하기",
        "description": "조선 왕들이 쉬던 정원을 천천히 걸어 보세요.",
        "country": "KR",
        "category": "place",
        "place_name": "창덕궁",
        "address": "서울 종로구 율곡로 99",
    },
    {
        "title": "광장시장에서 빈대떡 먹기",
        "description": "100년 넘은 시장에서 갓 부친 빈대떡과 마약김밥을 맛봐요.",
        "country": "KR",
        "category": "food",
        "place_name": "광장시장",
        "address": "서울 종로구 창경궁로 88",
    },
    {
        "title": "북촌 한옥마을 골목 걷기",
        "description": "기와지붕이 이어진 골목을 걸으며 한옥의 처마를 구경해요. 주민이 사는 곳이라 조용히!",
        "country": "KR",
        "category": "place",
        "place_name": "북촌한옥마을",
        "address": "서울 종로구 계동길 37",
    },
    {
        "title": "안산 다문화거리에서 세계 음식 맛보기",
        "description": "여러 나라 사람들이 모여 사는 거리에서 처음 보는 나라의 음식을 하나 골라 먹어 봐요.",
        "country": "KR",
        "category": "food",
        "place_name": "안산 다문화음식거리",
        "address": "경기 안산시 단원구 원곡동",
    },
    {
        "title": "전주 경기전 돌담길 걷기",
        "description": "한옥마을 한가운데 있는 경기전에서 대나무숲과 돌담길을 걸어 봐요.",
        "country": "KR",
        "category": "place",
        "place_name": "경기전",
        "address": "전북 전주시 완산구 태조로 44",
    },
    {
        "title": "수원 화성행궁에서 정조 만나기",
        "description": "정조가 머물던 행궁을 둘러보고 성곽 위를 조금 걸어 봐요.",
        "country": "KR",
        "category": "experience",
        "place_name": "화성행궁",
        "address": "경기 수원시 팔달구 정조로 825",
    },
    {
        "title": "인천 차이나타운에서 짜장면 유래 알아보기",
        "description": "짜장면박물관에서 한국식 짜장면이 어떻게 생겼는지 보고, 근처에서 짜장면 한 그릇!",
        "country": "CN",
        "category": "food",
        "place_name": "짜장면박물관",
        "address": "인천 중구 차이나타운로 56-14",
    },
    {
        "title": "동부이촌동에서 일본 가정식 먹기",
        "description": "일본 사람들이 많이 살아 '리틀 도쿄'라고도 불리는 동부이촌동에서 돈카츠나 일본식 정식을 먹어 봐요.",
        "country": "JP",
        "category": "food",
        "place_name": "동부이촌동",
        "address": "서울 용산구 이촌동",
    },
    {
        "title": "이태원에서 미국식 수제버거 먹기",
        "description": "여러 나라 문화가 섞인 이태원에서 미국식 수제버거를 먹어 보고 한국 버거와 비교해 봐요.",
        "country": "US",
        "category": "food",
        "place_name": "이태원",
        "address": "서울 용산구 이태원동",
    },
]

# 사진 인증 6개 (한국 4 + 일본·미국 1개씩)
PHOTO_MISSIONS = [
    {
        "title": "떡집에서 개떡 사먹기",
        "description": "떡을 전문으로 만드는 방앗간에 가서 개떡(쑥떡)을 사 먹고 사진을 찍어요.",
        "country": "KR",
        "category": "food",
    },
    {
        "title": "편의점 삼각김밥 깔끔하게 뜯기",
        "description": "1, 2, 3 순서대로 뜯어서 김이 찢어지지 않은 삼각김밥을 찍어 보세요.",
        "country": "KR",
        "category": "food",
    },
    {
        "title": "한복 입고 사진 찍기",
        "description": "한복을 빌려 입고 마음에 드는 곳에서 사진을 남겨요.",
        "country": "KR",
        "category": "experience",
    },
    {
        "title": "한강에서 라면 끓여 먹기",
        "description": "한강공원 편의점의 즉석 라면 기계로 라면을 끓여 먹고 사진으로 인증해요.",
        "country": "KR",
        "category": "food",
    },
    {
        "title": "종이학 접기",
        "description": "일본의 종이접기(오리가미)로 종이학을 하나 접어서 사진을 찍어요.",
        "country": "JP",
        "category": "experience",
    },
    {
        "title": "땅콩버터잼 샌드위치 만들기",
        "description": "미국 아이들의 단골 도시락, 땅콩버터와 잼을 바른 샌드위치를 만들어 찍어요.",
        "country": "US",
        "category": "food",
    },
]

# 인증 없음 4개 (한국 3 + 중국 1)
NONE_MISSIONS = [
    {
        "title": "옆 사람에게 한국어로 인사하기",
        "description": '오늘 처음 만난 사람에게 "안녕하세요, 반가워요!"라고 인사해 보세요.',
        "country": "KR",
        "category": "experience",
    },
    {
        "title": '"밥 먹었어?"의 진짜 뜻 알아보기',
        "description": '한국 사람에게 "밥 먹었어?"가 왜 안부 인사인지 물어보고 이야기 나눠 봐요.',
        "country": "KR",
        "category": "experience",
    },
    {
        "title": "윷놀이 규칙 배우기",
        "description": "도·개·걸·윷·모가 각각 몇 칸인지 배우고 한 판 해 봐요.",
        "country": "KR",
        "category": "experience",
    },
    {
        "title": '중국어로 "니하오" 인사하기',
        "description": '중국 친구에게 "你好(니하오)"로 인사하고, 중국어 인사말 하나를 더 배워 봐요.',
        "country": "CN",
        "category": "experience",
    },
]

# 현장 시연용. 미션 목록이 최신순이라 맨 마지막에 넣어야 맨 위에 보인다
DUKSUNG_MISSION = {
    "title": "덕성여대 대강의동에서 품앗이 시작하기",
    "description": '대강의동 앞에 도착해서 위치 인증을 해 보세요. 오늘 만난 친구에게 한국어로 "반가워요!"라고 인사도 건네 봐요.',
    "country": "KR",
    "category": "place",
    "place_name": "덕성여자대학교 대강의동",
    "address": "서울 도봉구 삼양로144길 33",
    # 캠퍼스 공용 주소라 주소로 찾으면 대강의동이 아닐 수 있어서, 건물 이름으로 좌표를 찾는다
    "geocode_query": "덕성여자대학교 대강의동",
}

SEEDS: list[tuple[str, dict]] = (
    [("location", m) for m in LOCATION_MISSIONS]
    + [("photo", m) for m in PHOTO_MISSIONS]
    + [("none", m) for m in NONE_MISSIONS]
    + [("location", DUKSUNG_MISSION)]
)


def main(dry_run: bool) -> int:
    label = {"location": "위치", "photo": "사진", "none": "없음"}
    with SessionLocal() as db:
        # 1) 넣을 미션을 고르고 장소 미션 좌표를 먼저 전부 찾는다
        todo, skipped, failed = [], 0, []
        for verify_type, m in SEEDS:
            exists = db.scalar(
                select(Mission.id).where(
                    Mission.source == "ai",
                    Mission.creator_id.is_(None),
                    Mission.title == m["title"],
                )
            )
            if exists is not None:
                print(f"  건너뜀 (이미 있음, id {exists}): {m['title']}")
                skipped += 1
                continue

            lat = lng = None
            if verify_type == "location":
                query = m.get("geocode_query", m["address"])
                try:
                    coords = geocode(query)
                except GeocodeUnavailable as e:
                    print(f"카카오에 연결하지 못했어요: {e}")
                    return 1
                if coords is None:
                    print(f"  실패 (좌표를 못 찾음): {m['title']} <- '{query}'")
                    failed.append(m["title"])
                    continue
                lat, lng = coords

            where = f" ({lat:.5f}, {lng:.5f})" if lat is not None else ""
            print(f"  확인 [{label[verify_type]}] {m['country']} {m['title']}{where}")
            todo.append((verify_type, m, lat, lng))

        print(f"\n넣을 미션 {len(todo)} / 이미 있음 {skipped} / 좌표 실패 {len(failed)} (전체 {len(SEEDS)})")

        # 하나라도 실패하면 아무것도 넣지 않는다. 나중에 따로 넣으면 덕성여대 미션보다 위에 와서 순서가 꼬이기 때문
        if failed:
            print("좌표를 못 찾은 미션의 주소를 고친 뒤 다시 실행해 주세요. DB에는 아무것도 넣지 않았어요.")
            for t in failed:
                print(f"  - {t}")
            return 1
        if dry_run:
            print("미리보기라 DB에는 넣지 않았어요. --dry-run 없이 실행하면 넣어요.")
            return 0

        # 2) 순서대로 넣는다. 한 개씩 저장해서 created_at·id가 넣은 순서가 되게 한다 → 덕성여대가 목록 맨 위
        for verify_type, m, lat, lng in todo:
            db.add(
                Mission(
                    title=m["title"],
                    description=m["description"],
                    country=m["country"],
                    category=m["category"],
                    verify_type=verify_type,
                    source="ai",
                    place_name=m.get("place_name"),
                    address=m.get("address"),
                    lat=lat,
                    lng=lng,
                    creator_id=None,
                )
            )
            db.commit()
        print(f"완료: {len(todo)}개를 넣었어요.")
    return 0


if __name__ == "__main__":
    sys.exit(main(dry_run="--dry-run" in sys.argv))
