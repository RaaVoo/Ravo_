// DTO 클래스와 service 레이어의 UserService를 가져옴
const UserDTO = require('../DTO/UserDTO');
const { registerUser, loginUser, changeUserPassword, sendVerificationEmail, generateVerificationCode,
    verifyEmailCode, requestPhoneVerification, verifyPhoneCode
 } = require('../service/UserService');
const { findUserById, findUserByEmail } = require('../repository/UserRepository');
const { TokenExpiredError } = require('jsonwebtoken');
//const verificationCodes = {};           // 비밀번호 찾기 인증코드 요청시 휴대폰으로 전달된 인증코드 임시로 저장해놓기 위한 공간

// userSignupHandler : HTTP 요청을 처리하는 핸들러 (회원가입)
const userSignupHandler = async (req, res, body) => {
    try {
        const userData = JSON.parse(body);              // POST 요청의 body(JSON 형식의 문자열)를 자바스크립트 객체로 변환
        const userDTO = new UserDTO(userData);          // 변환된 데이터를 DTO로 감싸줌
    
        await registerUser(userDTO);                    // 서비스 레이어 호출
    
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '회원가입 완료' }));
    } catch (err) {                                     // 서버에 오류가 발생했을 때
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '서버 오류' }));
    }
}

// userLoginHandler : 로그인 요청 처리하는 핸들러 + 이곳에 토큰을 클라이언트로 반환
const userLoginHandler = async (req, res, body) => {
    try {
        // JSON 문자열인 body를 자바스크립트 객체로 바꾼 후 -> user_id와 user_pw를 꺼냄
        const { user_id, user_pw } = JSON.parse(body);
        const { user, token } = await loginUser(user_id, user_pw);          // 로그인 후 유저 정보와 토큰 정보를 받아옴

        // 로그인 성공 -> 사용자 정보와 토큰 리턴
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: '로그인 성공',
            user_id: user.user_id,
            u_name: user.u_name,
            token           // 토큰도 로그인 성공 시 클라이언트에게 리턴하도록 추가해줌
        }));
    } catch (err) {
        // 로그인 실패 (= 에러 발생)
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

// userIdCheckHandler : 아이디 중복 체크 핸들러
const userIdCheckHandler = async (req, res, user_id) => {
    try {
        const user = await findUserById(user_id);       // 해당 아이디로 된 유저가 있는지 DB에서 조회
        const isAvailable = !user;                      // 해당 아이디가 존재하지 않으면 -> 이용 가능
        
        res.writeHead(200, { 'Content-Type' : 'application/json' });
        // isAvailable이 true이면 아이디 중복x, false이면 아이디 중복o
        res.end(JSON.stringify({ isAvailable }));
    } catch (err) {
        res.writeHead(500, { 'Content-Type' : 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

// userEmailCheckHandler : 이메일 중복 체크 핸들러
const userEmailCheckHandler = async (req, res, body) => {
    try {
        const { u_email } = JSON.parse(body);           // 요청으로 들어온 body에서 이메일을 꺼냄

        if (!u_email) {
            // 이메일을 입력하지 않은 경우 -> 400 에러
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'u_email은 필수입니다.' }));
            return;
        }
        
        const user = await findUserByEmail(u_email);            // 이메일로 사용자 검색
        const isAvailable = !user;      // 이메일이 중복되지 않는 경우 = isAvailable은 true

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ isAvailable }));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

// userChangePasswordHandler : 비밀번호 변경하는 핸들러
const userChangePasswordHandler = async(req, res, body) => {
    try {
        const { user_id, current_pw, new_pw } = JSON.parse(body);

        // id와 바꾼 후 비번, 바꾸기 전 비번이 모두 없는 경우 -> 에러
        if (!user_id || !current_pw || !new_pw) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '아이디, 비밀번호, 변경 후 비밀번호는 필수입니다.' }));
            return;
        }

        await changeUserPassword(user_id, current_pw, new_pw);      // UserService에 있는 userChangePassword에게 일을 시킴

        res.writeHead(200, { 'ContentType': 'application/json' });
        res.end(JSON.stringify({ message: '비밀번호가 변경되었습니다.' }));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

// emailVerificationHandler : 이메일 인증 코드 전송과 관련된 핸들러
const emailVerificationHandler = async(req, res, body) => {
    try {
        const { u_email } = JSON.parse(body);

        // 이메일 입력을 안 한 경우 -> 에러
        if (!u_email) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '이메일 입력은 필수입니다.' }));
            return;
        }

        const code = generateVerificationCode();        // 이메일 인증 코드 생성
        await sendVerificationEmail(u_email, code);     // 이메일로 코드 전송

        console.log(`인증 코드[${code}]가 ${u_email}로 전송되었습니다.`);

        res.writeHead(200, { 'ContentType': 'application/json' });
        res.end(JSON.stringify({ message: '인증코드가 이메일로 전송되었습니다.' }));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '메일 전송 실패' }));
    }
}

// verifyEmailCondeHandler : 이메일 인증코드를 검증하는 핸들러
const verifyEmailCondeHandler = async (req, res, body) => {
    try {
        // body에서 이메일과 인증코드를 꺼냄
        const { u_email, code } = JSON.parse(body);

        if (!u_email || !code) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '이메일과 인증코드는 필수입니다.' }));
            return;
        }

        verifyEmailCode(u_email, code);     // 인증된 코드

        res.writeHead(200, { 'ContentType': 'application/json' });
        res.end(JSON.stringify({ message: '이메일 인증 성공!' }));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

// phoneVerificationRequestHandler : 휴대폰번호로 전달되는 '인증코드 요청' (비밀번호 찾기)
const phoneVerificationRequestHandler = async (req, res, body) => {
    try {
        const { user_id, u_name, u_phone } = JSON.parse(body);

        if (!user_id || !u_name || !u_phone) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '모든 필드를 입력해주세요.' }));
            return;
        }

        await requestPhoneVerification(user_id, u_name, u_phone);

        res.writeHead(200, { 'ContentType': 'application/json' });
        res.end(JSON.stringify({ message: '인증번호를 전송했습니다.' }));
    } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
    }
}
// phoneVerificationCheckHandler : 휴대폰번호로 전달된 '인증코드 검증' 관련 핸들러 (비밀번호 찾기)
const phoneVerificationCheckHandler = async (req, res, body) => {
    try {
        const { u_phone, code } = JSON.parse(body);

        if (!u_phone || !code) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '휴대폰 번호와 인증코드를 입력해주세요.' }));
            return;
        }

        verifyPhoneCode(u_phone, code);         // 코드 검증

        res.writeHead(200, { 'ContentType': 'application/json' });
        res.end(JSON.stringify({ message: '인증 성공!' }));
    } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
    }
}

module.exports = { userSignupHandler, userLoginHandler, userIdCheckHandler, userEmailCheckHandler, userChangePasswordHandler, emailVerificationHandler,
    verifyEmailCondeHandler, phoneVerificationRequestHandler, phoneVerificationCheckHandler
};