// '탈퇴하기' 버튼 클릭시 뜨는 팝업창 관련 코드
import React from 'react';
import './UserDeletePopup.css';

const UserDeletePopup = ({ onClose, onGoHome }) => {
  return (
    <div className="user-delete-popup-overlay">
        <div className="user-delete-popup-box">
            <button className="user-delete-popup-close" onClick={onClose}>×</button>

            <div className="user-delete-popup-content">
                <p className="user-delete-popup-message">
                    탈퇴가 완료되었습니다.<br />
                    그동안 이용해주셔서 감사합니다.
                </p>
                <button className="user-delete-popup-confirm" onClick={onGoHome}>메인화면으로</button>
            </div>
        </div>
    </div>
  );
};

export default UserDeletePopup;