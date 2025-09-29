// src/routes/reportRoutes
// backend/src/routes/video.routes.js
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

// 상세 조회(파라미터명 통일: video_no)
router.get('/reports/:video_no', getReportById);

// 리스트
router.get('/reports-list', getReportList);

// 삭제
router.delete('/reports-list/:video_no', deleteReport);

export default router;
