// MyPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';
import SlideMenu from '../components/SlideMenu';

// 아이콘 매핑
const weatherIconMap = {
  sunny: '/icons/sun.svg',
  cloudy: '/icons/cloud.svg',
  rain: '/icons/rain.svg',
  thunder: '/icons/thunder.svg',
};

// 한국어 매핑
const prettyMap = {
  sunny: '맑음',
  cloudy: '흐림',
  rain: '비',
  thunder: '번개',
};

// 날씨 순환용 배열
const weatherOrder = ['sunny', 'cloudy', 'rain', 'thunder'];

export default function MyPage() {
  const navigate = useNavigate();

  // -------------------------------
  // 1) 프론트 전용 mock 데이터
  // -------------------------------
  const [childName, setChildName] = useState('ooo');
  const [weather, setWeather] = useState('sunny'); // 초기값: 맑음

  // -------------------------------
  // 2) 나중에 백엔드 연결 시 (주석 해제)
  // -------------------------------
  /*
  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE}/emotion/latest?childId=ooo`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.childName) setChildName(data.childName);
        if (data.weather) setWeather(data.weather.toLowerCase());
      } catch (err) {
        console.error("날씨/감정 불러오기 실패:", err);
      }
    }
    fetchWeather();
  }, []);
  */

  // -------------------------------
  // 테스트용: 버튼으로 날씨 순환
  // -------------------------------
  const handleChangeWeather = () => {
    const currentIndex = weatherOrder.indexOf(weather);
    const nextIndex = (currentIndex + 1) % weatherOrder.length;
    setWeather(weatherOrder[nextIndex]);
  };

  // -------------------------------
  // 렌더링
  // -------------------------------
  const iconSrc = weatherIconMap[weather] || weatherIconMap.cloudy;
  const pretty = prettyMap[weather] || '흐림';

  return (
    <div className="mypage-container">
      <SlideMenu />
      <main className="mypage-main">

        {/* 프로필 섹션 */}
        <section className="profile-section">
          <div className="profile-left">
            <img 
              src="/icons/mypage.svg" 
              alt="프로필 아이콘" 
              className="profile-image" 
            />
            <div className="profile-info">
              <h2>BitByBit 님</h2>
              <h3>반갑습니다!</h3>
              <div className="profile-links">
                <span>개인정보 수정</span>
                <span onClick={() => navigate('/edit-child')}>
                  아이정보 수정
                </span>
              </div>
            </div>
          </div>
          <div className="profile-actions">
            <span className="action-btn">회원탈퇴</span>
            <span className="action-btn">로그아웃</span>
          </div>
        </section>

        {/* 날씨 섹션 */}
        <div className="weather-section">
          <div className="weather-left">
            <img
              src={iconSrc}
              alt={`${pretty} 아이콘`}
              className="weather-icon"
            />
            <div className="weather-info">
              <h3>BitByBit 님의</h3>
              <h3>자녀 ‘{childName}’</h3>
              <h3>날씨는 ‘{pretty}’</h3>
            </div>
          </div>

          <button className="add-child" onClick={() => navigate('/edit-child')}>
            자녀 추가하기
          </button>
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
}
