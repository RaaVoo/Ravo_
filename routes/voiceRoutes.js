const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');

router.post('/reports', voiceController.createVoiceReport);
router.get('/reports-list', voiceController.getVoiceReportList);
router.get('/search', voiceController.getVoiceReportByTitle); //제목 검색
router.get('/:voice_no', voiceController.getVoiceReportById);
router.delete('/reports-list/:voice_no', voiceController.deleteVoiceReport);

module.exports = router;
