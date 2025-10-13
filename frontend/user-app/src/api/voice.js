// frontend/src/api/voice.js
import client from './client';

// 목록 조회: GET /voice/reports-list?user_no={userNo}
export const fetchVoiceList = (userNo) =>
  client
    .get('/voice/reports-list', { params: { user_no: userNo } })
    .then((res) => res.data);

// 상세 조회: GET /voice/{voice_no}
export const fetchVoiceDetail = (voiceNo) =>
  client.get(`/voice/${voiceNo}`).then((res) => res.data);

// 검색: GET /voice/reports/search?user_no=&title=
export const searchVoiceReports = ({ user_no, title }) =>
  client
    .get('/voice/reports/search', { params: { user_no, title } })
    .then((res) => res.data);

// 등록: POST /voice/reports  (JSON 본문; 파일 업로드 아님)
export const createVoiceReport = (payload) =>
  client
    .post('/voice/reports', payload, {
      headers: { 'Content-Type': 'application/json' },
    })
    .then((res) => res.data);

// 삭제: DELETE /voice/reports-list/{voice_no}
export const deleteVoiceReport = (voiceNo) =>
  client.delete(`/voice/reports-list/${voiceNo}`).then((res) => res.data);
