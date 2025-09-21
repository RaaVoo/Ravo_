// 마이페이지 개인정보 수정 관련 라우트
import express from 'express';
import { 
  getUserInfoHandler, 
  updateUserInfoHandler, 
  sendEmailVerificationHandler, 
  verifyEmailCodeHandler,
  // 자녀정보 수정
  getChildrenInfoHandler,
  updateChildInfoHandler,
  deleteChildInfoHandler
} from '../controllers/MypageController.js';
import { authenticateToken } from '../middleware/AuthMiddleware.js';    // 로그인한 유저 인증 미들웨어

const router = express.Router();

// 내 정보 조회
router.get('/me', authenticateToken, getUserInfoHandler);

// 개인정보 수정
router.put('/me/profile', authenticateToken, updateUserInfoHandler);

// 이메일 인증 코드 전송
router.post('/auth/email-auth/send', async (req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => sendEmailVerificationHandler(req, res, body));
});

// 이메일 인증 코드 검증
router.post('/auth/email-auth/verify', async (req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => verifyEmailCodeHandler(req, res, body));
});

// 자녀 정보 조회
router.get('/children', authenticateToken, getChildrenInfoHandler);

// 자녀 정보 수정
router.put('/children/profile', authenticateToken, updateChildInfoHandler);

// 자녀 정보 삭제
router.delete('/children/:child_id', authenticateToken, deleteChildInfoHandler);

export default router;