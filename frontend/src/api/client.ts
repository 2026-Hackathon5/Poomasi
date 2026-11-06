// 모든 화면이 같이 쓰는 백엔드 요청 함수
// - 주소 앞에 VITE_API_BASE_URL을 붙이고 (없으면 배포 서버)
// - Supabase 로그인 토큰을 Authorization 헤더에 넣고
// - 실패하면 백엔드의 한국어 안내(detail)를 담은 ApiError를 던진다
//
// 함수는 두 가지 모양이 있고 둘 다 같은 일을 한다 (편한 쪽을 쓰면 됨)
//   api<T>('/api/me')                                       ← body에 객체를 그대로 넣음
//   apiFetch<T>('/api/home', { method: 'POST', body: JSON.stringify(...) })  ← fetch와 같은 모양
import { supabase } from '../lib/supabase';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://poomasi.onrender.com';

// 백엔드가 보낸 오류. status로 401(로그인 필요), 404(없음) 등을 구분할 수 있다
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// 지금 로그인한 사람의 토큰 (로그인 화면에서 supabase로 로그인하면 supabase가 저장해 둔다)
export async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// 백엔드 오류 본문에서 사람이 읽을 문구 꺼내기
// {"detail": "한국어 안내"} 또는 입력 검사 실패 시 {"detail": [{"msg": "..."}]}
function errorMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) {
    return String(detail[0].msg).replace(/^Value error, /, '');
  }
  return `요청에 실패했어요 (${status})`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  // 사진처럼 FormData를 보낼 때는 Content-Type을 브라우저가 정하게 둔다
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, '서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요');
  }

  if (res.status === 204) return undefined as T; // 내용 없는 성공 (삭제 등)

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, res.status));
  return data as T;
}

// body에 객체를 넣으면 JSON으로 바꿔서 보내는 버전 (FormData는 그대로)
export function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { method, body } = options;
  return apiFetch<T>(path, {
    method: method ?? 'GET',
    body:
      body === undefined || body instanceof FormData
        ? (body as FormData | undefined)
        : JSON.stringify(body),
  });
}
