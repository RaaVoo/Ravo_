/**
 * 서버 진입점
 * express 앱 생성 + 라우터 등록 + 서버 실행
 */

const express = require('express');
const homecamRoutes = require('./routes/homecam.routes');

const app = express();
const port = 3000;

// ▶ JSON 파싱 (req.body 사용 가능하게)
app.use(express.json());

// ▶ 홈캠 관련 API 라우터 연결
app.use('/homecam', homecamRoutes);

// ▶ 서버 실행
app.listen(port, () => {
  console.log(`서버 실행 중: http://localhost:${port}`);
});
