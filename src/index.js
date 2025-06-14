const express = require('express');
const homecamController = require('./controller/HomecamController');

const app = express();
const port = 3000;

// JSON 파싱
app.use(express.json());

// 홈캠 API 라우터 연결
app.post('/homecam/save', homecamController.saveHomecam);
app.patch('/homecam/:record_no/status', homecamController.updateHomecamStatus);
app.get('/homecam/camlist', homecamController.getHomecamList);
app.get('/homecam/camlist/search', homecamController.searchHomecam);
// 단일 삭제 (소프트 딜리트)
app.delete('/homecam/camlist/:record_no', homecamController.deleteHomecam);
// 다중 삭제 (체크박스 기반 삭제)
app.delete('/homecam/camlist', homecamController.deleteMultipleHomecams);
app.get('/homecam/camlist/:record_no', homecamController.getHomecamDetail);

// 서버 실행
app.listen(port, () => {
  console.log(`서버 실행 중: http://localhost:${port}`);
});
