import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({
  isLoggedIn: initialLoggedIn = false,
  userName: initialUserName = '',
  onLogout = () => {},
  isMainPage = false,
}) => {
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

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isActiveExact = (path) => location.pathname === path;
  const isActiveStartsWith = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

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
                  <span className={isActiveStartsWith('/report') ? 'active' : ''}>
                    분석 결과
                  </span>
                  <div className="dropdown-balloon">
                    <div className="triangle"></div>
                    <div className="dropdown-content">
                      <div onClick={() => handleNavigate('/report/voice')}>음성 보고서</div>
                      <div onClick={() => handleNavigate('/report/video')}>영상 보고서</div>
                    </div>
                  </div>
                </div>
                <span
                  onClick={() => handleNavigate('/messages')}
                  className={isActiveExact('/messages') ? 'active' : ''}
                >
                  대화하기
                </span>
                <span
                  onClick={() => handleNavigate('/homecam')}
                  className={isActiveExact('/homecam') ? 'active' : ''}
                >
                  홈캠
                </span>
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
                  onClick={() => {
                    setIsLoggedIn(false);
                    setUserName('');
                    onLogout();
                  }}
                >
                  로그아웃
                </span>
              </>
            ) : (
              <>
                <span onClick={() => handleNavigate('/login')}>로그인</span>
                <span onClick={() => handleNavigate('/signup')}>회원가입</span>
              </>
            )}
          </div>
        )}

        {isMobile && (
          <div className="hamburger" onClick={() => setIsMobileMenuOpen(true)}>
            ☰
          </div>
        )}
      </div>

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
              <div className="slide-item" onClick={() => handleNavigate('/messages')}>대화하기</div>
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
