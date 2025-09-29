require('dotenv').config();

module.exports = {
    secretKey: process.env.JWT_SECRETKEY,          // JWT 생성과 검증에 사용할 비밀키
    options: {
        expiresIn: '1h',     // 토큰 유효 시간
        issuer: 'graduationApp'          // 나의 앱 이름 (토큰 발급자 정보)
    }
}