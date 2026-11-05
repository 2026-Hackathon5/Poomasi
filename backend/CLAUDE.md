# POOMASI 백엔드

한국에 사는 여러 나라 사람들이 서로의 문화를 미션으로 주고받는 서비스(PWA)의 백엔드.
학교 해커톤 프로젝트 — 주제 "포용 사회: 다름을 연결하고 세상을 하나로", 제출 마감 11/7(토) 10:00.
세부 기능은 `../docs/기능명세서.tsv` 참고 (ID: 0, A~I). 코드·커밋·PR에서 기능을 말할 때 이 ID(예: F.2.1)를 쓴다.

## 기술 스택
- Python 3.11+, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2, psycopg 3
- DB·로그인·사진 저장: Supabase (PostgreSQL, Auth, Storage)
  - DB는 SQLAlchemy로 직접 연결, Storage는 httpx로 REST 호출 (supabase-py 안 씀)
- 외부 API: 카카오 로컬 API(주소 → 좌표), Google Gemini(사진 판정, 기본 `gemini-3.1-flash-lite`, 바쁘면 다른 모델로 자동 재시도, Interactions API를 httpx로 호출)
- 배포: Render 무료(백엔드), Vercel(프론트, React + TypeScript)
- API 문서: Swagger `/docs` (오른쪽 위 Authorize에 Supabase access token을 넣으면 로그인 API도 테스트 가능)

## 실행 (backend 폴더에서)
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 값 채우기
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 환경변수 (`.env`, 커밋 금지 — `.env.example`만 커밋)
- `DATABASE_URL` — Supabase Postgres 연결 문자열 (Connect → Direct 탭 → Session pooler). `postgresql://`로 붙여 넣어도 `postgresql+psycopg://`로 자동 변환
- `SUPABASE_URL` — `https://<프로젝트>.supabase.co` (뒤에 `/rest/v1`이 붙어 있어도 자동으로 떼어 냄)
- `SUPABASE_SERVICE_ROLE_KEY` — Storage 업로드용 비밀 키, 서버에서만 사용. API Keys의 **secret key**(`sb_secret_...`) 또는 Legacy 탭의 `service_role`(`eyJ...`). `sb_publishable_...`(공개 키)는 안 됨. Storage 호출 시 `sb_secret_` 키는 `apikey` 헤더로만 보낸다 (JWT가 아니라서 `Authorization: Bearer`에 넣지 않음)
- `SUPABASE_JWT_SECRET` — Legacy JWT secret(HS256)을 쓰는 프로젝트만 필요. 우리 프로젝트는 새 JWT Signing Keys(ES256)라서 `SUPABASE_URL`의 JWKS로 자동 검증 → 비워 둬도 됨
- `KAKAO_REST_API_KEY` — 주소 → 좌표
- `AI_API_KEY` — 사진 판정, Google AI Studio API 키. `AI_MODEL` — 기본 `gemini-3.1-flash-lite`
- `CORS_ORIGINS` — 쉼표 구분 (로컬 `http://localhost:5173`, Vercel 주소)


## 폴더 구조
```
app/
  main.py            # FastAPI 앱, CORS, 오류 응답 한국어화, 라우터 등록
  config.py          # 환경변수 (pydantic-settings)
  db.py              # 엔진, 세션, get_db
  auth.py            # get_current_user(토큰만), get_current_profile(프로필까지)
  models/            # SQLAlchemy 모델 (profile, mission, user_mission, post, comment)
  schemas/           # Pydantic 요청/응답
  routers/           # health, me, home, missions, created_missions, attempts, posts, map
  services/          # level.py, verify.py, geocode.py, storage.py, ai_photo.py
alembic/             # 마이그레이션 (0001 테이블 + RLS, 0002 posts.title, 0003 user_missions.reviewed_at)
seed/                # 시드 미션 (H.3)
```

## 로그인
- 회원가입·로그인·로그아웃(0.1, 0.2, I.1.2)은 프론트가 Supabase Auth로 처리한다.
- 백엔드는 `Authorization: Bearer <access_token>`을 받아 검증하고, `sub`를 사용자 ID로 쓴다.
- 가입 직후 프론트가 `POST /api/me`로 프로필(닉네임, 사용자 유형, 국적)을 만든다. 프로필이 없으면 다른 API는 404 "프로필을 먼저 만들어주세요".

## DB 테이블
- `profiles` — id(uuid, Supabase auth 사용자 ID), email, nickname(unique, 한글·영문·숫자 1~20자), user_type(`korean` / `foreign_resident`), nationality(국적 코드, 4개 + `OTHER`), xp(int, 기본 0), created_at
- `missions` — id, title, description, country(필수, 나라 코드), category(필수), verify_type(`location` / `photo` / `none`), source(`ai` / `user`), place_name, address, lat, lng, radius_m(기본 300), creator_id(null이면 팀 시드), created_at, deleted_at
  - `deleted_at`이 있으면 뽑기·목록·지도에서 숨긴다. 이미 수락한 사람의 내 미션 목록에는 그대로 보인다 (E.5)
- `user_missions` — id, user_id, mission_id, status(`in_progress` / `reviewing` / `completed` / `cancelled`), accepted_at, completed_at, xp_awarded, photo_url, review(300자), reviewed_at(후기 작성·수정 날짜), deleted_at
  - 같은 사용자가 같은 미션을 `in_progress`·`reviewing`으로 두 번 가질 수 없다 (부분 unique index)
- `posts` — id, author_id, content, created_at, updated_at (숨은 뜻 지식인)
- `comments` — id, post_id, author_id, content, created_at
- 모든 테이블에 RLS를 켜 두었다 (정책 없음). 프론트가 Supabase anon key로 테이블에 직접 접근하지 못하게 막고, 백엔드만 DB에 접근한다.

## 규칙

### 경험치·레벨 (F.4, G)
- 인증 방식별 경험치: 위치 30, 사진 20, 없음 10 (`services/level.py`의 `MISSION_XP`). DB에 저장하지 않고 계산한다.
- 모든 미션 응답에 `xp`(획득 경험치)를 넣는다 (B.1.2, E.2 화면에 표시).
- 레벨은 누적 xp로 계산하고 DB에 저장하지 않는다 (`services/level.py`):
  - Lv.1 땅에 심은 볍씨 0 / Lv.2 싹을 틔운 볍씨 50 / Lv.3 함께 심은 모 150 / Lv.4 고개 숙인 벼 300 / Lv.5 볍씨를 나누는 벼 500
- 인증 성공 응답에 `xp_gained`, `total_xp`, `level`, `title`, `leveled_up`, `next_level_xp`를 넣는다. 프론트가 레벨업 팝업(G.2)에 쓴다.
- 경험치는 한 미션에 한 번만 지급한다. 이미 `completed`이면 409를 돌려준다.

### 인증 (F)
- 위치(F.1): 요청 좌표와 미션 좌표의 거리를 haversine으로 계산해 `radius_m` 이내면 성공. 실패하면 거리를 함께 돌려준다.
- 사진(F.2): image/* 파일이고 8MB 이하만 받는다. Supabase Storage `mission-photos` 버킷에 `{user_id}/{user_mission_id}.{확장자}`로 저장한다. AI가 먼저 판정하고 통과한 사진만 저장한다.
  - 버킷은 만들어 둠: 공개(public), 8MB, `image/*`만 허용. `photo_url`에는 공개 주소 `{SUPABASE_URL}/storage/v1/object/public/mission-photos/{경로}`를 저장한다.
  - AI(`services/ai_photo.py`)는 사진에 미션 내용이 보이는지만 본다. 사람 얼굴 유무는 기준이 아니다 (화면 안내만).
  - 관련 없다고 판정하거나 AI 호출이 실패하면 200 + `success: false`, 진행 중 그대로 (실패 팝업의 '다시 시도하기'로 재촬영). `reviewing` 상태와 retry API는 쓰지 않는다.
  - 프론트는 업로드 전에 긴 변 1280~1600px JPEG로 줄여서 보낸다.
- 없음(F.3): 바로 성공.
- 성공하면 status를 `completed`로, `completed_at`과 `xp_awarded`를 채우고, `profiles.xp`를 더한다. 이 처리는 `services/verify.py` 한 곳에서 한 트랜잭션으로 한다.

### 응답·코드 스타일
- 오류는 `HTTPException(status, detail="한국어 안내 문구")`로 보낸다. 프론트가 detail을 그대로 보여준다.
  - 입력 검증 오류(422)도 `main.py`에서 `detail`을 한국어 문자열 하나로 바꿔 보낸다. validator에서 `ValueError("한국어 문구")`를 던지면 그 문구가 그대로 나간다.
- 라우터는 `tags`에 명세서 구분(예: `"E. 랜덤미션"`), `summary`에 명세 ID(예: `"E.2 미션 뽑기"`)를 적고 `response_model`을 지정한다. Swagger가 곧 API 명세서다.
- 목록 API는 최신순이 기본이고, `limit` / `offset`을 받는다. 예외: 진행 중 미션(I.2)은 수락 순서(오래된 것부터).
- 위치는 인증할 때 한 번만 받고 저장하지 않는다. 거리 결과만 응답한다.
- 테스트 전용 API는 만들지 않는다. 시연용 데이터는 `seed/`로 넣는다.

## API (명세서 ID)

### 내 정보
- `POST /api/me` 프로필 생성 (0.1). 닉네임 중복·이미 프로필 있음 → 409
- `GET /api/me` 내 정보 + 레벨·칭호·xp (I.1)
- 프로필 수정(C.1)은 만들지 않는다 (프론트에 버튼만 있음)

### 메인 (B.1)
- `GET /api/home` 한 번에 돌려주는 내용:
  - `level`: B.1.1
  - `recommended`: B.1.2. `in_progress`·`reviewing` 미션 중 가장 오래전에 수락한 1개(`accepted_at`, `status` 포함), 없으면 null. 다음 미션은 프론트가 I.2 목록으로 이동해서 본다
  - `stats`: B.1.3 / I.4. 완료 미션 수, 내가 쓴 글 수, 내가 단 댓글 수

### 미션 (E)
- `GET /api/missions/random?country=&exclude_id=` 뽑기 (E.2). 이미 진행 중이거나 완료한 미션 제외, `exclude_id`로 직전 미션 제외, 없으면 404
- `GET /api/missions?country=&verify_type=` 미션 목록 (E.4, 지도 장소 찾기 H.2는 `verify_type=location`). 각 미션에 `my_status`(내 진행 상태, 없으면 null) 포함
- `POST /api/missions/{id}/accept` 수락 → user_missions에 `in_progress` (E.2, E.4, H.2). 이미 진행 중이거나 완료했으면 409
- `POST /api/missions` 미션 만들기 (E.3). 제목·설명·나라·분야 필수. location이면 주소를 카카오 API로 좌표 변환 후 저장, 변환 실패 시 400. `source=user`
- `GET /api/missions/mine` 내가 만든 미션 (E.5)
- `DELETE /api/missions/{id}` 내 미션 삭제 (E.5, 작성자만). `deleted_at`만 채운다

### 내 미션 (I.2, I.3)
- `GET /api/me/missions?status=in_progress|completed` — `in_progress`는 `reviewing` 포함, 수락 순서. `completed`는 완료 최신순, 삭제한 기록 제외
- `POST /api/me/missions/{id}/cancel` 진행 중 취소
- `DELETE /api/me/missions/{id}` 완료 기록 삭제 (204, soft delete, 지급된 xp는 유지). 완료한 미션만, 진행 중은 취소 API
- `PATCH /api/me/missions/{id}/review` 후기 작성·수정 (I.3, 1~300자, 완료한 미션만). 고치면 `reviewed_at`도 바뀜

### 인증 (F)
- `POST /api/me/missions/{id}/verify/location` body `{lat, lng}`
- `POST /api/me/missions/{id}/verify/photo` multipart `photo`
- `POST /api/me/missions/{id}/verify/none`

### 지도 (H)
- `GET /api/map/flags` 내가 위치 인증으로 완료한 장소 (H.1)

### 숨은 뜻 (D)
- `GET /api/posts` 목록 (D.3.1, 작성자 닉네임·국적·댓글 수 포함)
- `POST /api/posts` 등록 (D.2)
- `GET /api/posts/{id}` 상세 + 댓글 (D.3.2). 없으면 404
- `PATCH /api/posts/{id}` 수정, 작성자만 (D.3.3)
- `POST /api/posts/{id}/comments` 댓글 (D.3.4)

## 나라
- 미션 나라는 **대한민국 `KR`, 일본 `JP`, 중국 `CN`, 미국 `US`** 4개뿐이다. 국적은 이 4개 + 기타 `OTHER`. 목록은 `app/schemas/country.py` 한 곳에서 관리한다.
- DB(`missions.country`, `profiles.nationality`)와 API 요청·응답에는 **코드만** 쓴다. 화면 이름(한국어·영어)은 프론트가 `GET /api/countries`(국적 선택은 `?include_other=true`)를 보고 바꾼다.
- 목록에 없는 값은 422로 거절한다 (`POST /api/me` 국적은 OTHER 허용, 미션 목록·뽑기·만들기의 `country`는 4개만).

## 시드 데이터 (H.3, E.2 "기본은 AI가 선정")
- 팀이 AI로 미션을 미리 만들어 시드로 넣는다 (`source=ai`). 뽑기는 DB에서 무작위로 고른다. 실시간 AI 생성은 하지 않는다.
- 장소 미션 10~20개. 서울 밖 지역을 포함하고, 나라 4개(KR, JP, CN, US)를 고르게 섞는다.
  - 예: 전통시장, 고궁, 안산 다문화거리, 이태원, 외국 음식점
- 위치 없는 미션(사진·없음)도 나라별로 몇 개씩 넣는다. 랜덤 뽑기 시연에 쓴다.
- 장소 미션은 주소만 적고, 시드 스크립트가 카카오 API로 좌표를 채운다.

## 백엔드 분담 (3 : 2)
같은 파일을 동시에 고치지 않도록 파일 단위로 나눈다. 모델(`app/models/`)을 바꿔야 하면 상대에게 먼저 말하고 Alembic 마이그레이션을 새로 만든다.
A가 일정보다 빠르면 B의 아직 시작 안 한 이슈를 가져가 돕는다 (먼저 말하고 이슈 Assignees 변경).
브랜치: `main` ← `dev` ← `be` ← `<종류>/#<이슈번호>/<기능>` (예: `feat/#1/mission-list`, `fix/#8/mission-xp`, `chore/#9/render-deploy`). 기능 브랜치는 `be`에서 만들고 PR도 `be`로 보낸다. 셸 명령에서는 브랜치 이름을 따옴표로 감싼다 (`git push -u origin "feat/#1/mission-list"`).

- **백엔드 A (3)** — 미션을 뽑고 → 수락하고 → 인증해서 → 완료하는 핵심 흐름
  - 기반: config, db, auth, models, alembic, main, `services/level.py`, `routers/me.py` (완료)
  - `routers/missions.py` + `schemas/mission.py` + `services/missions.py` (E.4 목록 완료, E.2 뽑기, 수락)
  - `routers/attempts.py` + `services/verify.py` (I.2 진행 중·취소, F.1·F.3·F.4 인증, I.3 완료·후기·삭제)
  - 사진 인증 API (F.2) + `services/storage.py`, `services/ai_photo.py` (B에서 A로 변경)
  - Render 배포
- **백엔드 B (2)** — 메인·게시판·미션 만들기·지도·시드
  - `services/geocode.py` + `seed/` (H.3 시드 미션, 카카오 좌표 변환) — 가장 먼저
  - `routers/posts.py` (D 숨은 뜻 게시판·댓글 전체)
  - `routers/home.py` (B.1 메인, I.4 통계)
  - `routers/created_missions.py` (E.3 미션 만들기, E.5 내가 만든 미션·삭제) — geocode 재사용
  - `routers/map.py` (H.1 깃발)
- 미션 응답은 `schemas/mission.py`의 `MissionOut.from_mission(m, my_status)`, 숨긴 미션 제외는 `services/missions.py`의 `visible_missions()`, 내 진행 상태는 `my_statuses()`를 재사용한다.

## 하지 않는 것 (해커톤 범위 밖)
- 실시간 알림, 채팅, 신고·차단, 관리자 페이지
- 위치 계속 추적
- 프로필 수정(C.1), 실시간 AI 미션 생성
