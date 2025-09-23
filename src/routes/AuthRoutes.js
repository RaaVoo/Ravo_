// routes/AuthRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { findUserById } from '../repositories/UserRepository.js';

const router = express.Router();

// 쿠키의 accessToken 검증 후 최소 정보 반환
router.get('/me', async (req, res) => {
  try {
    // 1) 쿠키에서 accessToken
    const cookieToken = req.cookies?.accessToken || null;

    // 2) Authorization 헤더에서 Bearer 토큰
    const hdr = req.headers['authorization'];
    const headerToken = hdr?.startsWith('Bearer ') ? hdr.split(' ')[1] : null;

    // 3) 최종 토큰 선택 (쿠키 우선)
    //const token = req.cookies?.accessToken;
    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ error: 'no token. 로그인 필요!' });
    }

    // 토큰에서 user_id만 꺼냄
    const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
    const { user_id, user_no } = decoded;

    // DB에서 최신 사용자 정보 조회 -> 토큰에 user_id가 있으므로 이걸 바탕으로 조회
    const user = await findUserById(user_id);     // decoded.user_id

    if (!user) {
        return res.status(404).json({ error: 'user not found' });
    }

    // 토큰에 어떤 필드를 넣는지에 따라 맞추기
    // 클라이언트로 최소 정보 반환 (아래는 user_no, user_id만 넣고 발급하는 현재 코드 기준)
    return res.json({
      user_no: user_no ?? user.user_no,
      user_id,       // user_id: decoded.user_id,
      u_name: user.u_name,
    });
  } catch (err) {
    console.error('/auth/me error: ', err);
    return res.status(401).json({ error: '토큰 검증 실패' });
  }
});

export default router;