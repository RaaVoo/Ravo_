import { useEffect } from 'react';

const LoginSuccess = () => {
  useEffect(() => {
    // dev-proxy(CRA) 쓴다면 상대경로 그대로 OK. 쿠키 전송을 위해 credentials:'include' 필수
    fetch('/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('not ok');
        const me = await res.json();

        // 헤더는 localStorage 기반이므로, 표시용 정보를 저장
        localStorage.setItem('token', 'google');          // 임의 표식(실제 토큰은 httpOnly 쿠키)
        // 이름을 토큰에 넣었으면 그걸 쓰고, 아니면 user_id를 이름처럼 사용
        localStorage.setItem('userName', me.u_name || me.user_id || 'Google 사용자');

        // 메인으로 이동하면서 새로고침
        window.location.href = '/';
      })
      .catch(() => {
        window.location.href = '/auth/login?google=fail';
      });
  }, []);

  return <div>구글 로그인 처리 중...</div>;
}

export default LoginSuccess;