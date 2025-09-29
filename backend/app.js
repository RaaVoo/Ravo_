// 지수의 app.js 파일
const http = require('http');
const { userSignupHandler, userLoginHandler, userIdCheckHandler, userEmailCheckHandler, userChangePasswordHandler,
  emailVerificationHandler, verifyEmailCondeHandler, phoneVerificationRequestHandler, phoneVerificationCheckHandler
 } = require('./src/controllers/UserController');
 const authenticateToken = require('./src/middleware/AuthMiddleware');

const server = http.createServer((req, res) => {
  // 1. 회원가입 기능
  if (req.method === 'POST' && req.url === '/auth/signup') {
    let body = '';                  // body 변수에 POST로 요청한 값을 저장함
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => userSignupHandler(req, res, body));
  } 

  // 2. 로그인 기능
  else if (req.method === 'POST' && req.url === '/auth/login') {
    let body = '';                  // body 변수에 POST로 요청한 값을 저장함
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => userLoginHandler(req, res, body));
  } 

  // 3. 아이디 중복 검사 기능
  else if (req.method === 'GET' && req.url.startsWith('/auth/id-check')) {
    const url = new URL(req.url, `http://${req.headers.host}`);     // 전체 url을 파싱해옴
    const user_id = url.searchParams.get('user_id');                // 전체 url에서 user_id 파라미터 값을 얻어옴

    if (!user_id) {     // user_id가 없는 경우 (입력 x인 경우)
      res.writeHead(400, { 'Content-Type' : 'application/json' });
      res.end(JSON.stringify({ error: 'user_id는 필수입니다.' }));
      return;
    }

    // user_id 값이 있으면 함수로 요청함
    userIdCheckHandler(req, res, user_id);
  } 

  // 4. 이메일 중복 검사 기능
  else if (req.method === 'POST' && req.url.startsWith('/auth/email-check')) {
    let body = '';
    req.on('data', chunk => { body += chunk });     // 요청으로 들어온 본문(body)을 한 조각씩 받아서 문자열로 누적
    req.on('end', () => userEmailCheckHandler(req, res, body));     // 데이터 수신이 끝나면 
  }

  // 5. 비밀번호 변경 기능
  else if (req.method === 'PATCH' && req.url === '/auth/password') {
    let body = '';
    req.on('data', chunk => { body += chunk });     // 요청으로 들어온 본문(body)을 한 조각씩 받아서 문자열로 누적
    req.on('end', () => userChangePasswordHandler(req, res, body));
  }

  // 6. 이메일 인증코드 전송 관련 기능
  else if (req.method === 'POST' && req.url === '/auth/email-auth/send') {
    let body = '';
    req.on('data', chunk => { body += chunk });     // 요청으로 들어온 본문(body)을 한 조각씩 받아서 문자열로 누적
    req.on('end', () => emailVerificationHandler(req, res, body));
  }

  // 7. 이메일 인증코드 검증 관련 기능
  else if (req.method === 'POST' && req.url === '/auth/email-auth/verify') {
    let body = '';
    req.on('data', chunk => { body += chunk });     // 요청으로 들어온 본문(body)을 한 조각씩 받아서 문자열로 누적
    req.on('end', () => verifyEmailCondeHandler(req, res, body));
  }

  // 8. 비밀번호 찾기 관련 '휴대폰 번호 인증코드 요청' 기능
  else if (req.method === 'POST' && req.url === '/auth/password-auth/send') {
    let body = '';
    req.on('data', chunk => { body += chunk });
    req.on('end', () => phoneVerificationRequestHandler(req, res, body));
  }
  else if (req.method === 'POST' && req.url === '/auth/password-auth/verify') {
    let body = '';
    req.on('data', chunk => { body += chunk });
    req.on('end', () => phoneVerificationCheckHandler(req, res, body));
  }

  // 9. 토큰 발급 관련 기능
  else if (req.method === 'POST' && req.url === '/auth/refresh') {
    let body = '';

    req.on('data', chunk => { body += chunk.toString() });
    req.on('end', () => { authenticateToken(req, res, () => {
      // 인증 통과 후 처리
      const data = JSON.parse(body);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: `POST 요청 처리 완료, ${req.user.u_name}님`,
        dataReceived: data
      }))
    })})
  }

  // 그 외
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(3000, () => {
  console.log('http://localhost:3000로 서버 실행중');
});