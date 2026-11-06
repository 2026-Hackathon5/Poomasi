import { supabase } from '../lib/supabase';

// 우리 백엔드 서버 주소. .env에 없으면 배포된 Render 서버를 쓴다
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://poomasi.onrender.com';

// 서버가 실패를 알려줄 때 쓰는 에러 (status로 404·409 등을 구분할 수 있다)
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// 서버 에러 응답에서 사람이 읽을 문구를 꺼낸다
// FastAPI는 { detail: "문구" } 또는 검사 실패 시 { detail: [{ msg: "..." }] } 모양으로 보낸다
function errorMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail) && detail[0]?.msg) {
    return String(detail[0].msg).replace(/^Value error, /, '');
  }

  return `요청에 실패했어요 (${status})`;
}

/**
 * 모든 서버 요청은 이 함수로 보낸다.
 * 로그인 상태면 Authorization: Bearer 토큰을 자동으로 붙인다.
 *
 * 예) const me = await api<Me>('/api/me');
 *     await api('/api/posts', { method: 'POST', body: { title, content } });
 *     await api('/api/user-missions/3/verify/photo', { method: 'POST', body: formData });
 */
export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body; // 사진 업로드: Content-Type은 브라우저가 알아서 붙인다
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
    });
  } catch {
    throw new ApiError(0, '서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요');
  }

  if (response.status === 204) return undefined as T;

  const json: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, errorMessage(json, response.status));
  }

  return json as T;
}
