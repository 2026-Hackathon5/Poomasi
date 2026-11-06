# POOMASI — 로그인·회원가입 UI 데모

React + TypeScript + Vite로 제작한 첫 공개 버전입니다. 시작 / 로그인 / 회원가입 UI만 포함합니다.

> 실제 서비스용 인증이 아닙니다. 실제 이메일·비밀번호를 입력하지 마세요.

## 실행

Node.js와 npm이 설치된 환경에서 아래 명령을 실행합니다. Node 버전은 package-lock.json의 Vite 등 의존성 engines 조건을 만족해야 합니다.

```bash
npm ci
npm run dev
```

개발 서버가 터미널에 출력하는 주소로 접속합니다.

```bash
npm run build
npm run lint
```

위 두 명령은 본인 PC에서 최초 커밋 전에 확인하세요. 이 정리본은 파일 참조를 정적으로 확인했으며 실제 빌드·브라우저 테스트는 수행하지 않았습니다. package.json과 package-lock.json의 의존성 버전은 원본을 유지했습니다.

## 이번 공개 범위

- 시작 화면과 로그인/회원가입 화면 전환
- 로그인 입력, 버튼 활성/비활성 및 오류 메시지
- 회원가입 입력, 사용자 유형 선택, 국적 검색/선택 UI
- 진행 완료 확인용 임시 화면

## 구현 상태와 제한

- 로그인은 원본의 고정 테스트 계정 `poomasi@gmail.com` / `123456`만 통과합니다. 실제 서비스 계정이나 인증 수단이 아닙니다. 본인이 실제로 쓰는 자격정보라면 공개 전에 반드시 변경하세요.
- 회원가입은 React 상태에 입력 정보만 보관합니다. 계정/비밀번호가 서버나 DB에 저장되지 않으며 새로고침하면 사라집니다.
- 회원가입한 이메일/비밀번호로 로그인할 수는 없습니다.
- 서버 API, 토큰/세션, 비밀번호 해싱, 이메일 인증, 중복 확인 API는 없습니다.
- 이메일 검사는 `@` 포함 여부만 확인합니다. 비밀번호는 현재 길이만 확인하므로 안내 문구의 영문·숫자 조합을 강제하지 않습니다.
- 원본의 `중복닉네임` 데모 검사는 이후 상태 변경으로 오류가 해제되는 문제가 남아 있습니다. 실제 중복 검사로 사용하지 마세요.
- 언어 버튼은 이미지 전환만 하고 화면 문구 전체를 번역하지 않습니다.
- manifest / service worker가 없어 설치형 PWA 및 오프라인 기능은 아직 포함되어 있지 않습니다.
- 실제 메인·프로필·하단 내비게이션은 이번 공개에서 제외했습니다.

## 정리하면서 바꾼 부분

- App.tsx에서 미완성 MainScreen/ProfileScreen 참조와 불필요한 주석을 제거했습니다.
- 기존 MAIN 이동은 간단한 데모 완료 화면으로 연결했습니다. 원래 MAIN 기능은 포함하지 않습니다.
- StartScreen의 이미지 경로를 실제 파일명 `Lang=KO.png`, `Lang=EN.png`와 일치시켜 대소문자 구분 환경의 오류를 방지했습니다.
- index.css 끝의 닫히지 않은 주석을 닫았습니다.
- .gitignore에 환경변수 파일과 TypeScript 빌드 캐시를 추가했습니다.
- 로그인/회원가입의 기존 검증 로직과 디자인은 유지했습니다.

## 첫 GitHub 업로드

원본 작업 폴더가 아니라 이 정리본 폴더에서 시작합니다. GitHub에서 **README, .gitignore, License를 자동 생성하지 않은 빈 저장소**를 만든 뒤 진행하세요.

```bash
git init
git branch -M main
git add .
git status
```

스테이징 목록에 메인·프로필 파일, node_modules, .env 등이 없는지 확인한 다음:

```bash
git commit -m "feat: add login and signup UI demo"
git remote add origin https://github.com/YOUR_ID/YOUR_REPO.git
git push -u origin main
```

YOUR_ID/YOUR_REPO는 본인의 GitHub 사용자명과 저장소명으로 바꿉니다. GitHub 로그인 인증이 필요할 수 있습니다. 압축파일 자체가 아니라 압축을 푼 폴더 안의 파일을 커밋합니다.

## 다음 기능 추가

원본 프로젝트는 별도 백업으로 보관하고, 이 폴더를 이후 개발 기준 폴더로 사용하세요. 원본 전체를 다시 덮어쓰지 마세요. 다음 기능에 필요한 파일과 이미지, App.tsx의 import/화면 타입/분기만 함께 옮깁니다.

```bash
git switch -c feature/main-screen
# MainScreen 및 필요한 구성요소/이미지 추가, App.tsx 연결
npm run build
npm run lint
git add src/components/MainScreen.tsx src/App.tsx
# 필요한 다른 파일은 실제 경로를 지정해 추가
git diff --cached
git commit -m "feat: add main screen"
git push -u origin feature/main-screen
```

GitHub에서 Pull Request를 열어 main에 병합합니다. 혼자 작업하면 main에서 기능별 커밋을 진행해도 됩니다. 기능이 여러 파일에 걸쳐 있으면 서로 의존하는 파일을 같은 커밋에 포함합니다.

Git은 파일의 특별한 형식이 아니라 변경 이력을 관리합니다. 일반 프로젝트 폴더에서 git init으로 시작할 수 있습니다. 이번 파일에는 개인 저장소 주소나 기존 .git 이력이 포함되어 있지 않습니다.
