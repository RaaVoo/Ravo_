const mysql = require('mysql2/promise');
require('dotenv').config();     // dotenv 설정 추가

// createPool() : DB와 연결할 커넥션 풀을 생성함
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// 다른 파일에서도 DB 연결을 사용할 수 있도록 하기 위함
module.exports = pool;