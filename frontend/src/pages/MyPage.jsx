// MyPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';
import SlideMenu from '../components/SlideMenu';

const MyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="mypage-container">
      <SlideMenu />
      <main className="mypage-main">
      <section className="profile-section">
  <div className="profile-left">
    <div className="profile-image" />
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

<div className="weather-section">
  <div className="weather-left">
    <div className="weather-icon">🌞</div>
    <div className="weather-info">
      <h3>BitByBit 님의</h3>
      <h3>자녀 ‘ooo’</h3>
      <h3>날씨는 ‘맑음’</h3>
    </div>
  </div>

  <button className="add-child">자녀 추가하기</button>
</div>
      </main>
    </div>
  );
};

export default MyPage;