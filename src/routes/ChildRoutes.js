import express from 'express';
import { addChildHandler } from '../controllers/ChildController.js';

const router = express.Router();

// 자녀 추가 라우트
router.post('/signup/child', addChildHandler);

export default router;