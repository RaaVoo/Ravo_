// 로그아웃 관련 핸들러 (ESM 방식 코드)
// AuthController.js에서 실제 로그아웃 처리 로직을 실행함
import { addToken } from '../blacklist/TokenStore.js';

export const logout = (req, res) => {
  // 클라이언트의 요청 헤더에서 Authorization을 가져옴
  const authHeader = req.headers['authorization'];

  // 헤더가 없는 경우 -> 인증 실패
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>

  // 토큰이 없는 경우 -> 에러
  if (!token) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // 토큰 블랙리스트에 추가 -> 로그아웃 기능 (무효화 된 토큰 목록으로 저장)
  addToken(token);

  return res.status(200).json({ message: '성공적으로 로그아웃 되었습니다.' });
};