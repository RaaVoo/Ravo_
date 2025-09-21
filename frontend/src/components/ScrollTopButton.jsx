// src/components/ScrollTopButton.jsx
import React, { useEffect, useState } from 'react';

const ScrollTopButton = ({
  icon = '/images/up-arrow.svg',
  bottom = 40,          // 페이지 아래쪽 여백
  size = 50,            // 기존보다 조금 작게 (60 → 50)
  bgColor = 'rgba(104, 210, 232, 0.8)', // 하늘색 + 투명도 0.8
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 200); // 200px 이상 스크롤 시 보이기
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  const style = {
    position: 'fixed',
    bottom,
    left: '50%',
    transform: 'translateX(-50%)',
    width: size,
    height: size,
    border: 'none',
    borderRadius: '50%',
    backgroundColor: bgColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 998,
    transition: 'transform .18s ease, box-shadow .18s ease',
    // boxShadow: '0 4px 12px rgba(0,0,0,0.2)', // 그림자도 살짝 얹기
    backdropFilter: 'blur(4px)',             // 배경 흐림 효과 (투명감 강조)
  };

  const imgStyle = {
    width: '55%',   // 버튼 작아졌으니 아이콘도 비율 조정
    height: '55%',
    objectFit: 'contain',
    pointerEvents: 'none',
  };

  return (
    <button
      type="button"
      aria-label="맨 위로 이동"
      title="맨 위로 이동"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={style}
    >
      <img src={icon} alt="" style={imgStyle} />
    </button>
  );
};

export default ScrollTopButton;
