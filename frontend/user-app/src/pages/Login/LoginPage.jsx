import React, { useState } from 'react';
import GoogleLogo from '../../components/google-logo.png';
//import { Link } from 'react-router-dom';
import FindIdPage from './FindIdPage.jsx';
import FindPwPage from './FindPwPage.jsx';
import './LoginPage.css';
import './FindIdPage.css';
import './FindPwPage.css';

const LoginPage = () => {
    const [showFindIdPage, setShowFindIdPage] = useState(false);
    const [showFindPwPage, setShowFindPwPage] = useState(false);

    // 백엔드와 연결하는 코드 1
    const [userId, setUserId] = useState('');
    const [userPw, setUserPw] = useState('');

    // 백엔드와 연결하는 코드 2
    const handleLogin = async () => {
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId, user_pw: userPw }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(`${data.u_name}님, 환영합니다!`);
                localStorage.setItem('token', data.token);          // 토큰 저장 -> 개발자 도구 Application -> Local Storage에서 확인 가능
                localStorage.setItem('userName', data.u_name);      // 사용자 이름 저장 -> 헤더에 나타내려고
                window.location.href="/";
            } else {
                alert(`${data.error}`);
            }
        } catch (err) {
            console.error('로그인 에러: ', err);
            alert('서버에 연결할 수 없습니다.');
        }
    };

    // 구글 계정으로 로그인 관련 코드
    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:8080/auth/google';
    }

  return (
    <div className="login-container">
        {/* 네비게이션바 */}
        {/* <nav className="navbar">
            <div className="logo-box"></div>
            <span className="brand">라보야 놀자</span>
            <div className="nav-links">
                <Link to="/auth/login" className="nav-link">로그인</Link>
                <Link to="/auth/signup/select" className="nav-link">회원가입</Link>
            </div>
        </nav> */}

        <div className="background-section"></div>

        <div className="login-box">
            <div className="title">
                <h1 className="title-main1">라보야 놀자</h1>
                <h2 className="title-sub1">로그인하기</h2>
            </div>


            {/* 아이디, 비밀번호 입력창 */}
            <div className="input-group">
                <input 
                    type="text" placeholder="아이디를 입력해주세요." className="input-field" 
                    value={userId} onChange={(e) => setUserId(e.target.value)} />
                <input 
                    type="password" placeholder="비밀번호를 입력해주세요." className="input-field" 
                    value={userPw} onChange={(e) => setUserPw(e.target.value)} />
            </div>

            {/* 로그인 성공시 main으로 이동 */}
            <button className="login-button"onClick={handleLogin}>로그인</button>

            <div className="google-login" onClick={handleGoogleLogin}>
                <button className="google-box">
                    <img className="google-img" src={GoogleLogo} alt="구글 로고 이미지"></img>
                    <span className="google-text">Google 계정으로 로그인</span>
                </button>
            </div>

            <div className="action-links">
                <button className="link" onClick={() => setShowFindIdPage(true)}>아이디 찾기</button>
                <span className="divider" />
                <button className="link" onClick={() => setShowFindPwPage(true)}>비밀번호 찾기</button>
                <span className="divider" />
                <a className="link" href="/auth/signup/select">회원가입</a>
            </div>

            {/* 아이디 찾기 팝업창 */}
            {showFindIdPage && <FindIdPage onClose={() => setShowFindIdPage(false)} 
                // onOpenFindPwPage 코드 추가해주었음 -> 아이디 찾기 성공창 -> 비밀번호 찾기 클릭 -> 비밀번호 찾기 팝업창 띄우기
                onOpenFindPwPage={() => {
                    setShowFindIdPage(false);
                    setShowFindPwPage(true);
                }}
                />}
            
            {/* 비밀번호 찾기 팝업창 */}
            {showFindPwPage && <FindPwPage onClose={() => setShowFindPwPage(false)} />}
        </div>
    </div>
  );
};

export default LoginPage;