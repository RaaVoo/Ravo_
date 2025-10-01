// frontend/src/api/video.js
import client from './client';

// 목록 조회
export const fetchVideoList = (userNo) =>
  client
    .get('/video/reports-list', { params: { user_no: userNo } })
    .then((res) => res.data);

// 상세 조회
export const fetchVideoDetail = (videoNo) =>
  client.get(`/video/reports/${videoNo}`).then((res) => res.data);

// 검색
export const searchVideoReports = (q) =>
  client.get('/video/reports/search', { params: q }).then((res) => res.data);

// 등록
export const createVideoReport = (formData) =>
  client
    .post('/video/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);

// 삭제
export const deleteVideoReport = (videoNo) =>
  client.delete(`/video/reports-list/${videoNo}`).then((res) => res.data);
