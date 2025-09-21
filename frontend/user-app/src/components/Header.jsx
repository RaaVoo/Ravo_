// Header.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ isLoggedIn: initialLoggedIn = false, userName: initialUserName = '', onLogout = () => {}, isMainPage = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
  const [userName, setUserName] = useState(initialUserName);
  const [showMainNav, setShowMainNav] = useState(false);

  useEffect(() => {
    setIsLoggedIn(initialLoggedIn);
    setUserName(initialUserName);
  }, [initialLoggedIn, initialUserName]);

  useEffect(() => {
    const handleScroll = () => {
      const aboutSection = document.querySelector('#about');
      if (aboutSection) {
        const scrollY = window.scrollY + window.innerHeight / 2;
        setShowMainNav(scrollY >= aboutSection.offsetTop);
      }
    };

    if (isMainPage && !isLoggedIn) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isMainPage, isLoggedIn]);

  const handleNavigate = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleScrollTo = (selector) => {
    const element = document.querySelector(selector);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 60, behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  // 로그아웃 시 백엔드의 /auth/logout 호출
  const callBackendLogout = async () => {
    try {
      const raw = localStorage.getItem('token');    // 자체 로그인 시 저장했던 JWT 또는 'google' 같은 표식
      const maybeBearer =
        raw && raw !== 'google' ? { Authorization: `Bearer ${raw}` } : {};      // 구글은 쿠키로만 처리

      await fetch('/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...maybeBearer },
        credentials: 'include',   // ★ 쿠키 전송 필수(구글 로그인)
      });
    } catch (e) {
      // 실패하더라도 클라이언트 상태는 지워 UX 유지
      console.warn('logout request failed:', e);
    }
  };

  // const handleResize = () => {
  //   setIsMobile(window.innerWidth <= 768);
  //   if (window.innerWidth > 768) {
  //     setIsMobileMenuOpen(false);
  //   }
  // };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path) => location.pathname.startsWith(path);
  const isActiveStartsWith = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');   // 추가

  return (
    <header className="header">
      <div className="nav-container">
        <div className="logo-section" onClick={() => handleNavigate('/')}> 
          <img src="/images/ravo_logo.png" alt="라보 로고" className="logo-box" />
          <div className="logo-text">라보야 놀자</div>
        </div>

        {!isMobile && (
          <div className="menu-section">
            {isLoggedIn ? (
              <>
                <div className="dropdown">
                  <span className={isActive('/report') ? 'active' : ''}>분석 결과</span>
                  <div className="dropdown-balloon">
                    <div className="triangle"></div>
                    <div className="dropdown-content">
                      <div onClick={() => handleNavigate('/report/voice')}>음성 보고서</div>
                      <div onClick={() => handleNavigate('/report/video')}>영상 보고서</div>
                    </div>
                  </div>
                </div>
                <span onClick={() => handleNavigate('/chat')} className={isActive('/chat') ? 'active' : ''}>대화하기</span>
                <span onClick={() => handleNavigate('/homecam')} className={isActive('/homecam') ? 'active' : ''}>홈캠</span>
              </>
            ) : (
              showMainNav && (
                <>
                  <span onClick={() => handleScrollTo('#about')}>About</span>
                  <span onClick={() => handleScrollTo('#ravo')}>Ravo</span>
                  <span onClick={() => handleScrollTo('#function')}>Function</span>
                </>
              )
            )}
          </div>
        )}

        {!isMobile && (
          <div className="user-section">
            {isLoggedIn ? (
              <>
                <span>{userName}님</span>
                <span onClick={() => handleNavigate('/mypage')}>마이페이지</span>
                <span 
                  onClick={async () => { 
                    await callBackendLogout();              // 서버에 로그아웃 요청
                    localStorage.removeItem('token');       // 클라이언트 상태 정리
                    localStorage.removeItem('userName');
                    setIsLoggedIn(false); 
                    setUserName(''); 
                    onLogout?.();
                    navigate('/'); }}>로그아웃</span>
              </>
            ) : (
              <>
                <span onClick={() => handleNavigate('/auth/login')}>로그인</span>
                <span onClick={() => handleNavigate('/auth/signup/select')}>회원가입</span>
              </>
            )}
          </div>
        )}

        {isMobile && (
          <div className="hamburger" onClick={() => setIsMobileMenuOpen(true)}>☰</div>
        )}
      </div>

      {isMobileMenuOpen && <div className="overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {isMobileMenuOpen && (
        <div className="overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* 모바일 슬라이드 메뉴 */}
      <div className={`mobile-slide-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="menu-items">
          {isLoggedIn ? (
            <>
              <div className="slide-item" onClick={() => handleNavigate('/report/voice')}>음성 보고서</div>
              <div className="slide-item" onClick={() => handleNavigate('/report/video')}>영상 보고서</div>
              <div className="slide-item" onClick={() => handleNavigate('/chat')}>대화하기</div>
              <div className="slide-item" onClick={() => handleNavigate('/homecam')}>홈캠</div>
              <hr />
              <div className="slide-item" onClick={() => handleNavigate('/mypage')}>마이페이지</div>
              <div
                className="slide-item"
                onClick={() => {
                  setIsLoggedIn(false);
                  setUserName('');
                  onLogout();
                }}
              >
                로그아웃
              </div>
            </>
          ) : (
            <>
              {showMainNav && (
                <>
                  <div className="slide-item" onClick={() => handleScrollTo('#about')}>About</div>
                  <div className="slide-item" onClick={() => handleScrollTo('#ravo')}>Ravo</div>
                  <div className="slide-item" onClick={() => handleScrollTo('#function')}>Function</div>
                  <hr />
                </>
              )}
              <div className="slide-item" onClick={() => handleNavigate('/login')}>로그인</div>
              <div className="slide-item" onClick={() => handleNavigate('/signup')}>회원가입</div>
            </>
          )}
        </div>

        {/* 맨 아래 '가운데' 닫기 버튼 */}
        <button
          className="close-btn"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="메뉴 닫기"
        >
          <img src="/images/close.png" alt="닫기" className="close-icon" />
        </button>
      </div>
    </header>
  );
};

export default Header;