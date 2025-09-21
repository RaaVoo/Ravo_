// 비밀번호 찾기 팝업
// src/pages/Login/FindPwPage.js
import React, { useState } from 'react';
import './FindPwPage.css';
import PwResetPage from './PwResetPage';

const FindPwPage = ({ onClose }) => {
  const [showPwReset, setShowPwReset] = useState(false);
  const [resetToken, setResetToken] = useState(null);       // 비밀번호 재설정 관련 토큰
  
  // 250813 추가
  const [userId, setUserId] = useState('');
  const [uName, setUName] = useState('');
  const [uPhone, setUPhone] = useState('');
  const [code, setCode] = useState('');

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');

  // 인증 성공 여부
  const [isVerified, setIsVerified] = useState(false);

  // 비밀번호 재설정 팝업창 열게 해줌
  const handleConfirm = (e) => {
    e.preventDefault();

    // 모든 필드 값 입력했는지 확인
    if (!userId.trim() || !uName.trim() || !uPhone.trim()) {
      alert('아이디, 이름, 휴대폰번호를 모두 입력해주세요.');
      return;
    }

    // 인증 했는지 여부 확인
    if (!isVerified) {
      alert('휴대폰번호 인증을 해주세요.');
      return;
    }

    setShowPwReset(true);   // 인증 완료 후에만 열리도록
  }

  // 250813 추가
  // 인증번호 코드 요청
  const handleSendCode = async () => {
    const id = userId.trim();
    const name = uName.trim();
    const phoneDigits = uPhone.replace(/[^0-9]/g, '');

    if (!id || !name ||!phoneDigits) {
      alert('모든 필드값을 입력해주세요.');
      return;
    }

    try {
      setSending(true);
      setMessage('');

      const res = await fetch('/auth/password-auth/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: id,
          u_name: name,
          u_phone: phoneDigits,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSent(true);
        alert('인증번호를 전송했습니다.');
      } else {
        setSent(false);
        setMessage(data?.error || '인증번호 전송에 실패했습니다.');
      }
    } catch (e) {
      setSent(false);
      setMessage('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  }

  // 인증번호 검증
  const handleVerifyCode = async () => {
    const phoneDigits = uPhone.replace(/[^0-9]/g, '');

    if (!phoneDigits || !code.trim()) {
      alert('휴대폰번호와 인증번호를 입력해주세요.');
      return;
    }

    try {
      setVerifying(true);
      setMessage('');

      const res = await fetch('/auth/password-auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          u_phone: phoneDigits,
          code: code.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('인증에 성공하였습니다.');
        setIsVerified(true);          // 인증 성공 시 true로 변경
        setResetToken(data.resetToken);     // 토큰 저장 (추가)
      } else {
        alert(data?.error || '인증 실패. 코드를 다시 입력해주세요.');
        setIsVerified(false);         // 인증 실패 시 false
      }
    } catch (e) {
      setMessage('서버 통신 중 오류가 발생했습니다.');
      setIsVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="close-button" onClick={onClose}>×</button>
        <h2 className="modal-title">비밀번호 찾기</h2>

        {/* 아이디 입력 */}
        <div className="modal-group">
          <label htmlFor="userid">아이디<span className="star-text">*</span></label>
          <input 
            type="text" 
            id="userid" placeholder="아이디를 입력해주세요." 
            value={userId}
            onChange={(e) => setUserId(e.target.value)}  
          />
        </div>

        {/* 이름 입력 */}
        <div className="modal-group">
          <label htmlFor="name">이름<span className="star-text">*</span></label>
          <input 
            type="text" 
            id="name" placeholder="이름을 입력해주세요."
            value={uName}
            onChange={(e) => setUName(e.target.value)}
          />
        </div>

        {/* 휴대전화번호 입력 */}
        <div className="modal-group">
          <label htmlFor="phone">휴대전화번호<span className="star-text">*</span></label>
          <input 
            type="text" 
            id="phone" 
            placeholder="번호를 입력해주세요. (- 없이 숫자만 입력)"
            value={uPhone}
            onChange={(e) => {
              setUPhone(e.target.value.replace(/[^0-9]/g, ''));
              setMessage('');     // 추가함
            }}
            maxLength={11}  
          />
          <button className="auth-btn" onClick={handleSendCode} disabled={sending}>인증 요청</button>
          {message && <b className='field-error' role='alert'>{message}</b>}
        </div>

        {/* 인증번호 입력창 */}
        <div className="modal-group">
          <input 
            type="text" 
            id="phone_auth" 
            placeholder="인증번호를 입력해주세요."
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            maxLength={6}  
          />
          <button className="auth-btn" onClick={handleVerifyCode} disabled={verifying || !sent}>인증 완료</button>
        </div>

        {/* 버튼 */}
        <div className="modal-buttons">
          <button className="confirm-btn" onClick={handleConfirm}>확인</button>
          <button className="cancel-btn" onClick={onClose}>취소</button>
        </div>
      </div>

      {/* 상태메세지 */}
      {/* {message && <p className='helper-text'>{message}</p>} */}

      {/* 비밀번호 재설정 팝업창 관련 내용 */}
      {/* {showPwReset && <PwResetPage onClose={() => setShowPwReset(false)} />} */}

      {/* 비밀번호 재설정 팝업창 관련 내용 */}
      {showPwReset && (
        <PwResetPage 
          onClose={() => setShowPwReset(false)}
          onSuccess={() => {            // 비밀번호 변경 성공시
            setShowPwReset(false);      // 비밀번호 재설정 팝업 닫기
            onClose();                  // 비밀번호 찾기 팝업 닫기
          }}
          userId={userId}
          uPhone={uPhone}
          resetToken={resetToken}
          />)}
    </div>
  );
};

export default FindPwPage;