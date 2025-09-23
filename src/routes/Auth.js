// 로그아웃 관련 기능
import express from 'express';
import { logout } from '../controllers/AuthController.js';

const router = express.Router();

// POST /auth/logout으로 들어온 요청은 logout 함수로 처리함
router.post('/auth/logout', logout);

// Refresh Token 관련 코드
router.post('/token', async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRETKEY);

    // DB에 저장된 refreshToken과 일치하는지 확인 (권장)
    const user = await findUserById(decoded.user_no);
    if (!user || user.refresh_token !== refreshToken) {
      return res.sendStatus(403);
    }

    const newAccessToken = jwt.sign(
      { user_no: user.user_no, user_id: user.user_id },
      process.env.JWT_SECRETKEY,
      { expiresIn: '15m' }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.sendStatus(403);
  }
});

export default router;