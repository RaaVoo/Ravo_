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
// User 관련 컨트롤러 함수들 불러오기
import {
  userSignupHandler,
  userLoginHandler,
  userIdCheckHandler,
  userEmailCheckHandler,
  userChangePasswordHandler,
  emailVerificationHandler,
  verifyEmailCondeHandler,
  phoneVerificationRequestHandler,
  phoneVerificationCheckHandler,
  userPasswordResetByPhoneHandler
} from './controllers/UserController.js';
import { logout } from './controllers/AuthController.js'    // 로그아웃 기능
import { authenticateToken } from './middleware/AuthMiddleware.js'; //인증 미들웨어
// import reportRoutes from './routes/reportRoutes.js'; //레포트 라우트
// import voiceRoutes from './routes/voiceRoutes.js'; //레포트 라우트
// const reportRoutes = require('./routes/reportRoutes.js');
// const voiceRoutes = require('./routes/voiceRoutes.js');
// //import { homecamRoutes } from './routes/HomecamRoutes.js'; //홈캠 라우트
// const homecamRoutes = require('./routes/HomecamRoutes');
import reportRoutes from './routes/reportRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import homecamRoutes from './routes/HomecamRoutes.js'; //홈캠 라우트

import userRoutes from './routes/UserRoutes.js';     // 회원 탈퇴, 아이디 찾기 기능 관련 라우트
import childRoutes from './routes/ChildRoutes.js';   // 자녀추가 기능 관련 라우트
import GoogleAuthRoutes from './routes/GoogleAuthRoutes.js';    // 구글 계정 로그인 관련 라우트
import cookieParser from 'cookie-parser';
import AuthRoutes from './routes/AuthRoutes.js';
import MypageRoutes from './routes/MypageRoutes.js'       // 마이페이지 '개인정보 수정' 관련 라우트

const app = express();
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
app.use('/homecam', homecamRoutes);

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


app.post('/messages/send', sendMessageController); //메시지 전송
app.get('/messages', getMessagesController); //메시지 조회
app.patch('/messages/:message_no/read', markMessageReadController); //메시지 읽음 처리
app.delete('/messages/:message_no', deleteMessageController); //메시지 삭제(소프트 딜리트)
app.get('/messages/chatlist/search', searchChatMessagesController); //대화 내용 검색
app.get('/messages/chatlist', getChatDateListController); //대화 목록 조회
app.get('/messages/chatlist/:date', getChatDetailByDateController); //대화 상세 조회
app.delete('/messages/chatlist/:date', deleteChatByDateController); //특정 날짜 대화 삭제

//app.get('/mypage/me', authenticateToken, getMyPage); //마이페이지 부모 정보 조회 (여름)
//app.get('/mypage/children', authenticateToken, getMyChildrenInfo); //마이페이지 자녀 저보 조회 (여름)

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

//서버 실행
//const PORT = 3000;
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});