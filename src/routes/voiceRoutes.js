/**
 * 음성 리포트 관련 라우터
 */

import express from 'express';
import * as voiceController from '../controllers/voiceController.js';
const router = express.Router();

router.post('/reports', voiceController.createVoiceReport);              // POST: 음성 리포트 생성
router.get('/search', voiceController.getVoiceReportByTitle);           // GET: 음성 리포트 상세 조회(Title)
router.get('/reports-list', voiceController.getVoiceReportList);        // GET: 음성 리포트 목록 조회
router.get('/:voice_no', voiceController.getVoiceReportById);           // GET: 음성 리포트 상세 조회(ID)
router.delete('/reports-list/:voice_no', voiceController.deleteVoiceReport); // DELETE: 음성 리포트 삭제

export default router;
