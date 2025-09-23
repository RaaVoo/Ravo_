// const express = require('express');
// const router = express.Router();
// const voiceController = require('../controllers/voiceController');

// router.post('/reports', voiceController.createVoiceReport);
// router.get('/reports-list', voiceController.getVoiceReportList);
// router.get('/:voice_no', voiceController.getVoiceReportById);
// router.delete('/reports-list/:voice_no', voiceController.deleteVoiceReport);
// module.exports = router;

/**
 * 음성 리포트 관련 라우터
 */

import express from 'express';
const router = express.Router();
import * as voiceController from '../controllers/voiceController.js';

router.post('/reports', voiceController.createVoiceReport);              // POST: 음성 리포트 생성
router.get('/reports-list', voiceController.getVoiceReportList);        // GET: 음성 리포트 목록 조회
router.get('/:voice_no', voiceController.getVoiceReportById);           // GET: 음성 리포트 상세 조회
router.delete('/reports-list/:voice_no', voiceController.deleteVoiceReport); // DELETE: 음성 리포트 삭제

export default router;
