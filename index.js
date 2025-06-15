const express = require('express');
const app = express();
const reportRoutes = require('./routes/reportRoutes');
require('dotenv').config();
const db = require('./config/db'); // MySQL 연결

app.use(express.json());
app.use('/record', reportRoutes);

const voiceRoutes = require('./routes/voiceRoutes');
app.use('/voice', voiceRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ 서버가 포트 ${PORT}번에서 실행 중입니다`);
});
