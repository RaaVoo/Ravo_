const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root1234!', // ← 본인이 설정한 비밀번호로 바꿔주세요
      database: 'ravo_db'
    });

    const [rows] = await connection.execute('SELECT NOW() AS now');
    console.log('✅ DB 연결 성공! 현재 시간:', rows[0].now);

    await connection.end();
  } catch (err) {
    console.error('❌ DB 연결 실패:', err.message);
  }
})();
