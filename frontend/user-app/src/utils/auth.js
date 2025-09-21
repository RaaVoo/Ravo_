// src/utils/auth.js
// 백엔드 로그아웃 기능을 프론트에 사용하는 코드
// Header.jsx와 MyPage.jsx에서 사용
export const callBackendLogout = async () => {
  try {
    const raw = localStorage.getItem('token');    
    const maybeBearer =
      raw && raw !== 'google' ? { Authorization: `Bearer ${raw}` } : {};  

    await fetch('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...maybeBearer },
      credentials: 'include',
    });
  } catch (e) {
    console.warn('logout request failed:', e);
  } finally {
    // 공통적으로 클라이언트 상태 정리
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
  }
};