// AuthMiddleware.js는 인증 미들웨어로, 토큰 유무와 유효성 검사를 처리함.
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/jwtConfig');

const authenticateToken = (req, res, next) => {
  // 헤더에서 Authrization: Bearer xxx를 분리해서 xxx만 추출하도록 함
  const authHeader = req.headers['authorization'];        // Bearer Token
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {     // 토큰이 없는 경우
    res.writeHead(401, { 'ContentType': 'application/json' });
    res.end(JSON.stringify({ error: '토큰이 없습니다.' }));
    return;
  }

  // 토큰 검증 성공 시 req.user에 정보 저장 후 다음 처리로 넘김
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      res.writeHead(403, { 'ContentType': 'application/json' });
      res.end(JSON.stringify({ error: '토큰이 유효하지 않습니다.' }));
      return;
    }

    req.user = user;      // 토큰에서 추출한 사용자 정보
    next();               // 다음 핸들러로 이동
  });
};

module.exports = authenticateToken;