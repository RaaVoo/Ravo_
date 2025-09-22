// // backend/index.js
// import express from "express";
// import piCamTest from "./routes/piCamTest.js";
// //const express = require('express');
// const app = express();
// require('dotenv').config();

// app.use(express.json());

// // 헬스체크 (바로 확인용)
// app.get('/ping', (req, res) => res.json({ ok: true, from: 'index.js' }));
// app.get('/homecam/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// // ✅ 라우트 마운트
// const homecamRoutes = require('./routes/HomecamRoutes'); // 홈캠
// app.use('/homecam', homecamRoutes);

// const reportRoutes = require('./routes/reportRoutes');   // 리포트
// app.use('/record', reportRoutes);

// const voiceRoutes = require('./routes/voiceRoutes');     // 보이스
// app.use('/voice', voiceRoutes);

// app.use("/pi-cam", piCamTest); // ★ 파이썬이 보내는 경로와 반드시 일치


// // 서버 시작
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => console.log(`API running on ${PORT}`));


// // backend/index.js  (CommonJS)
// const express = require('express');
// const dotenv = require('dotenv');

// const piCamTest = require('./routes/piCamTest');      // ← .js 확장자 없어도 CJS OK
// const homecamRoutes = require('./routes/HomecamRoutes');
// const reportRoutes = require('./routes/reportRoutes');
// const voiceRoutes = require('./routes/voiceRoutes');

// dotenv.config();

// // index.js에서 라우트들 위에 임시로
// const db = require('./config/db');
// app.get('/db/health', async (_, res) => {
//   try {
//     const [rows] = await db.query('SELECT 1 AS ok');
//     res.json({ ok: true, rows });
//   } catch (e) {
//     console.error('DB health error:', e);
//     res.status(500).json({ ok: false, error: String(e) });
//   }
// });

// const app = express();
// app.use(express.json());

// // 헬스체크 (바로 확인용)
// app.get('/ping', (req, res) => res.json({ ok: true, from: 'index.js' }));
// app.get('/homecam/health', (req, res) =>
//   res.json({ ok: true, time: new Date().toISOString() })
// );

// // ✅ 라우트 마운트
// app.use('/homecam', homecamRoutes);  // 홈캠
// app.use('/record', reportRoutes);    // 리포트
// app.use('/voice', voiceRoutes);      // 보이스
// app.use('/pi-cam', piCamTest);       // 파이캠 업로드 엔드포인트

// // 서버 시작
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => console.log(`API running on ${PORT}`));

// backend/index.js

// backend/index.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const piCamTest = require('./routes/piCamTest');
const homecamRoutes = require('./routes/HomecamRoutes');
const reportRoutes = require('./routes/reportRoutes');
const voiceRoutes = require('./routes/voiceRoutes');

dotenv.config();

const app = express();

/* ----------------------------- 기본 미들웨어 ----------------------------- */
// CORS: 프론트(3000)에서 백엔드(8080)로 호출 허용
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://10.207.17.0:3000'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ----------------------------- 파일 정적 서빙 ----------------------------- */
// 레코딩 파일 저장 디렉토리 (RecordWorker와 동일 경로 사용)
const MEDIA_TMP = process.env.MEDIA_TMP || path.join(process.cwd(), 'media-tmp');

// /media/* 정적 제공 시 헤더 보정 (mp4는 인라인 재생 + Range 허용)
app.use(
  '/media',
  express.static(MEDIA_TMP, {
    setHeaders(res, filePath) {
      if (filePath.toLowerCase().endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      if (/\.(jpg|jpeg|png)$/i.test(filePath)) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
    },
  })
);

/* --------------------------- 스트리밍(시킹) 라우트 --------------------------- */
/**
 * /media/stream/:file
 * - 브라우저가 Range(부분 전송)로 요청하면 206으로 쪼개서 응답
 * - 파일명 정규화(디렉터리 탈출 방지), 잘못된 Range=416 처리
 */
app.get('/media/stream/:file', (req, res) => {
  // 파일명 정규화 (../ 방지)
  const safeName = path.basename(decodeURIComponent(req.params.file));
  const filePath = path.join(MEDIA_TMP, safeName);

  if (!fs.existsSync(filePath)) {
    return res.sendStatus(404);
  }

  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  // CORS & 캐시 정책(필요 시 조정)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  // Range 헤더가 없으면 전체 전송
  if (!range) {
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', stat.size);
    return fs.createReadStream(filePath).pipe(res);
  }

  // Range 206 처리
  const CHUNK = 1 * 1024 * 1024; // 1MB
  const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
  const start = parseInt(startStr, 10);

  if (!Number.isFinite(start) || start >= stat.size) {
    // 잘못된 Range → 416
    res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
    return res.end();
  }

  const end = endStr ? parseInt(endStr, 10) : Math.min(start + CHUNK, stat.size - 1);

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': end - start + 1,
    'Content-Type': 'video/mp4',
    'Content-Disposition': 'inline',
  });

  fs.createReadStream(filePath, { start, end }).pipe(res);
});

/* -------------------------------- 헬스체크 -------------------------------- */
const db = require('./config/db');

app.get('/db/health', async (_, res) => {
  try {
    const [rows] = await db.query('SELECT USER() user, DATABASE() db, @@port port');
    res.json({ ok: true, mysql: rows[0] });
  } catch (e) {
    console.error('DB health error:', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get('/ping', (_, res) => res.json({ ok: true, from: 'index.js' }));
app.get('/homecam/health', (_, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

/* -------------------------------- 라우트 --------------------------------- */
app.use('/homecam', homecamRoutes);
app.use('/record', reportRoutes);
app.use('/voice', voiceRoutes);
app.use('/pi-cam', piCamTest);

/* ------------------------------- 서버 시작 ------------------------------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API running on ${PORT}`);
  console.log(`MEDIA_TMP: ${MEDIA_TMP} (served at /media and /media/stream)`);
});
