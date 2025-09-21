import React from "react";
import './FindIdSuccess.css';
import CheckLogo from './blue_check.png';

// 아이디 찾기 성공 팝업창 페이지
const FindIdSuccess = ({ onClose, onOpenFindPwPage, userId, userName }) => {
    const handleMoveLogin = () => {
        //onClose();      // 떠있는 팝업창들 닫기
        
        // 새로고침 효과
        setTimeout(() => {
            window.location.href = "/auth/login";
        }, 10);
    };

    return (
        <div className="find-id-success-overlay">
            <div className="find-id-success-box">
                <button className="find-id-success-close" onClick={onClose}>×</button>
                
                {/* 글자 */}
                <div>
                    <img src={CheckLogo} alt="체크 이미지" className="check-icon" />
                    <b>아이디 찾기 완료</b>
                    <p>{userName}님의 아이디는 <strong>{userId}</strong>입니다.</p>
                </div>

                {/* 버튼 */}
                <div className="find-success-btns">
                    <button className="go-login-btn" onClick={handleMoveLogin}>로그인</button>
                    <button className="go-find-pw" onClick={onOpenFindPwPage}>비밀번호 찾기</button>
                </div>
            </div>
        </div>
    );
};

export default FindIdSuccess;