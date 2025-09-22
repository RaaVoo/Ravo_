import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SlideMenu.css';

const SlideMenu = () => {
  const navigate = useNavigate();
  return (
    <aside className="side-menu">
      <h2 className="menu-title">My Page</h2>

      <div className="menu-group">
        <h3 className="menu-main">솔루션 보고서</h3>
        <p className="menu-sub">음성 보고서 모아보기</p>
        <p className="menu-sub">영상 보고서 모아보기</p>
      </div>

      <div className="menu-group">
        <h3 className="menu-main">과거 모아보기</h3>
        {/* <p className="menu-sub">녹화된 영상 목록</p> */}
        <p
          className="menu-sub"
          onClick={() => navigate('/homecam/camlist')}
          style={{ cursor: 'pointer' }}
        >
          녹화된 영상 목록
        </p>
        <p className="menu-sub">대화 모아보기</p>
      </div>

      <div className="menu-group">
        <h3 className="menu-main">고객센터</h3>
        <p
          className="menu-sub"
          onClick={() => navigate('/faq')}
          style={{ cursor: 'pointer' }}
        >
          자주 묻는 질문 F&Q
        </p>
        <p
          className="menu-sub"
          onClick={() => navigate('/chatbot')}
          style={{ cursor: 'pointer' }}
        >
          1:1 문의 (챗봇)
        </p>
      </div>
    </aside>
  );
};

export default SlideMenu;
