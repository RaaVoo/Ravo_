
// const express = require('express');
// const router = express.Router();
// const reportController = require('../controllers/reportController');

// router.get('/reports/search', reportController.searchReports);
// router.post('/reports', reportController.createReport);
// router.get('/reports/:record_no', reportController.getReportById);
// router.get('/reports-list', reportController.getReportList);
// router.delete('/reports-list/:record_no', reportController.deleteReport);


// module.exports = router;

// 라우터 설정을 위한 express 불러오기
import express from 'express';
import { searchReports, createReport, getReportById, getReportList, deleteReport } from '../controllers/reportController.js';

const router = express.Router();

// 검색
router.get('/reports/search', searchReports);

//  생성
router.post('/reports', createReport);

// 조회
router.get('/reports/:record_no', getReportById);

// 리스트 조회
router.get('/reports-list', getReportList);

// 삭제
router.delete('/reports-list/:record_no', deleteReport);

// 라우터 내보내기
export default router;
