import type { VerifyType } from '../types/mission';

export const VERIFY_LABEL: Record<VerifyType, string> = {
  photo: '사진 찍기',
  location: '위치 인증',
  none: '없음',
};

const pad = (n: number) => String(n).padStart(2, '0');

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 목록용: 2026.11.4
export function fmtShort(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y}.${m}.${d}`;
}

// 상세용: 2026.11.04
export function fmtLong(iso: string) {
  return iso.replace(/-/g, '.');
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
