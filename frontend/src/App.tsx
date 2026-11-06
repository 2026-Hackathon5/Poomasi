
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import type { ComponentType } from 'react';

import StartScreen from './components/StartScreen';
import SignUpScreen from './components/SignUpScreen';
import LoginScreen from './components/LoginScreen';
import ProfileScreen from './components/ProfileScreen';

import PostListScreen from './components/PostListScreen';
import PostScreen from './components/PostScreen';
import PostDetailScreen from './components/PostDetailScreen';
import PostEditScreen from './components/PostEditScreen';

import type { ScreenType } from './types';

export type { ScreenType } from './types';

// 기존 회원가입 / 로그인 화면과 React Router 연결
function LegacyRoute({
  Component,
}: {
  Component: ComponentType<{
    onNavigate: (screen: ScreenType) => void;
  }>;
}) {
  const navigate = useNavigate();

  const handleNavigate = (nextScreen: ScreenType) => {
    const routes: Partial<Record<ScreenType, string>> = {
      START: '/',
      SIGNUP: '/signup',
      LOGIN: '/login',
      PROFILE: '/profile',
      POST_LIST: '/posts',
      POST_WRITE: '/posts/new',
      POST_DETAIL: '/posts',
      POST_EDIT: '/posts',
    };

    navigate(routes[nextScreen] || '/');
  };

  return <Component onNavigate={handleNavigate} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          {/* 기존 회원가입 / 로그인 화면 */}
          <Route
            path="/"
            element={<LegacyRoute Component={StartScreen} />}
          />

          <Route
            path="/signup"
            element={<LegacyRoute Component={SignUpScreen} />}
          />

          <Route
            path="/login"
            element={<LegacyRoute Component={LoginScreen} />}
          />

          <Route
            path="/profile"
            element={<LegacyRoute Component={ProfileScreen} />}
          />

          {/* 숨은뜻 게시글 목록 */}
          <Route
            path="/posts"
            element={<PostListScreen />}
          />

          {/* D.2 글 작성 */}
          <Route
            path="/posts/new"
            element={<PostScreen />}
          />

          {/* D.3.3 게시글 상세 */}
          <Route
            path="/posts/:postId"
            element={<PostDetailScreen />}
          />

          {/* D.3.2 게시글 수정 */}
          <Route
            path="/posts/:postId/edit"
            element={<PostEditScreen />}
          />

          {/* 잘못된 주소 접속 시 */}
          <Route
            path="*"
            element={<Navigate to="/posts" replace />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
