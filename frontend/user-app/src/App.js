import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage.jsx';
import SignupPage from './pages/Signup/SignupPage.jsx';
import Footer from './components/Footer.jsx';
import ChildInfoPage from './pages/Signup/ChildInfoPage.jsx';
import UserDeletePage from './pages/UserDelete/UserDeletePage.jsx';
import SignupSelectPage from './pages/Signup/SignupSelectPage.jsx';
import './pages/Login/LoginPage.css';
import './pages/Signup/SignupPage.css';
import './App.css';
import Header from './components/Header.jsx';
import MainPage from './pages/MainPage.jsx';
import LoginSuccess from './pages/Login/LoginSuccess.jsx';
import MyPage from './pages/MyPage/MyPage.jsx';
import UserInfoModify from './pages/MyPage/UserInfoModify.jsx';
import ChildInfoModify from './pages/MyPage/ChildInfoModify.jsx';
import ChildInfoAdd from './pages/MyPage/ChildInfoAdd.jsx';
import { UserProvider, useUser } from './context/UserContext.js';     // 전역 상태 받아옴 (250919)

// 원래 App()이었음
function AppContent() {
  // 헤더 부분 변경되기 위함 -> 로그인 한 상태 전달을 위한 코드
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const { user, updateUserName } = useUser();     // 사용자 이름 상태 받아옴 (250919)

  // 앱 시작 시 /auth/me 호출해서 상태 동기화
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/auth/me', { credentials: 'include' }); 
        if (!res.ok) throw new Error();

        const me = await res.json();
        // 쿠키 기반 인증 성공 → 전역 상태 업데이트
        setIsLoggedIn(true);
        updateUserName(me.u_name || me.user_id);    // 사용자 이름 상태 업데이트

        // localStorage에 최소한의 표식 저장 (새로고침 시 참고용)
        localStorage.setItem('token', 'cookie');
        localStorage.setItem('userName', me.u_name || me.user_id);
      } catch {
        // 로그인 안 된 상태
        setIsLoggedIn(false);
        updateUserName("");     // 250919 추가
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
      }
    })();
  }, []);

  // 로그아웃
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    updateUserName("");     // 250919 추가
  }

  return (
    <BrowserRouter>
      <Header 
        isLoggedIn={isLoggedIn}
        //userName={userName}   // 잠깐 주석 (250919)
        userName={user.userName}    // 잠깐 추가 (250919)
        onLogout={handleLogout}
      />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/auth/login" element={<LoginPage />}></Route>
        <Route path="/login/success" element={<LoginSuccess />}></Route>
        <Route path="/auth/signup" element={<SignupPage />}></Route>
        <Route path="/auth/signup/child" element={<ChildInfoPage />}></Route>
        <Route path="/auth/delete" element={<UserDeletePage/>}></Route>
        <Route path="/auth/signup/select" element={<SignupSelectPage />}></Route>
        <Route path="/mypage" element={<MyPage onLogout={handleLogout}/>} />
        <Route path="/mypage/me/profile" element={<UserInfoModify />} />
        <Route path="/mypage/children/profile" element={<ChildInfoModify />} />
        <Route path="/mypage/children/add" element={<ChildInfoAdd />} /> 
      </Routes>
      <Footer/>
    </BrowserRouter>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  )
}

export default App;