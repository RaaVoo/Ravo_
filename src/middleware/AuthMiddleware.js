// // AuthMiddleware.js는 인증 미들웨어로, 토큰 유무와 유효성 검사를 처리함.
// const jwt = require('jsonwebtoken');
// const { secretKey } = require('../config/jwtConfig');

// export const authenticateToken = (req, res, next) => {
//   // 헤더에서 Authrization: Bearer xxx를 분리해서 xxx만 추출하도록 함
//   const authHeader = req.headers['authorization'];        // Bearer Token
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) {     // 토큰이 없는 경우
//     res.writeHead(401, { 'ContentType': 'application/json' });
//     res.end(JSON.stringify({ error: '토큰이 없습니다.' }));
//     return;
//   }

//   // 토큰 검증 성공 시 req.user에 정보 저장 후 다음 처리로 넘김
//   jwt.verify(token, secretKey, (err, user) => {
//     if (err) {
//       res.writeHead(403, { 'ContentType': 'application/json' });
//       res.end(JSON.stringify({ error: '토큰이 유효하지 않습니다.' }));
//       return;
//     }

//     req.user = user;      // 토큰에서 추출한 사용자 정보
//     next();               // 다음 핸들러로 이동
//   });
// };

// module.exports = authenticateToken;

// 토큰 검증 미들웨어 (로그인 후 사용자 인증 처리, 자녀 정보 가져오기)
import jwt from 'jsonwebtoken';
import { secretKey } from '../config/jwtConfig.js';

// 토큰 유효성 검사
export const authenticateToken = (req, res, next) => {
  let token;

  // 1. Authorization 헤더 확인
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Authorization 헤더가 없으면 쿠키에서 accessToken 확인
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  // 토큰 출력해보기
  console.log('>>> Authorization header:', req.headers['authorization']);
  console.log('>>> Cookie:', req.cookies);
  console.log('>>> 최종 사용된 토큰:', token);

  // 토큰이 없는 경우
  if (!token) {
    return res.status(401).json({ error: '토큰이 없습니다.' });
  }

  // 토큰 검증
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      console.error("JWT 검증 실패:", err.message);
      return res.status(403).json({ error: '토큰이 유효하지 않습니다.' });
    }

    console.log("Decoded JWT:", user);

    // 검증 성공 시 req.user에 사용자 정보 저장
    req.user = user;
    next();
  });
};