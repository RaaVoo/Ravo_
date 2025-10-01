//env  파일

// frontend/src/api/client.js
import axios from 'axios';

const baseURL = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

const client = axios.create({
  baseURL,
  withCredentials: false,   // 쿠키 안 쓸 거면 false 권장
});

export default client;
