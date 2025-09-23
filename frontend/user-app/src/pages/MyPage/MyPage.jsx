// MyPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';
import SlideMenu from '../../components/SlideMenu';
import { callBackendLogout } from '../../utils/auth';     // 로그아웃 관련 기능
import { useUser } from '../../context/UserContext';      // 전역 상태

const MyPage = ({ onLogout }) => {      // onLogout : App.js에서 로그인 상태 넘겨줌
  const navigate = useNavigate();
  const { user } = useUser();           // 전역 상태 사용 (사용자 이름 받아옴)
  const [children, setChildren] = useState([]);         // 자녀 이름 불러오기 위한 상태
  
  const [weather, setWeather] = useState('sunny');    // 초기값: 맑음 (예지)
  
  // 아이콘 매핑 (예지)
  const weatherIconMap = {
    sunny: '/icons/sun.svg',
    cloudy: '/icons/cloud.svg',
    rain: '/icons/rain.svg',
    thunder: '/icons/thunder.svg',
  };

  // 한국어 매핑 (예지)
  const prettyMap = {
    sunny: '맑음',
    cloudy: '흐림',
    rain: '비',
    thunder: '번개',
  };

  // 날씨 순환용 배열 (예지)
  const weatherOrder = ['sunny', 'cloudy', 'rain', 'thunder'];

  useEffect(() => {
    // 아이 정보 불러오기 (잠깐 추가)
    const fetchChildren = async () => {
      try {
        // const token = localStorage.getItem('token');
        const res = await fetch('/auth/children', {
          method: 'GET',
          credentials: 'include',     // 쿠키 자동 포함
          headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
          throw new Error('자녀 정보를 불러오지 못했습니다.');
        }
        const data = await res.json();
        setChildren(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchChildren();  // 여기까지 잠깐 추가 (250912)
  }, []);

  const handleLogout = async () => {
    await callBackendLogout();      // 로그아웃 함수 실행
    onLogout();
    alert("로그아웃 되었습니다.");
    navigate('/');
  };

  // -------------------------------
  // 테스트용: 버튼으로 날씨 순환 (예지)
  // -------------------------------
  const handleChangeWeather = () => {
    const currentIndex = weatherOrder.indexOf(weather);
    const nextIndex = (currentIndex + 1) % weatherOrder.length;
    setWeather(weatherOrder[nextIndex]);
  };

  // -------------------------------
  // 렌더링 (예지)
  // -------------------------------
  const iconSrc = weatherIconMap[weather] || weatherIconMap.cloudy;
  const pretty = prettyMap[weather] || '흐림';

  return (
    <div className="mypage-container">
      <SlideMenu />
      <main className="mypage-main">
        <section className="profile-section">
          <div className="profile-left">
            <img 
              src="/icons/mypage.svg"
              alt='프로필 아이콘'
              className='profile-left'
            />
            <div className="profile-info">
              <h2>{user.userName}님</h2>
              <h3>반갑습니다!</h3>
              <div className="profile-links">
                <span onClick={() => navigate('/mypage/me/profile')}>개인정보 수정</span>
                <span onClick={() => navigate('/mypage/children/profile')}>
                  아이정보 수정
                </span>
              </div>
            </div>
          </div>
          <div className="profile-actions">
            <span className="action-btn" onClick={() => navigate('/auth/delete')}>회원탈퇴</span>
            <span className="action-btn" onClick={handleLogout}>로그아웃</span>
          </div>
        </section>

        {/* 날씨 섹션 */}
        <div className="weather-section">  
          {/* 자녀 여러명인 경우 다 보이게 하는 코드 */}
          <div className="children-list">
            {children.length > 0 ? (
              children.map((child, index) => (
                <div className="weather-left" key={index}>
                  {/* <div className="weather-icon">🌞</div> */}
                  <img 
                    src={iconSrc}
                    alt={`${pretty} 아이콘`}
                    className="weather-icon"
                  />
                  <div className="weather-info">
                    <h3>{user.userName}님의</h3>
                    <h3>자녀 ‘{child.c_name}’</h3>
                    <h3>날씨는 ‘맑음’</h3>
                  </div>
                </div>
              ))
            ) : (
              <div className="weather-left">
                {/* <div className="weather-icon">🌞</div> */}
                <img 
                    src={iconSrc}
                    alt={`${pretty} 아이콘`}
                    className="weather-icon"
                  />
                <div className="weather-info">
                  <h3>{user.userName}님의</h3>
                  <h3>자녀 없음</h3>
                  <h3>날씨는 ‘맑음’</h3>
                </div>
              </div>
            )}
          </div>

          <button className="add-child" onClick={() => navigate('/mypage/children/add')}>자녀 추가하기</button>
        </div>

        {/* ✅ 테스트용 버튼 */}
          <div className="weather-test">
            <button onClick={handleChangeWeather}>
              날씨 바꾸기 (테스트)
            </button>
          </div>
      </main>
    </div>
  );
};

export default MyPage;