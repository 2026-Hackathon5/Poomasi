
import './App.css';

import { useEffect, useState } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

// 시작 및 사용자 화면
import StartScreen from './components/StartScreen';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import ProfileScreen from './components/ProfileScreen';
import MainScreen from './components/MainScreen';

// 미션 화면
import MissionMap from './components/MissionMap';
import RandomMissionScreen from './components/RandomMissionScreen';
import MissionDrawScreen from './components/MissionDrawScreen';
import MissionCreateScreen from './components/MissionCreateScreen';

// 미션 데이터 관리
import MissionStoreProvider from './mocks/MissionStoreProvider';

// 숨은뜻 화면
import PostListScreen from './components/PostListScreen';
import PostScreen from './components/PostScreen';
import PostDetailScreen from './components/PostDetailScreen';
import PostEditScreen from './components/PostEditScreen';

// 사용자 타입
import type { UserInfo } from './types/user';

// 로그인
import { supabase } from './lib/supabase';
import { getMe, toUserInfo } from './api/me';

const emptyUser: UserInfo = {
  email: '',
  nickname: '',
  userType: 'foreign',
  country: '',
};

export default function App() {
  // 로그인한 사용자 정보 (로그인 화면에서 서버의 GET /api/me로 채움)
  const [userInfo, setUserInfo] = useState<UserInfo>({
    ...emptyUser,
  });

  // 새로고침해도 로그인 유지: 브라우저에 저장된 로그인이 있으면 내 정보를 다시 불러온다
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      try {
        setUserInfo(toUserInfo(await getMe()));
      } catch {
        // 프로필이 없거나 서버 오류면 로그인 전 상태로 둔다
      }
    });
  }, []);

  return (
    <MissionStoreProvider>
      <div className="app-container pt-[env(safe-area-inset-top)]">
        <Routes>

          {/* A. 시작 화면 */}
          <Route
            path="/"
            element={<StartScreen />}
          />

          {/* B. 로그인 */}
          <Route
            path="/login"
            element={
              <LoginScreen setUserInfo={setUserInfo} />
            }
          />

          {/* C. 회원가입 */}
          <Route
            path="/signup"
            element={
              <SignUpScreen setUserInfo={setUserInfo} />
            }
          />

          {/* C.1 데모 완료 화면 */}
          <Route
            path="/complete"
            element={
              <section
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <h2>데모 진행 완료</h2>

                <p>
                  {userInfo.nickname
                    ? `${userInfo.nickname}님, 회원가입 입력이 완료되었습니다.`
                    : userInfo.email
                      ? '데모 로그인 입력이 확인되었습니다.'
                      : '완료 화면 미리보기입니다. 현재 입력된 사용자 정보가 없습니다.'}
                </p>

                <p>
                  실제 계정 생성 및 서버 인증은 아직 연결되지 않았습니다.
                </p>

                <p>
                  새로고침하면 임시 사용자 정보는 초기화됩니다.
                </p>

                <p>
                  메인·프로필 화면은 이번 공개 범위에 포함하지 않았습니다.
                </p>

                <Link to="/home">
                  메인 화면 보기
                </Link>

                <Link to="/profile">
                  내 프로필 화면 보기
                </Link>

                <Link
                  to="/"
                  onClick={() => setUserInfo({ ...emptyUser })}
                >
                  처음으로 돌아가기
                </Link>
              </section>
            }
          />

          {/* D. 메인 화면 */}
          <Route
            path="/home"
            element={<MainScreen userInfo={userInfo} />}
          />

          {/* E. 랜덤 미션 */}
          <Route
            path="/missions"
            element={<RandomMissionScreen />}
          />

          {/* F. 미션 뽑기 */}
          <Route
            path="/missions/draw"
            element={<MissionDrawScreen />}
          />

          {/* G. 미션 생성 */}
          <Route
            path="/missions/new"
            element={<MissionCreateScreen />}
          />

          {/* H. 미션 지도 */}
          <Route
            path="/map"
            element={<MissionMap />}
          />

          {/* I. 숨은뜻 게시글 목록 */}
          <Route
            path="/posts"
            element={<PostListScreen />}
          />

          {/* J. 숨은뜻 게시글 작성 */}
          <Route
            path="/posts/new"
            element={<PostScreen />}
          />

          {/* K. 숨은뜻 게시글 상세 */}
          <Route
            path="/posts/:postId"
            element={<PostDetailScreen />}
          />

          {/* L. 숨은뜻 게시글 수정 */}
          <Route
            path="/posts/:postId/edit"
            element={<PostEditScreen />}
          />

          {/* M. 프로필 */}
          <Route
            path="/profile"
            element={
              <ProfileScreen
                userInfo={userInfo}
                setUserInfo={setUserInfo}
              />
            }
          />

          {/* 등록되지 않은 주소는 시작 화면으로 이동 */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </div>
    </MissionStoreProvider>
  );
}
