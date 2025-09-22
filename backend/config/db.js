// const mysql = require('mysql2/promise');
// require('dotenv').config();     // dotenv 설정 추가

// // createPool() : DB와 연결할 커넥션 풀을 생성함
// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME
// });

// // 다른 파일에서도 DB 연결을 사용할 수 있도록 하기 위함
// module.exports = pool;\

// backend/config/db.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

// 누락되면 바로 에러 내서 빨리 알기
const required = ['DB_HOST','DB_USER','DB_NAME'];
for (const k of required) {
  if (!process.env[k]) {
    throw new Error(`[DB CONFIG] Missing env: ${k}`);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',   // 비번 없으면 빈문자
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
