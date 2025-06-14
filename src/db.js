const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root1234!', // 예: Ravo1234!
  database: 'ravo_db'
});

module.exports = pool;
