import express from 'express';
import { userDeleteHandler } from '../controllers/UserController.js';

const router = express.Router();

// 실제 DB에서 사용자 삭제 => 여기다가 /auth 나머지 경로 적어줌
router.delete('/delete', userDeleteHandler);

export default router;