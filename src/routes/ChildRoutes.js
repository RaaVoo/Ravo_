import express from 'express';
import { addChildHandler, getChildrenHandler } from '../controllers/ChildController.js';
import { authenticateToken } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// 자녀 추가 라우트
router.post('/signup/child', addChildHandler);

// 자녀 정보 조회 라우트 (250912)
router.get('/children', authenticateToken, getChildrenHandler);

export default router;