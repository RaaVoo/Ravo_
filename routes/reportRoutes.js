
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/reports/search', reportController.searchReports); // 제족 검색
router.post('/reports', reportController.createReport);
router.get('/reports/:record_no', reportController.getReportById);
router.get('/reports-list', reportController.getReportList);
router.delete('/reports-list/:record_no', reportController.deleteReport);


module.exports = router;
