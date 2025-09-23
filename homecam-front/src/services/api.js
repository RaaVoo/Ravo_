import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080', // 방금 실행된 백엔드 주소!
});

export default api;
