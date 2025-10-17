import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ChatButton = ({
  to = '/chat',                     // 이동할 경로
  icon="/images/chatbot.svg",        // 버튼 아이콘 경로
  ariaLabel = '1:1 문의하기로 이동',    // 접근성 라벨
  hideOnPaths = ['/chat'],          // 숨길 경로
  bottom = 24,                         // 아래 여백(px)
  right = 24,                          // 오른쪽 여백(px)
  size = 100,                           // 버튼 크기(px)
  bgColor = '#68D2E8',                 // 배경색
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  if (hideOnPaths.includes(location.pathname)) return null;

  const style = {
    position: 'fixed',
    bottom,
    right,
    width: size,
    height: size,
    border: 'none',
    borderRadius: '50%',
    backgroundColor: bgColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 999,
    transition: 'transform .18s ease, box-shadow .18s ease',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)'
  };

  const imgStyle = {
    width: '75%',
    height: '75%',
    objectFit: 'contain',
    pointerEvents: 'none',
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={() => navigate(to)}
      style={style}
    >
      <img src={icon} alt="" style={imgStyle} />
    </button>
  );
};

export default ChatButton;
