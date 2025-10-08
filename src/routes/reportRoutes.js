// src/routes/reportRoutes.js
import express from 'express';
import {
  searchReports,     
  createReport,      
  getReportById,     
  getReportList,     
  deleteReport,     
} from '../controllers/reportController.js';

const router = express.Router();

// 검색
router.get('/reports/search', searchReports);

// 생성
router.post('/reports', createReport);

// 상세 (파라미터: record_no)
router.get('/reports/:record_no', getReportById);

// 목록 (쿼리: user_no[, page, pageSize])
router.get('/reports-list', getReportList);

// 삭제 (파라미터: record_no)
router.delete('/reports-list/:record_no', deleteReport);

export default router;
