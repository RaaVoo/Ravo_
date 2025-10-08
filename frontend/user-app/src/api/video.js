// frontend/src/api/video.js
import client from './client';

// 목록 조회: GET /record/reports-list?user_no={userNo}
export const fetchVideoList = (userNo) =>
  client
    .get('/record/reports-list', { params: { user_no: userNo } })
    .then((res) => res.data);

// 상세 조회: GET /record/reports/{record_no}
export const fetchVideoDetail = (recordNo) =>
  client.get(`/record/reports/${recordNo}`).then((res) => res.data);

// 검색: GET /record/reports/search?user_no=&title=
export const searchVideoReports = ({ user_no, title }) =>
  client
    .get('/record/reports/search', { params: { user_no, title } })
    .then((res) => res.data);

// 등록: POST /record/reports  (JSON 본문)
export const createVideoReport = (payload) =>
  client
    .post('/record/reports', payload, {
      headers: { 'Content-Type': 'application/json' },
    })
    .then((res) => res.data);

// 삭제: DELETE /record/reports-list/{record_no}
export const deleteVideoReport = (recordNo) =>
  client.delete(`/record/reports-list/${recordNo}`).then((res) => res.data);
