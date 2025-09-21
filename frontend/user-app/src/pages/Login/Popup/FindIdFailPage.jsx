import React from 'react';
import './FindIdFailPage.css';

// 아이디 찾기 실패 관련 팝업창 코드
const FindIdFailPage = ({ onClose }) => {
    return (
        <div className="find-id-fail-overlay">
            <div className="find-id-fail-box">
                <button className="find-id-fail-close" onClick={onClose}>×</button>
                <div className="find-id-fail-content">
                    <p className="find-id-fail-message">일치하는 회원 정보가 없습니다.</p>
                    <button className="find-id-fail-confirm" onClick={onClose}>확인</button>
                </div>
            </div>
        </div>
    );
};

export default FindIdFailPage;