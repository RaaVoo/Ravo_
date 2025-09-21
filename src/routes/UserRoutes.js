import express from 'express';
import { findUserIdHandler, userDeleteHandler } from '../controllers/UserController.js';
import { authenticateToken } from '../middleware/AuthMiddleware.js';

const router = express.Router();

router.delete('/delete', authenticateToken, userDeleteHandler);         // authenticateToken 추가

// 아이디 찾기 라우트
router.post('/find-id', findUserIdHandler);

export default router;