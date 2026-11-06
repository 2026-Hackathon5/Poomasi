// 랜덤 미션(E) 화면들이 같이 쓰는 작은 조각: 태그 · 토스트 (아이콘은 icons.tsx)
import type { ReactNode } from 'react';
import type { CatalogMission } from '../types/mission';
import { VERIFY_TAG } from '../utils/mission';
import { rs } from '../styles/random';
import { CircleCheck } from './icons';

export function MissionTags({ m, withVerify = true }: { m: CatalogMission; withVerify?: boolean }) {
  return (
    <div style={rs.tagRow}>
      <span style={rs.tag}>{m.country}</span>
      <span style={rs.tag}>{m.category}</span>
      {withVerify && <span style={rs.tag}>{VERIFY_TAG[m.verifyType]}</span>}
    </div>
  );
}

export function Toast({ children }: { children: ReactNode }) {
  return (
    <div style={rs.toast} role="status">
      <CircleCheck />
      <span>{children}</span>
    </div>
  );
}
