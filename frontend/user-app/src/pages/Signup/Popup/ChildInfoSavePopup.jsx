import React from 'react';
import './ChildInfoSavePopup.css';
import { useNavigate } from 'react-router-dom';

// 아이 정보 입력 완료시 뜨는 팝업창
const ChildInfoSavePopup = () => {
    const navigate = useNavigate();

    return (
        <div className='child-save-overlay'>
            <div className='child-save-box'>
                <button className='child-save-close'>×</button>
                <div className='child-save-content'>
                    <p className='child-save-message'>자녀 등록이 완료되었습니다.</p>
                    <button className='child-save-confirm'>확인</button>
                </div>
            </div>
        </div>
    );
};

export default ChildInfoSavePopup;