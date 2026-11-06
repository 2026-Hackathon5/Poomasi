// 모든 화면이 같이 쓰는 백엔드 요청 함수
// - 주소 앞에 VITE_API_BASE_URL을 붙이고
// - 저장된 로그인 토큰을 Authorization 헤더에 넣고
// - 실패하면 백엔드의 한국어 안내(detail)를 담은 ApiError를 던진다

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// 로그인 토큰 저장 위치 (로그인 화면을 연결하면 거기서 저장한다)
const TOKEN_KEY = 'poomasi_access_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// 백엔드가 보낸 오류. status로 401(로그인 필요), 404(없음) 등을 구분할 수 있다
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
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

  if (!res.ok) {
    // 백엔드 오류는 {"detail": "한국어 안내"} 모양
    let message = `요청에 실패했어요 (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data?.detail === 'string') message = data.detail;
    } catch {
      /* 본문이 JSON이 아니면 기본 문구 사용 */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T; // 내용 없는 성공 (삭제 등)
  return (await res.json()) as T;
}