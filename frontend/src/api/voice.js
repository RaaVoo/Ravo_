// frontend/src/api/voice.js
import client from './client';

// 목록 조회
export const fetchVoiceList = (userNo) =>
    client
    .get('/voice/reports-list', { params: { user_no: userNo } })
    .then((res) => res.data);

// 상세 조회
export const fetchVoiceDetail = (voiceNo) =>
    client.get(`/voice/${voiceNo}`).then((res) => res.data);

// 검색 (필요 시)
export const searchVoiceReports = (q) =>
    client.get('/voice/reports/search', { params: q }).then((res) => res.data);

// 등록(업로드)
export const createVoiceReport = (formData) =>
    client.post('/voice/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data);

// 삭제
export const deleteVoiceReport = (voiceNo) =>
    client.delete(`/voice/reports-list/${voiceNo}`).then((res) => res.data);
