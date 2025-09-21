import React from 'react';
import './IdCheckPopup.css';

// 아이디 중복 확인 관련 팝업창 코드
const IdCheckPopup = ({ onClose }) => {
    return (
        <div className="id-popup-overlay">
            <div className="id-popup-box">
                <button className="id-popup-close" onClick={onClose}>×</button>
                <div className="id-popup-content">
                    <p className="id-popup-message">사용 가능한 아이디입니다.</p>
                    <button className="id-popup-confirm" onClick={onClose}>확인</button>
                </div>
            </div>
        </div>
    );
};

export default IdCheckPopup;