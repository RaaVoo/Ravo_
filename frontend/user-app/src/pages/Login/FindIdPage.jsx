import React, { useState } from 'react';
import './FindIdPage.css';
//import FindIdSuccess from './Popup/FindIdSuccess';
import FindIdFailPage from './Popup/FindIdFailPage';
import FindIdSuccess from './Popup/FindIdSuccess';
import FindPwPage from './FindPwPage';

// 아이디 찾기 팝업창 페이지
const FindIdPage = ({ onClose, onOpenFindPwPage }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showSuccessPopup, setshowSuccessPopup] = useState(false);
  const [showFailPopup, setshowFailPopup] = useState(false);
  const [foundUserId, setFoundUserId] = useState('');           // 아이디 전달 위한 코드
  const [foundUserName, setFoundUserName] = useState('');       // 이름 전달 위한 코드


  // 임의의 사용자와 데이터베이스 정보 비교 (백엔드 연결 후 수정 필요)
  const handleConfirm = async () => {
    if (!name.trim() || !phone.trim()) {
      alert("이름과 휴대폰번호를 입력해주세요.");
      return;
    }

    try {
      const res = await fetch('/auth/find-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          u_name: name.trim(), 
          u_phone: phone.replace(/[^0-9]/g, '')
        }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("찾은 아이디: ", data.user_id);
        setFoundUserName(name.trimEnd());    // 이름 저장 -> 프론트에 띄우기 위함
        setFoundUserId(data.user_id);     // 찾은 아이디 저장 -> 프론트에 띄우기 위함
        setshowSuccessPopup(true);        // 아이디 찾기 성공 팝업
      } else {
        console.error(data.error);
        setshowFailPopup(true);         // 아이디 찾기 실패 팝업
      }
    } catch (error) {
      console.error("요청 실패: ", error);
      // 팝업
    }

    // const dummyUser = {
    //   name: '김동영',
    //   phone: '01012345678'
    // };

    // if (name === dummyUser.name && phone === dummyUser.phone) {
    //   setshowSuccessPopup(true);
    // } else {
    //   setshowFailPopup(true);
    // }
  }

  return (
    <div className="find-id-modal-overlay">
      <div className="find-id-modal">
        <div className="find-id-modal-close" onClick={onClose}>×</div>
        <h2 className="find-id-modal-title">아이디 찾기</h2>

        {/* 이름 입력창 */}
        <div className="find-id-modal-group">
          <label htmlFor="name">이름<span className='star-text'>*</span></label>
          <input type="text" id="name" placeholder="이름을 입력해주세요." value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        {/* 휴대폰번호 입력창 */}
        <div className="find-id-modal-group">
          <label htmlFor="phone">휴대전화번호<span className='star-text'>*</span></label>
          <input type="text" id="phone" placeholder="휴대전화번호를 입력해주세요. (- 없이 숫자만 입력)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        {/* 버튼 */}
        <div className="find-id-modal-buttons">
          <button className="find-id-modal-btn confirm" onClick={handleConfirm}>확인</button>
          <button className="find-id-modal-btn cancel" onClick={onClose}>취소</button>
        </div>
      </div>

      {/* 아이디 찾기 성공 팝업 */}
      {showSuccessPopup && 
        <FindIdSuccess 
          userId={foundUserId}
          userName={foundUserName}
          onClose={() => setshowSuccessPopup(false)}
          onOpenFindPwPage={() => {
            setshowSuccessPopup(false);
            onClose();
            onOpenFindPwPage();
          }}
        />}

      {/* 아이디 찾기 실패 팝업 */}
      {showFailPopup && <FindIdFailPage onClose={() => setshowFailPopup(false)} />}
    </div>
  );
};

export default FindIdPage;