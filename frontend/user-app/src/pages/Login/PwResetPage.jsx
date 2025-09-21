// 비밀번호 재설정 팝업창 관련 코드
import React, { useState } from 'react';
import './PwResetPage.css';

const PwResetPage = ({ onClose, onSuccess, userId, uPhone, resetToken }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handlePasswordChange = async () => {
    //const handlePasswordChange = () => {
        // input창에 아무 값도 입력하지 않았을 때
        if (!newPassword || !confirmPassword) {
            alert("비밀번호를 입력해주세요.");
            return;
        }

        // 새로운 비밀번호 입력칸과 비밀번호 확인칸 값이 일치하지 않은 경우
        if (newPassword !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const res = await fetch('/auth/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    new_pw: newPassword,
                    u_phone: uPhone,
                    resetToken,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert('비밀번호가 변경되었습니다. 다시 로그인 해주세요.');
                onClose();
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                alert(data?.error || '비밀번호 변경에 실패했습니다.');
            }
        } catch (e) {
            alert('서버 통신 중 오류가 발생했습니다.');
        }
    }

    return (
        <div className="pwreset-overlay">
            <div className="pwreset-modal">
                <button className="pwreset-close" onClick={onClose}>×</button>
                <h2 className="pwreset-title">비밀번호 재설정</h2>

                <div className="pwreset-group">
                    <label htmlFor="newPassword">비밀번호</label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="비밀번호를 입력해주세요. (영어숫자특수문자포함된단어)"
                    />
                </div>

                <div className="pwreset-group">
                    <label htmlFor="confirmPassword">비밀번호 확인</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="비밀번호를 한번 더 입력해주세요."
                    />
                </div>

                <button className="pwreset-confirm-btn" onClick={handlePasswordChange}>비밀번호 변경</button>
            </div>
        </div>
    );
};

export default PwResetPage;