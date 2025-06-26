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
// 토큰 검증 미들웨어 (로그인 후 사용자 인증 처리)
import jwt from 'jsonwebtoken';
import { secretKey } from '../config/jwtConfig.js';
//import { isBlacklisted } from '../blacklist/TokenStore.js';      // isBlaklisted는 토큰을 확인하는 함수

// 토큰 유효성 검사
export const authenticateToken = (req, res, next) => {
  // 헤더에서 Authorization: Bearer xxx 형식 중 'xxx'만 추출
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // 토큰이 없는 경우
  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' }); // 오타 수정: ContentType → Content-Type
    res.end(JSON.stringify({ error: '토큰이 없습니다.' }));
    return;
  }

  // 토큰 검증
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '토큰이 유효하지 않습니다.' }));
      return;
    }

    // 검증 성공 시 req.user에 사용자 정보 저장
    req.user = user;
    next(); // 다음 미들웨어 또는 라우터로 이동
  });
};
