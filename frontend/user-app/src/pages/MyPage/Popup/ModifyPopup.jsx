// 회원정보 수정 완료 관련 팝업창
import { useNavigate } from 'react-router-dom';
import './ModifyPopup.css';

const ModifyPopup = ({ onClose }) => {
    const navigate = useNavigate();       // 페이지 이동 함수 정의

    const handleConfirm = () => {       // 마이페이지로 이동
        navigate('/mypage');
    }

  return (
    <div className="modify-popup-overlay">
      <div className="modify-popup-box">
        <button className="modify-popup-close" onClick={onClose}>×</button>
        <div className="modify-popup-content">
          <p className="modify-popup-message">회원정보 수정이 완료되었습니다.</p>
          <button className="modify-popup-confirm" onClick={handleConfirm}>확인</button>
        </div>
      </div>
    </div>
  );
};

export default ModifyPopup;