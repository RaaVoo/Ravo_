// 자녀정보 수정 완료 후 뜨는 팝업
import React from 'react';
import './ChildModifyPopup.css';
import { useNavigate } from 'react-router-dom';

// 아이 정보 입력 완료시 뜨는 팝업창
const ChildModifyPopup = () => {
    const navigate = useNavigate();

    const handleConfirm = () => {
        navigate('/mypage');        // 팝업창에서 '확인' 클릭시 마이페이지로 이동
    };

    return (
        <div className='child-modify-overlay'>
            <div className='child-modify-box'>
                <button className='child-modify-close'>×</button>
                <div className='child-modify-content'>
                    <p className='child-modify-message'>자녀정보 수정이 완료되었습니다.</p>
                    <button className='child-modify-confirm' onClick={handleConfirm}>확인</button>
                </div>
            </div>
        </div>
    );
};

export default ChildModifyPopup;