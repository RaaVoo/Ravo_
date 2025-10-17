import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import passport from 'passport';      // 구글 계정 로그인 관련 코드
import './config/passport.js';        // 구글 계정 로그인 관련 코드 (구글 전략)
import { sendMessageController } from './controllers/message.controller.js'; //메시지 전송
import { getMessagesController } from './controllers/message.controller.js'; //메시지 조회
import { markMessageReadController } from './controllers/message.controller.js'; //메시지 읽음 처리
import { deleteMessageController } from './controllers/message.controller.js'; //메시지 삭제
import { getChatDateListController } from './controllers/message.controller.js'; //대화 목록 조회
import { getChatDetailByDateController } from './controllers/message.controller.js'; //대화 상세 조회
import { deleteChatByDateController } from './controllers/message.controller.js'; //특정 날짜 대화 삭제
import { searchChatMessagesController } from './controllers/message.controller.js'; //대화 내용 검색
import { getSummaryMessagesController } from "./controllers/message.controller.js"; // 요약 조회
// User 관련 컨트롤러 함수들 불러오기
import {
  userSignupHandler,
  userLoginHandler,
  userIdCheckHandler,
  userEmailCheckHandler,
  emailVerificationHandler,
  userChangePasswordHandler,
  verifyEmailCondeHandler,
  phoneVerificationRequestHandler,
  phoneVerificationCheckHandler,
  userPasswordResetByPhoneHandler
} from './controllers/UserController.js';
import { logout } from './controllers/AuthController.js'    // 로그아웃 기능
import { authenticateToken } from './middleware/AuthMiddleware.js'; //인증 미들웨어
// const reportRoutes = require('./routes/reportRoutes.js');
// const voiceRoutes = require('./routes/voiceRoutes.js');
// //import { homecamRoutes } from './routes/HomecamRoutes.js'; //홈캠 라우트
// const homecamRoutes = require('./routes/HomecamRoutes');
import reportRoutes from "./routes/reportRoutes.js";  // 영상 레포트
import voiceRoutes from "./routes/voiceRoutes.js";    // 음성 레포트
import homecamRoutes from './routes/HomecamRoutes.js'; //홈캠 라우트
//import { getMyPage, getMyChildrenInfo } from './controllers/mypageController.js'; //마이페이지(부모 + 자녀)
import { chatbotSendController, chatbotGetController } from './controllers/chatbot.controller.js'; //문의챗봇
import videoRouter from "./routes/video.route.js"; //비디오 끌고 오기

import piCamTest from './routes/piCamTest.js';

// === [추가] 업로드 관련 의존성/설정 ===
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";

import userRoutes from './routes/UserRoutes.js';     // 회원 탈퇴, 아이디 찾기 기능 관련 라우트
import childRoutes from './routes/ChildRoutes.js';   // 자녀추가 기능 관련 라우트
import GoogleAuthRoutes from './routes/GoogleAuthRoutes.js';    // 구글 계정 로그인 관련 라우트
import cookieParser from 'cookie-parser';
import AuthRoutes from './routes/AuthRoutes.js';
import MypageRoutes from './routes/MypageRoutes.js'       // 마이페이지 '개인정보 수정' 관련 라우트
//import userRoutes from './routes/UserRoutes.js'
import { query } from './config/db.js';

const chatModes = new Map(); // key -> { manual: boolean, updatedAt: number } //챗봇 모드

const app = express();

/* ============================================================================
 * 1. 공통 미들웨어
 *    - CORS 허용 (개발용: 로컬/내부망 포트 허용)
 *    - JSON 파싱, URL 인코딩, 쿠키 파싱
 *    - Passport 초기화 (구글 계정 로그인)
 * ========================================================================== */
app.use(cors({
  origin: ['http://localhost:3000', 'http://10.207.17.0:3000', 'http://10.207.16.130:3000'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
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
// const db = require('./config/db');

app.get('/db/health', async (_req, res) => {
  try {
    const rows = await query('SELECT 1 AS ok');
    res.json({ ok: true, rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get('/ping', (_, res) => res.json({ ok: true, from: 'index.js' }));
app.get('/homecam/health', (_, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);
// 예지

app.use(bodyParser.json());

// const app = express();
app.use(express.json());

// 16. 구글 계정 로그인 관련 쿠키 파싱
app.use(cookieParser());

// passport 초기화 -> 구글 계정 로그인 관련 코드
app.use(passport.initialize());


//레포트 관련 라우터 연결
dotenv.config();
app.use('/record', reportRoutes);
app.use('/voice', voiceRoutes);


// ▶ 홈캠 관련 API 라우터 연결
//app.use('/homecam', homecamRoutes);
app.use('/homecam', authenticateToken, homecamRoutes);
app.use('/pi-cam', piCamTest);

// 12. 회원탈퇴 관련 라우터 연결 -> 여기다가는 기본 경로만 작성해줌 (나머지는 UserRoutes.js 코드 참고)
app.use('/auth', userRoutes);

// 13. 자녀추가, 자녀 정보 조회 관련 라우터 연결
app.use('/auth', childRoutes);

// 14. 아이디 찾기 관련 라우터 연결
app.use('/auth', userRoutes);

// 15. 구글 계정 로그인 관련 라우터 연결
app.use('/auth', GoogleAuthRoutes);

// 17. 쿠키의 accessToken 검증 + 사용자 최소 정보 반환
app.use('/auth', AuthRoutes);

// 18. 마이페이지 '개인정보 수정' 관련 라우터 연결
app.use('/mypage', MypageRoutes);


// 모드 조회
app.get('/chatbot/mode', (req, res) => {
  const key = String(req.query.key || 'global');
  const v = chatModes.get(key);
  res.json({ ok: true, manual: !!(v && v.manual) });
});

// 모드 변경
app.post('/chatbot/mode', (req, res) => {
  const key = String(req.body.key || 'global');
  const manual = !!req.body.manual;
  chatModes.set(key, { manual, updatedAt: Date.now() });
  res.json({ ok: true, manual });
});


app.post('/messages/send', sendMessageController); //메시지 전송
app.get('/messages', getMessagesController); //메시지 조회
app.patch('/messages/:message_no/read', markMessageReadController); //메시지 읽음 처리
app.delete('/messages/:message_no', deleteMessageController); //메시지 삭제(소프트 딜리트)
app.get('/messages/chatlist/search', searchChatMessagesController); //대화 내용 검색
app.get('/messages/chatlist', getChatDateListController); //대화 목록 조회
app.get('/messages/chatlist/:date', getChatDetailByDateController); //대화 상세 조회
app.delete('/messages/chatlist/:date', deleteChatByDateController); //특정 날짜 대화 삭제
app.get("/messages/summary", getSummaryMessagesController); //대화 내용 요약


//app.get('/mypage/me', authenticateToken, getMyPage); //마이페이지 부모 정보 조회 (여름)
//app.get('/mypage/children', authenticateToken, getMyChildrenInfo); //마이페이지 자녀 저보 조회 (여름)

app.post('/chatbot/send', chatbotSendController); // 챗봇 메시지 저장(사용자/봇 공통)
app.get('/chatbot/messages', chatbotGetController);   // 챗봇 메시지 조회 (?date=YYYY-MM-DD)


// 1. 회원가입 기능
app.post('/auth/signup', (req, res) => {
  userSignupHandler(req, res, JSON.stringify(req.body));
});

// 2. 로그인 기능
app.post('/auth/login', (req, res) => {
  userLoginHandler(req, res, JSON.stringify(req.body));
});

// 3. 아이디 중복 확인 (GET, 쿼리 파라미터 이용)
app.get('/auth/id-check', (req, res) => {
  const user_id = req.query.user_id;
  if (!user_id) {
    res.status(400).json({ error: 'user_id는 필수입니다.' });
    return;
  }
  userIdCheckHandler(req, res, user_id);
});

// 4. 이메일 중복 확인
app.post('/auth/email-check', (req, res) => {
  userEmailCheckHandler(req, res, JSON.stringify(req.body));
});

// 5. 비밀번호 변경
// app.patch('/auth/password', (req, res) => {
//   userChangePasswordHandler(req, res, JSON.stringify(req.body));
// });

// 5-1. 비밀번호 재설정 (휴대폰인증 기반)
app.patch('/auth/password', (req, res) => {
  userPasswordResetByPhoneHandler(req, res, JSON.stringify(req.body));
})

// 6. 이메일 인증코드 전송
app.post('/auth/email-auth/send', (req, res) => {
  emailVerificationHandler(req, res, JSON.stringify(req.body));
});

// 7. 이메일 인증코드 검증
app.post('/auth/email-auth/verify', (req, res) => {
  verifyEmailCondeHandler(req, res, JSON.stringify(req.body));
});

// 8. 비밀번호 찾기 - 휴대폰 인증 요청
app.post('/auth/password-auth/send', (req, res) => {
  phoneVerificationRequestHandler(req, res, JSON.stringify(req.body));
});

// 9. 비밀번호 찾기 - 휴대폰 인증 검증
app.post('/auth/password-auth/verify', (req, res) => {
  phoneVerificationCheckHandler(req, res, JSON.stringify(req.body));
});

// 10. 토큰 재발급 (인증 필요)
app.post('/auth/refresh', authenticateToken, (req, res) => {
  const data = req.body;
  res.status(200).json({
    message: `POST 요청 처리 완료, ${req.user.u_name}님`,
    dataReceived: data
  });
});

// 11. 로그아웃 관련 기능
app.post('/auth/logout', (req, res) => {
  logout(req, res);
})

//12. 회원정보 수정 (여름)
//app.put('/mypage/me/profile', authenticateToken, updateMyProfileController);

// 13. 자녀 정보 수정 (여름)
//app.put('/mypage/children/profile', authenticateToken, updateChildProfileController);

app.use("/api/videos", videoRouter);
app.use("/files", express.static("uploads")); // 로컬 파일 제공 시



app.use(cors()); // 개발 중에는 전체 허용, 배포 시에는 도메인 제한 권장

// 저장 폴더: ravo_emotion/audio_inputs
const AUDIO_DIR = path.join(process.cwd(), "ravo_emotion", "audio_inputs");
fs.mkdirSync(AUDIO_DIR, { recursive: true });

// multer 저장 전략
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, AUDIO_DIR),
  filename: (req, file, cb) => {
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const ext = path.extname(file.originalname || ".wav") || ".wav";
    cb(null, `pi_${ts}${ext}`);
  },
});
const upload = multer({ storage });

// 정적 서빙 (저장 확인용)
app.use("/audio_inputs", express.static(AUDIO_DIR));

/**
 * 파이에서 WAV 업로드 (multipart/form-data)
 * field name: "file"
 */
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, msg: "no file" });
  console.log("✅ 저장됨:", req.file.path);
  return res.json({
    ok: true,
    saved: req.file.path,
    url: `/audio_inputs/${path.basename(req.file.path)}`,
  });
});




//서버 실행
//const PORT = 3000;
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});