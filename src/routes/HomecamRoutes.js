/**
 * 홈캠 관련 라우팅 설정 파일 (ESM 버전)
 * 각 요청 URL과 컨트롤러 함수 연결
 */
import { Router } from 'express';
import homecamController from '../controllers/HomecamController.js';
import worker from '../services/RecordWorker.js';

const router = Router();

// 🔎 디버그 세션
router.get('/_debug/sessions', (req, res) => {
  try {
    const active = worker.debugSessions();
    res.json({ active });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

//  POST: 홈캠 영상 저장 (녹화 시작 시 DB row 생성)
router.post('/save', homecamController.saveHomecam);

//  PATCH: 홈캠 상태 변경 (active/inactive/paused)
router.patch('/:record_no/status', homecamController.updateHomecamStatus);

//  PATCH: 홈캠 종료 메타 업데이트 (정지 버튼 시 호출, r_end/URL/썸네일/길이 저장)
router.patch('/:record_no/end', homecamController.updateEndTime);

//  GET: 홈캠 전체 영상 목록 조회 (페이징 + 날짜 필터링 지원)
router.get('/camlist', homecamController.getHomecamList);

//  GET: 홈캠 날짜 검색 (YYYY-MM-DD, 0614, 20250614 등 다양한 포맷 지원)
router.get('/camlist/search', homecamController.searchHomecam);

//  GET: 홈캠 단일 상세 조회 (record_no 기반)
//router.get('/camlist/:record_no', homecamController.getHomecamDetail);        // 원래 코드
router.get('/camlist/:record_no', homecamController.getHomecamDetailSigned);    // 잠깐 바꾼 코드

//  DELETE: 홈캠 단일 삭제 (소프트 딜리트: record_del='Y')
router.delete('/camlist/:record_no', homecamController.deleteHomecam);

//  DELETE: 홈캠 다중 삭제 (record_nos 배열 + isHardDelete 여부)
router.delete('/camlist', homecamController.deleteMultipleHomecams);

export default router;