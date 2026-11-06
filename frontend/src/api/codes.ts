// 백엔드 코드 ↔ 화면에 보일 이름 (백엔드는 코드만 저장하고, 이름은 프론트가 정한다)

// 미션 나라: 태그에 보이는 이름
export const COUNTRY_LABEL: Record<string, string> = {
  KR: '한국',
  JP: '일본',
  CN: '중국',
  US: '미국',
};

// 국적: 회원가입 · 프로필에 보이는 이름
export const NATIONALITY_LABEL: Record<string, string> = {
  KR: '대한민국',
  JP: '일본',
  CN: '중국',
  US: '미국',
  OTHER: '기타',
};

// 미션 분야
export const CATEGORY_LABEL: Record<string, string> = {
  experience: '체험',
  food: '음식',
  place: '장소',
};

// 거꾸로 (화면 이름 → 코드): 미션 만들기 · 회원가입처럼 보낼 때 쓴다
export const toCode = (table: Record<string, string>, label: string) =>
  Object.keys(table).find((code) => table[code] === label) ?? label;