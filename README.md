# 🌾 POOMASI (품앗이)

**포용사회로 나아가는 품앗이**

한국에 사는 외국인과 한국인이 **작은 미션**을 주고받으며 서로의 문화를 경험하는 서비스

2026 디소공 해커톤 · 팀 **5팀**

[🌐 서비스 바로가기](https://dswu-k-bridge.vercel.app) · [📘 API 문서 (Swagger)](https://poomasi.onrender.com/docs)

</div>

---

## 📌 목차

1. [서비스 소개](#-서비스-소개)
2. [주요 기능](#-주요-기능)
3. [기술 스택](#-기술-스택)
4. [폴더 구조](#-폴더-구조)
5. [배포](#-배포)
6. [팀원](#-팀원)

---

## 💡 서비스 소개

**품앗이**는 이웃끼리 서로 일을 거들어 주고받던 우리 전통 문화예요.

POOMASI는 이 정신을 빌려, 한국에 사는 외국인과 한국인이 서로의 문화를 **미션**으로 주고받게 해요.

- 외국인은 "북촌 한옥마을 골목 걷기" 같은 **한국 문화 미션**에 도전해요.
- 한국인은 "땅콩버터잼 샌드위치 만들기"처럼 **다른 나라 문화 미션**을 경험하고, 직접 미션을 만들어 나눠요.
- 미션을 인증하면 경험치가 쌓이고, **볍씨에서 벼로** 자라나는 과정을 거쳐요. 
- 궁금한 한국어 표현은 **숨은 뜻** 게시판에서 서로 묻고 답해요.

---

## ✨ 주요 기능

### 🎲 랜덤 미션
- 관심 있는 나라를 고르고 **미션 뽑기**를 하거나, 전체 미션 목록에서 골라 **수락**해요.
- 누구나 **미션을 직접 만들 수** 있어요. 

### 미션 인증 (3가지)
| 인증 방식 | 방법 | 경험치 |
|---|---|---|
| 📍 **위치 인증** | 미션 장소 반경 안에서 현재 위치를 확인 | +30 XP |
| 📷 **사진 인증** | 카메라로 찍은 사진을 AI(Google Gemini)가 미션과 관련 있는지 판정 | +20 XP |
| ✔️ **인증 없음** | 완료 버튼만 누르면 끝 | +10 XP |

### 🌱 레벨 · 칭호
경험치가 쌓이면 레벨이 오르는 재미를 부여해요.

| 레벨 | 칭호 | 필요 경험치 |
|---|---|---|
| Lv.1 | 땅에 심은 볍씨 | 0 |
| Lv.2 | 싹을 틔운 볍씨 | 50 |
| Lv.3 | 함께 심은 모 | 150 |
| Lv.4 | 고개 숙인 벼 | 300 |
| Lv.5 | 볍씨를 나누는 벼 | 500 |

### 🗺️ 미션 지도
- **내가 간 곳**: 위치 인증으로 완료한 장소에 🚩 깃발이 꽂혀요.
- **장소 미션 찾기**: 아직 수락하지 않은 장소 미션을 📍 핀으로 보여주고, 바로 수락할 수 있어요.

### 💬 숨은 뜻 지식인
- "괜찮아요", "눈치가 빠르다"처럼 **헷갈리는 한국어 표현**을 묻고 댓글로 답해요.

### 👤 프로필
- 레벨·경험치, 진행 중인 미션, 완료한 미션을 한눈에 봐요.

### 📱 휴대폰 앱처럼 
- PWA 기술을 사용하여 아이폰 Safari에서 **홈 화면에 추가**하면 앱처럼 생성하여 편의를 높임

---

## 🛠 기술 스택

| 구분 | 사용 기술 |
|---|---|
| **Frontend** | React, TypeScript, Vite, React Router |
| **Backend** | Python 3.13, FastAPI |
| **Database** | Supabase PostgreSQL |
| **인증** | Supabase Auth (이메일·비밀번호, JWT 검증) |
| **파일 저장** | Supabase Storage (사진 인증 이미지) |
| **AI** | Google Gemini gemini-3.1-flash-lite(사진 인증 판정) |
| **지도** | Kakao Maps JavaScript SDK, Kakao 로컬 API (주소 → 좌표) |
| **배포** | Vercel (프론트), Render (백엔드) |
| **협업** | GitHub, Figma, Notion |

---

---

## 📁 폴더 구조

```
dswu-KBridge/
├── backend/                 # FastAPI 서버
│   ├── app/
│   │   ├── main.py          # 앱 시작점 (CORS, 라우터 연결)
│   │   ├── auth.py          # Supabase 로그인 토큰 검증
│   │   ├── config.py        # 환경 변수
│   │   ├── models/          # DB 테이블 (SQLAlchemy)
│   │   ├── schemas/         # 요청·응답 모양 (Pydantic)
│   │   ├── routers/         # API (미션, 인증, 지도, 게시판, 프로필 …)
│   │   └── services/        # 레벨 계산, 위치·사진 판정, 주소 → 좌표, 사진 저장
│   ├── alembic/             # DB 변경 이력 (마이그레이션)
│   ├── seed/                # 시드 미션 데이터
│   └── requirements.txt
├── frontend/                # React 앱
│   ├── public/              # 아이콘, 홈 화면 앱 설정(manifest)
│   └── src/
│       ├── api/             # 서버 요청 (client.ts가 토큰을 자동으로 붙임)
│       ├── components/      # 화면 (메인, 미션, 인증, 지도, 숨은 뜻, 프로필 …)
│       ├── lib/             # Supabase 연결
│       ├── mocks/           # 미션 데이터 저장소 (서버 데이터를 화면끼리 공유)
│       ├── styles/          # 화면별 스타일
│       └── types/           # 타입 정의
└── docs/
    └── 기능명세서.tsv        # 기능 명세
```


## ☁️ 배포

| 대상 | 플랫폼 | 주소 |
|---|---|---|
| Frontend | Vercel | https://dswu-k-bridge.vercel.app |
| Backend | Render | https://poomasi.onrender.com | 
---


## 👥 팀원

<table align="center">
  <tr>
    <td align="center" width="160">
      <!-- PM: 아이디를 넣으면 사진이 나와요. 예) https://github.com/아이디.png?size=120 -->
      <img src="https://github.com/github.png?size=120" width="100" height="100" alt="PM" /><br />
      <b>오윤채</b><br />
      <sub>PM</sub>
    </td>
    <td align="center" width="160">
      <a href="https://github.com/giri-pig">
        <img src="https://github.com/giri-pig.png?size=120" width="100" height="100" alt="김보연" /><br />
        <b>김보연</b>
      </a><br />
      <sub>Frontend</sub><br />
      <sub>@giri-pig</sub>
    </td>
    <td align="center" width="160">
      <a href="https://github.com/0xhyeppy">
        <img src="https://github.com/0xhyeppy.png?size=120" width="100" height="100" alt="이지혜" /><br />
        <b>이지혜</b>
      </a><br />
      <sub>Frontend</sub><br />
      <sub>@0xhyeppy</sub>
    </td>
    <td align="center" width="160">
      <a href="https://github.com/alskso">
        <img src="https://github.com/alskso.png?size=120" width="100" height="100" alt="한연주" /><br />
        <b>한연주</b>
      </a><br />
      <sub>Backend</sub><br />
      <sub>@alskso</sub>
    </td>
    <td align="center" width="160">
      <a href="https://github.com/miyaungi">
        <img src="https://github.com/miyaungi.png?size=120" width="100" height="100" alt="조민서" /><br />
        <b>조민서</b>
      </a><br />
      <sub>Backend</sub><br />
      <sub>@miyaungi</sub>
    </td>
  </tr>
</table>

<div align="center">

🌾 **함께 심고, 함께 자라는 품앗이** 🌾

</div>
