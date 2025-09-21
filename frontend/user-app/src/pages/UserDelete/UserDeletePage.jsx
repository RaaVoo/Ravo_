// 회원 탈퇴하기 관련 코드
import React, { useState, useEffect } from 'react';
import './UserDeletePage.css';
import UserDeletePopup from './Popup/UserDeletePopup';

const UserDeletePage = () => {
  const [agreed, setAgreed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);    // 탈퇴 후 뜨는 팝업창
  const [userName, setUserName] = useState('');         // 사용자 이름 상태 추가

  // user_id를 localStorage에서 가져오기 -> 추가함 (250908)
  const userId = 
    localStorage.getItem('userId') || localStorage.getItem('user_id') || '';

  // 로그인 시 localStorage에서 userName 가져오기
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  // '뒤로가기' 버튼 클릭 후 작동 함수 -> 마이페이지로 돌아가도록 수정해야 함 (전체 연결 후)
  const handleBack = () => {
    window.history.back();
  };

  // '회원탈퇴' 버튼 클릭 후 뜨는 팝업창 닫기
  const closePopup = () => {
    setShowPopup(false);
  };

  // '회원탈퇴' 후 메인 화면으로 이동
  const goHome = () => {
    window.location.href="/";
  };

  const handleDelete = async () => {
    if (!agreed) {
      alert('⚠️ 회원 탈퇴 유의사항에 동의해주세요.');
      return;
    }

    // 1) 탈퇴 전 확인창
    const ok = window.confirm(`${userName}님, 정말로 탈퇴하시겠습니까?`);
    if (!ok) {
      return;
    }

    try {
      const resp = await fetch('/auth/delete', {
        method: 'DELETE',
        credentials: 'include',       // 쿠키 값만 보내도록 설정
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        alert(data?.error || '회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      // 성공 시 localStorage 정리
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      localStorage.removeItem('user_id');

      setShowPopup(true);
    } catch (e) {
      console.error('회원 탈퇴 요청 오류:', e);
      alert('네트워크 오류로 탈퇴에 실패했습니다. 인터넷 연결을 확인해주세요.');
    }
    

    // 실제 탈퇴 API 호출 코드 삽입 가능 -> 원래 코드
    //window.location.href = '/user-delete-complete';
    //setShowPopup(true);
  };

  return (
    <div className="delete-page-container">
      <div className="delete-box">
        <div className="delete-content">
          <h1 className="brand-title">라보야 놀자</h1>
          <h2 className="page-title">회원탈퇴하기</h2>
          <p className="goodbye-msg">{userName ? `${userName}님,` : ''}<br/>정말 탈퇴하시겠습니까?</p>

          <h3 className="notice-title">탈퇴 시 주의사항</h3>
          <p className="notice-text">
            ⚠&nbsp;&nbsp;탈퇴 시 계정 정보 및 아이 정보가 모두 삭제되며 복구할 수 없습니다.<br/>
            ⚠&nbsp;&nbsp;진행 중인 서비스가 있을 경우 모두 종료됩니다.<br/>
            ⚠&nbsp;&nbsp;탈퇴 후 동일 계정으로 다시 가입이 불가능할 수 있습니다.
          </p>

          <div className="agree-checkbox">
            <input type="checkbox" id="agree" checked={agreed} onChange={() => setAgreed(!agreed)} />
            <label htmlFor="agree">회원 탈퇴 유의사항을 확인하였으며 동의합니다.</label>
          </div>

          <div className="delete-buttons">
            <button className="delete-btn" onClick={handleDelete}>탈퇴하기</button>
            <button className="back-btn" onClick={handleBack}>돌아가기</button>
          </div>
        </div>
      </div>

      {/* '탈퇴하기' 버튼 클릭 후 팝업 렌더링 */}
      {showPopup && ( <UserDeletePopup onClose={closePopup} onGoHome={goHome} /> )}
    </div>
  );
};

export default UserDeletePage;