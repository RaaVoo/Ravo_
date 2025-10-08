import React, { useState } from 'react';
import GoogleLogo from '../../components/google-logo.png';
//import { Link } from 'react-router-dom';
import FindIdPage from './FindIdPage.jsx';
import FindPwPage from './FindPwPage.jsx';
import './LoginPage.css';
import './FindIdPage.css';
import './FindPwPage.css';
import { useUser } from '../../context/UserContext';      // 전역 상태 (251006 추가)

const LoginPage = () => {
    const [showFindIdPage, setShowFindIdPage] = useState(false);
    const [showFindPwPage, setShowFindPwPage] = useState(false);

    // 백엔드와 연결하는 코드 1
    const [userId, setUserId] = useState('');
    const [userPw, setUserPw] = useState('');

    const { updateUserNo } = useUser();     // UserContext에서 user_no 가져오기 (251006 추가)

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
                //localStorage.setItem('userNo', data.user_no);       // user_no도 저장 -> 홈캠에서 사용 (잠깐 추가)
                
                //updateUserNo(data.user_no);   // context 업데이트 (잠깐 추가)

                // 응답에서 가능한 키들을 안전하게 추출 (251006 추가)
                const userNoFromApi =
                    data?.user_no ?? data?.userNo ?? data?.id ?? data?.user?.user_no ?? null;

                if (userNoFromApi == null) {
                    alert('로그인 응답에 user_no가 없습니다. 백엔드 응답을 확인해주세요.');
                    return;
                }
                const userNoStr = String(userNoFromApi);
                localStorage.setItem('userNo', userNoStr);
                updateUserNo(userNoStr);                 // 컨텍스트에도 반영 (여기까지)

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