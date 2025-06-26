// 로그아웃 관련 기능
import express from 'express';
import { logout } from '../controllers/AuthController.js';

const router = express.Router();

// POST /auth/logout으로 들어온 요청은 logout 함수로 처리함
router.post('/auth/logout', logout);

export default router;