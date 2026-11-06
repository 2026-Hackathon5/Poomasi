// 레벨·칭호 계산 (프로필 I, 메인 B.1에서 같이 씀)
// 백엔드 services/level.py와 같은 칭호·기준 (API 연결 전 목업용)

export const LEVELS = [
  { lv: 1, title: '땅에 심은 볍씨', min: 0 },
  { lv: 2, title: '싹을 틔운 볍씨', min: 50 },
  { lv: 3, title: '함께 심은 모', min: 150 },
  { lv: 4, title: '고개 숙인 벼', min: 300 },
  { lv: 5, title: '볍씨를 나누는 벼', min: 500 },
];

export function getLevel(xp: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (xp >= l.min) idx = i;
  });
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1];
  return {
    lv: cur.lv,
    title: cur.title,
    nextXp: next ? next.min : null, // 다음 레벨 기준 경험치 (마지막 레벨이면 null)
    remain: next ? next.min - xp : 0, // 다음 레벨까지 남은 경험치
    percent: next ? Math.min(100, ((xp - cur.min) / (next.min - cur.min)) * 100) : 100,
  };
}
