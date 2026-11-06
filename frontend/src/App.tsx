import { useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import StartScreen from './components/StartScreen';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import ProfileScreen from './components/ProfileScreen';
import PostListScreen from './components/PostListScreen';
import PostScreen from './components/PostScreen';
import PostDetailScreen from './components/PostDetailScreen';
import PostEditScreen from './components/PostEditScreen';
import type { UserInfo } from './types/user';

const emptyUser: UserInfo = { email: '', nickname: '', userType: 'foreign', country: '' };

export default function App() {
  // Demo-only state. This is not authentication and resets on refresh.
  const [userInfo, setUserInfo] = useState<UserInfo>({ ...emptyUser });

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<StartScreen />} />
        <Route path="/login" element={<LoginScreen setUserInfo={setUserInfo} />} />
        <Route path="/signup" element={<SignUpScreen setUserInfo={setUserInfo} />} />
        <Route
          path="/complete"
          element={
            <section style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2>데모 진행 완료</h2>
              <p>
                {userInfo.nickname
                  ? `${userInfo.nickname}님, 회원가입 입력이 완료되었습니다.`
                  : userInfo.email
                    ? '데모 로그인 입력이 확인되었습니다.'
                    : '완료 화면 미리보기입니다. 현재 입력된 사용자 정보가 없습니다.'}
              </p>
              <p>실제 계정 생성 및 서버 인증은 아직 연결되지 않았습니다.</p>
              <p>새로고침하면 임시 사용자 정보는 초기화됩니다.</p>
              <p>메인·프로필 화면은 이번 공개 범위에 포함하지 않았습니다.</p>
              <Link to="/profile">내 프로필 화면 보기</Link>
              <Link to="/" onClick={() => setUserInfo({ ...emptyUser })}>처음으로 돌아가기</Link>
            </section>
          }
        />
        {/* D 숨은 뜻: 목록 / 작성 / 상세 / 수정 */}
        <Route path="/posts" element={<PostListScreen />} />
        <Route path="/posts/new" element={<PostScreen />} />
        <Route path="/posts/:postId" element={<PostDetailScreen />} />
        <Route path="/posts/:postId/edit" element={<PostEditScreen />} />
        <Route path="/profile" element={<ProfileScreen userInfo={userInfo} setUserInfo={setUserInfo} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
