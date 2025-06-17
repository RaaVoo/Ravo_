
// /**
//  * 홈캠 관련 라우팅 설정 파일
//  * 각 요청 URL과 컨트롤러 함수 연결
//  */

// const express = require('express');
// const router = express.Router();
// const homecamController = require('../controllers/homecam.controller');

// //  POST: 홈캠 영상 저장
// router.post('/save', homecamController.saveHomecam);

// //  PATCH: 홈캠 상태 변경 (active/inactive/paused)
// router.patch('/:record_no/status', homecamController.updateHomecamStatus);

// //  GET: 홈캠 전체 영상 목록 조회 (페이징 + 날짜 필터 가능)
// router.get('/camlist', homecamController.getHomecamList);

// //  GET: 홈캠 날짜 검색 (YYYY-MM-DD, 0614 등 다양한 포맷 지원)
// router.get('/camlist/search', homecamController.searchHomecam);

// //  GET: 홈캠 단일 상세 조회
// router.get('/camlist/:record_no', homecamController.getHomecamDetail);

// //  DELETE: 홈캠 단일 삭제 (소프트 딜리트)
// router.delete('/camlist/:record_no', homecamController.deleteHomecam);

// //  DELETE: 홈캠 다중 삭제 (record_nos + isHardDelete)
// router.delete('/camlist', homecamController.deleteMultipleHomecams);

// module.exports = router;

/**
 * 홈캠 관련 라우팅 설정 파일
 * 각 요청 URL과 컨트롤러 함수 연결
 */

import express from 'express';
import * as homecamController from '../controllers/HomecamController.js';

const router = express.Router();

//  POST: 홈캠 영상 저장
router.post('/save', homecamController.saveHomecam);

//  PATCH: 홈캠 상태 변경 (active/inactive/paused)
router.patch('/:record_no/status', homecamController.updateHomecamStatus);

//  GET: 홈캠 전체 영상 목록 조회 (페이징 + 날짜 필터 가능)
router.get('/camlist', homecamController.getHomecamList);

//  GET: 홈캠 날짜 검색 (YYYY-MM-DD, 0614 등 다양한 포맷 지원)
router.get('/camlist/search', homecamController.searchHomecam);

//  GET: 홈캠 단일 상세 조회
router.get('/camlist/:record_no', homecamController.getHomecamDetail);

//  DELETE: 홈캠 단일 삭제 (소프트 딜리트)
router.delete('/camlist/:record_no', homecamController.deleteHomecam);

//  DELETE: 홈캠 다중 삭제 (record_nos + isHardDelete)
router.delete('/camlist', homecamController.deleteMultipleHomecams);

export default router;
