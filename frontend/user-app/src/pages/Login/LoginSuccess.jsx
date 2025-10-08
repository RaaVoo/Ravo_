import { useEffect } from 'react';
import { useUser } from '../../context/UserContext';  // 251006 추가

const LoginSuccess = () => {
  const { updateUserName, updateUserNo } = useUser(); // 251006 추가

  useEffect(() => {
    // dev-proxy(CRA) 쓴다면 상대경로 그대로 OK. 쿠키 전송을 위해 credentials:'include' 필수
    fetch('/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('not ok');
        const me = await res.json();

        // Context 업데이트 (잠깐 추가 - 251006)
        updateUserName(me.u_name || me.user_id || 'Google 사용자');
        if (me.user_no != null) {
          localStorage.setItem('userNo', String(me.user_no)); // user_no 저장 (251006)
          updateUserNo(me.user_no);                           // Context에 반영 (251006)
        } else {
          localStorage.removeItem('userNo');                  // 방어
          updateUserNo('');
        }  // 여기까지

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