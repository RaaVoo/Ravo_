// 기존 회원가입 vs 구글 계정으로 회원가입 고르는 화면
import React from 'react';
import './SignupSelectPage.css';
import GoogleLogo from '../../components/google-logo.png';
import { useNavigate } from 'react-router-dom';

const SignupSelectPage = () => {
    const navigate = useNavigate();

    const handleNormalSignupPage = () => {
        navigate('/auth/signup');
    }

    // 구글 회원가입 버튼 클릭 시 -> 로그인 페이지의 handleGoogleLogin과 동일하게 처리
    const handleGoogleSignup = () => {
        window.location.href = 'http://localhost:8080/auth/google';
    }

  return (
    <div className="signup-select-container">
      <div className="signup-select-box">
        <div className="signup-select-title">라보야 놀자</div>
        <div className="signup-select-subtitle">회원가입하기</div>

        {/* 일반 회원가입 버튼 */}
        <button className="signup-select-button" onClick={handleNormalSignupPage}>기존 회원가입</button>

        {/* Google 회원가입 */}
        <div className="google-signup" onClick={handleGoogleSignup}>
          <img src={GoogleLogo} alt="google" className="google-icon" />
          <span className="google-text">Google로 회원가입</span>
        </div>

        {/* 로그인 안내 */}
        <div className="login-section">
          <span className="login-text">이미 계정이 있으신가요?</span>
          <a className="login-link" href="/auth/login">로그인</a>
        </div>
      </div>
    </div>
  );
};

export default SignupSelectPage;