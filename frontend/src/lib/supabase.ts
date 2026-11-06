import { createClient } from '@supabase/supabase-js';

// Supabase 로그인 전용 연결 (DB는 직접 건드리지 않고 우리 서버 API를 통해서만 쓴다)
// publishable 키는 브라우저에 공개돼도 되는 키. sb_secret_ 키는 절대 넣지 말 것
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('frontend/.env에 VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY를 넣어 주세요');
}

export const supabase = createClient(url ?? '', key ?? '', {
  auth: {
    persistSession: true, // 새로고침해도 로그인 유지 (브라우저에 저장)
    autoRefreshToken: true, // 토큰이 만료되기 전에 자동으로 새로 받음
  },
});
