import React from 'react';
import './JoinPopup.css';
import { useNavigate } from 'react-router-dom';

// 회원가입 완료 관련 팝업창
const JoinPopup = ({ onClose, onConfirm }) => {
    //const navigate = useNavigate();       // 페이지 이동 함수 정의

    const handleConfirm = () => {       // 자녀 정보 입력 페이지로 이동
        //navigate('/auth/signup/child');
        onConfirm();
    }

  return (
    <div className="join-popup-overlay">
      <div className="join-popup-box">
        <button className="join-popup-close" onClick={onClose}>×</button>
        <div className="join-popup-content">
          <p className="join-popup-message">회원가입이 완료되었습니다.</p>
          <button className="join-popup-confirm" onClick={handleConfirm}>확인</button>
        </div>
      </div>
    </div>
  );
};

export default JoinPopup;