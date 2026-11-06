import { useState } from 'react';
import StartScreen from './components/StartScreen';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';

// MAIN is a temporary completion screen, not the unfinished main feature.
export type ScreenType = 'START' | 'LOGIN' | 'SIGNUP' | 'MAIN';
export interface UserInfo {
  email: string;
  nickname: string;
  userType: 'foreign' | 'korean';
  country: string;
}
const emptyUser: UserInfo = { email: '', nickname: '', userType: 'foreign', country: '' };

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('START');
  const [userInfo, setUserInfo] = useState<UserInfo>(emptyUser);
  const resetDemo = () => {
    setUserInfo({ ...emptyUser });
    setCurrentScreen('START');
  };

  return (
    <div className="app-container">
      {currentScreen === 'START' && <StartScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'LOGIN' && (
        <LoginScreen onNavigate={setCurrentScreen} setUserInfo={setUserInfo} />
      )}
      {currentScreen === 'SIGNUP' && (
        <SignUpScreen onNavigate={setCurrentScreen} setUserInfo={setUserInfo} />
      )}
      {currentScreen === 'MAIN' && (
        <section style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2>데모 진행 완료</h2>
          <p>{userInfo.nickname ? `${userInfo.nickname}님, 회원가입 입력이 완료되었습니다.` : '데모 로그인 입력이 확인되었습니다.'}</p>
          <p>실제 계정 생성 및 서버 인증은 아직 연결되지 않았습니다.</p>
          <p>메인·프로필 화면은 이번 공개 범위에 포함하지 않았습니다.</p>
          <button type="button" onClick={resetDemo}>처음으로 돌아가기</button>
        </section>
      )}
    </div>
  );
}
