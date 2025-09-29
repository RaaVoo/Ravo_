// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 메시지 컨트롤러
import {
  sendMessageController,
  getMessagesController,
  markMessageReadController,
  deleteMessageController,
  getChatDateListController,
  getChatDetailByDateController,
  deleteChatByDateController,
  searchChatMessagesController,
} from "./controllers/message.controller.js";

// 유저 컨트롤러/미들웨어
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
} from "./controllers/UserController.js";
import { authenticateToken } from "./middleware/AuthMiddleware.js";

// 도메인 라우트
import reportRoutes from "./routes/reportRoutes.js";  // 영상 레포트
import voiceRoutes from "./routes/voiceRoutes.js";    // 음성 레포트
import homecamRoutes from "./routes/HomecamRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const ALLOW_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// --- 미들웨어 ---
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);        // curl 등 무 Origin 허용(개발용)
    cb(null, ALLOW_ORIGINS.includes(origin));
  },
  credentials: true,
}));
app.use(express.json());                        // body parser

// --- 헬스체크 ---
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", server: "running" });
});

// --- 정적 서빙 (필요 시) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 로컬 절대경로 맞춰주세요
const AUDIO_DIR = "C:\\Users\\DS\\RavoProject\\ravo_emotion\\public\\audio";
app.use("/audio", express.static(AUDIO_DIR));

// --- 도메인 라우터 마운트 ---
app.use("/record", reportRoutes);
app.use("/voice", voiceRoutes);        // 음성보고서
app.use('/video', reportRoutes);       // 영상보고서
app.use("/homecam", homecamRoutes);

// --- 메시지 API ---
app.post("/messages/send", sendMessageController);
app.get("/messages", getMessagesController);
app.patch("/messages/:message_no/read", markMessageReadController);
app.delete("/messages/:message_no", deleteMessageController);
app.get("/messages/chatlist/search", searchChatMessagesController);
app.get("/messages/chatlist", getChatDateListController);
app.get("/messages/chatlist/:date", getChatDetailByDateController);
app.delete("/messages/chatlist/:date", deleteChatByDateController);

// --- 인증/유저 API ---
app.post("/auth/signup", (req, res) => userSignupHandler(req, res, JSON.stringify(req.body)));
app.post("/auth/login", (req, res) => userLoginHandler(req, res, JSON.stringify(req.body)));
app.get("/auth/id-check", (req, res) => {
  const user_id = req.query.user_id;
  if (!user_id) return res.status(400).json({ error: "user_id는 필수입니다." });
  userIdCheckHandler(req, res, user_id);
});
app.post("/auth/email-check", (req, res) => userEmailCheckHandler(req, res, JSON.stringify(req.body)));
app.patch("/auth/password", (req, res) => userChangePasswordHandler(req, res, JSON.stringify(req.body)));
app.post("/auth/email-auth/send", (req, res) => emailVerificationHandler(req, res, JSON.stringify(req.body)));
app.post("/auth/email-auth/verify", (req, res) => verifyEmailCondeHandler(req, res, JSON.stringify(req.body)));
app.post("/auth/password-auth/send", (req, res) => phoneVerificationRequestHandler(req, res, JSON.stringify(req.body)));
app.post("/auth/password-auth/verify", (req, res) => phoneVerificationCheckHandler(req, res, JSON.stringify(req.body)));
app.post("/auth/refresh", authenticateToken, (req, res) => {
  res.status(200).json({ message: `POST 요청 처리 완료, ${req.user.u_name}님`, dataReceived: req.body });
});

// --- 전역 에러 핸들러 ---
app.use((err, _req, res, _next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ message: "Server error", detail: err.message });
});

// --- 서버 시작 ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
