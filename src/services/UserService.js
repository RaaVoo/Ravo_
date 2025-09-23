// // 서비스에는 실제로 처리할 로직에 대해서 작성을 해줌
// const UserDTO = require('../DTO/UserDTO');
// const { insertUser, findUserById, updateUserPassword, findUserByNamePhone } = require('../repository/UserRepository');
// const nodemailer = require('nodemailer');              // node.js에서 이메일 전송을 위한 라이브러리
// //const axios = require('axios');     // 외부 API 호출을 위한 HTTP 클라이언트 (SMS API 호출에 사용 -> 실제로 사용할 때)
// const jwt = require('jsonwebtoken');        // 토큰 사용하기 위함
// const { secretKey, options } = require('../config/jwtConfig');
// require('dotenv').config();         // .env 파일에 있는 내용 가져와서 사용

// // 회원가입 기능 (등록)
// export const registerUser = async (UserDTO) => {
//     await insertUser(UserDTO);
// };

// // 로그인 기능 + 토큰 생성 기능 추가
// export const loginUser = async (user_id, user_pw) => {
//     // user_id로 사용자를 찾아서 user에 넣어줌
//     const user = await findUserById(user_id);

//     // 사용자가 존재하지 않는 경우 ( =user_id가 틀린 경우 )
//     if (!user) {
//         throw new Error('존재하지 않는 사용자입니다!');
//     }

//     // 입력한 비밀번호가 사용자의 비밀번호와 일치하지 않는 경우
//     if (user.user_pw !== user_pw) {
//         throw new Error('비밀번호가 일치하지 않습니다.');
//     }

//     const payload = {               // payload : 토큰에 담길 데이터를 말함
//         user_id: user.user_id,
//         u_name: user.u_name
//     };
//     const token = jwt.sign(payload, secretKey, options);        // jwt.sign() : 토큰 생성

//     return { user, token };        // 로그인 성공 시 사용자 정보 + 토큰 리턴
// };

// // 비밀번호 변경 기능
// export const changeUserPassword = async (user_id, current_pw, new_pw) => {
//     const user = await findUserById(user_id);       // user_id의 사용자 정보 조회

//     if (!user) {
//         throw new Error('존재하지 않는 아이디입니다.');
//     }

//     if (user.user_pw !== current_pw) {
//         throw new Error('비밀번호가 일치하지 않습니다. 다시 입력해주세요.');
//     }

//     await updateUserPassword(user_id, new_pw);
// }

// // 이메일 인증 코드 생성 관련 코드 (6자리 숫자) + 비밀번호 찾기 시 '휴대폰으로 전송되는 인증코드 생성 관련'
// export const generateVerificationCode = () => {
//     return Math.floor(100000 + Math.random() * 900000).toString();      // 6자리 숫자를 랜덤으로 생성 후 문자열로 리턴
// }
// // 위에서 생성한 인증 코드를 이메일로 보내는 기능 + 메일로 전송된 인증코드를 검증하는 기능 추가
// export const verificationCodes = {};        // 메일로 온 이메일 인증 코드를 담아놓을 임시 저장소 (인증코드 검증 위함) + 비밀번호 찾기에서도 사용

// export const sendVerificationEmail = async (u_email, code) => {
//     verificationCodes[u_email] = code;      // 메일로 받은 이메일 인증 코드를 저장함

//     const transporter = nodemailer.createTransport({
//         host: 'smtp.gmail.com',
//         port: 465,
//         secure: true,
//         auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASS
//         }
//     });

//     // 메일의 제목, 수신자, 본문 내용을 설정해줌
//     const mailOptions = {
//         from: '"MyApp" <jisoopark8@gmail.com>',         // 발신자 이메일 주소
//         to: u_email,
//         subject: '이메일 인증 코드',
//         html: `<h1>인증 코드: <strong>${code}</strong></h1>`
//     };

//     // 설정한 메일 내용을 실제로 전송
//     await transporter.sendMail(mailOptions);
// }

// // 이메일 인증 코드를 '검증'하는 기능
// export const verifyEmailCode = (u_email, inputCode) => {
//     const storeCode = verificationCodes[u_email];       // 저장된 인증코드를 가져옴

//     // 저장된 인증코드가 없는 경우
//     if (!storeCode) {
//         throw new Error("인증 코드가 존재하지 않거나 만료되었습니다.");
//     }

//     // 저장된 인증코드와 보낸 인증코드가 다른 경우
//     if (storeCode != inputCode) {
//         throw new Error("인증 코드가 일치하지 않습니다.");
//     }

//     // 인증 성공 후 코드 삭제 (1회성 코드)
//     delete verificationCodes[u_email];
// }

// // 휴대폰 번호로 전송하기 위한 인증코드 생성 관련 코드 (비밀번호 찾기 기능) -> 이 부분은 실제로 SMS 전송이 필요할 때 아래 주석 지우고 코드 써주기
// // const sendSMSVerificationCode = async (phone, code) => {
// //     // 실제 SMS 전송이 필요할 때만 사용
// //     await axios.post('https://api.coolsms.co.kr/messages', {
// //         to: phone,
// //         from: process.env.MY_PHONE,
// //         text: `[MyApp] 인증번호는 ${code}입니다.`,
// //         type: 'SMS',
// //     }, {
// //         headers: {
// //             Authorization: `Bearer ${process.env.COOLSMS_API_KEY}`
// //         }
// //     });
// // }

// // 휴대폰 번호로 전송된 인증코드 전송 기능 (비밀번호 찾기) -> 테스트라 콘솔창에 인증코드 출력되도록
// export const requestPhoneVerification = async (user_id, u_name, u_phone) => {
//     const user = await findUserByNamePhone(user_id, u_name, u_phone);

//     if (!user) {
//         throw new Error('일치하는 사용자가 없습니다.');
//     }

//     const code = generateVerificationCode();        // 인증코드 생성 후 code에 넣어줌
//     verificationCodes[u_phone] = code;              // 인증코드를 저장

//     // 실제 전송이 아닌 콘솔 출력 (테스트용)
//     console.log(`[테스트용 인증코드] ${code}`);

//     // 실제 SMS 전송은 테스트 완료 후 주석 해제
//     // await sendSMSVerificationCode(u_phone, code);

//     return code;
// };

// // 휴대폰 번호로 전송된 인증코드 검증 기능
// export const verifyPhoneCode = (u_phone, inputCode) => {
//     const storedCode = verificationCodes[u_phone];

//     // 휴대폰으로 전송된 인증 코드가 없는 경우
//     if (!storedCode) {
//         throw new Error("인증 코드가 존재하지 않거나 만료되었습니다.");
//     }

//     if (storedCode !== inputCode) {
//         throw new Error("인증 코드가 일치하지 않습니다.");
//     }

//     // 인증 성공 시 1회성 코드이므로 삭제
//     delete verificationCodes[u_phone];
// }

// module.exports = { registerUser, loginUser, changeUserPassword, generateVerificationCode, sendVerificationEmail,
//     verifyEmailCode, requestPhoneVerification, verifyPhoneCode
// };

// 서비스에는 실제로 처리할 로직에 대해서 작성을 해줌
import UserDTO from '../dtos/UserDTO.js';
import { insertUser, findUserById, updateUserPassword, findUserByNamePhone, findUserIdByNameAndPhone, findUserByEmail, createUser } from '../repositories/UserRepository.js';
import nodemailer from 'nodemailer';              // node.js에서 이메일 전송을 위한 라이브러리
// import axios from 'axios';     // 외부 API 호출을 위한 HTTP 클라이언트 (SMS API 호출에 사용 -> 실제로 사용할 때)
import jwt from 'jsonwebtoken';        // 토큰 사용하기 위함
import { secretKey, options } from '../config/jwtConfig.js';
import dotenv from 'dotenv';
dotenv.config();         // .env 파일에 있는 내용 가져와서 사용

import crypto from 'crypto';        // 비밀번호 재설정 관련

const passwordResetTokens = {};     // 비밀번호 재설정 관련 토큰

// 회원가입 기능 (등록)
export const registerUser = async (UserDTO) => {
    await insertUser(UserDTO);
};

// 로그인 기능 + 토큰 생성 기능 추가
export const loginUser = async (user_id, user_pw) => {
    const id = String(user_id ?? '').trim();
    const pw = String(user_pw ?? '').trim();

    if (!id) {
        throw new Error('아이디를 입력해주세요.');
    } else if (!pw) {
        throw new Error('비밀번호를 입력해주세요.');
    }

    // 아이디를 바탕으로 사용자 정보 조회
    const user = await findUserById(id);       // 괄호 안 원래 user_id

    if (!user) {
        //throw new Error('존재하지 않는 사용자입니다!');
        throw new Error('존재하지 않는 사용자입니다.');
    }

    if (user.user_pw !== pw) {         // 우항 user_pw였다가 변경
        throw new Error('비밀번호가 일치하지 않습니다.');
    }

    const payload = {
        user_no: user.user_no,
        user_id: user.user_id,
        u_name: user.u_name
    };
    const token = jwt.sign(payload, secretKey, options);

    return { user, token };
};

// '아이디 찾기' 기능 (250718 만들음)
export const findUserId = async (u_name, u_phone) => {
    const normalizedPhone = String(u_phone).replace(/[^0-9]/g, '');        // 폰번호 입력 받을 때 숫자만 받도록 '정규화'
    const user = await findUserIdByNameAndPhone(u_name.trim(), normalizedPhone);

    if (!user) {
        throw new Error('해당 정보와 일치하는 사용자가 없습니다.');
    }

    return user.user_id;
}

// 구글 계정 로그인 기능 (250721 만드는중)
export const findOrCreateUserByGoogleProfile = async (profile) => {
    const email = profile.emails[0].value;
    const name = profile.displayName;

    console.log("구글 프로필: ", profile);
    //console.log("이메일 확인: ", email);

    let user = await findUserByEmail(email);
    if (!user) {
        // 구글 계정이 없는 경우 -> 새 사용자 등록
        console.log("해당 이메일 사용자 없음 -> 신규 등록 진행");

        const newUser = {
            u_name: name, u_email: email, user_pw: '12345', user_id: `google_${profile.id}`,
            u_phone: '01012345678', u_gender: 'F', chat_flag: 'AI', user_flag: 'parent'
        };

        await createUser(newUser);
        user = await findUserByEmail(email);
    } else {
        console.log("이미 존재하는 사용자: ", user);
    }

    return user;
}

// 비밀번호 변경(재설정) 기능 -> 마이페이지에서 변경할 때 사용(?)
export const changeUserPassword = async (user_id, current_pw, new_pw) => {
    const user = await findUserById(user_id);

    if (!user) {
        throw new Error('존재하지 않는 아이디입니다.');
    }

    if (user.user_pw !== current_pw) {
        throw new Error('비밀번호가 일치하지 않습니다. 다시 입력해주세요.');
    }

    await updateUserPassword(user_id, new_pw);
};

// 이메일 인증 코드 생성 관련 코드 (6자리 숫자) + 비밀번호 찾기 시 '휴대폰으로 전송되는 인증코드 생성 관련'
export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const verificationCodes = {};

// 위에서 생성한 인증 코드를 이메일로 보내는 기능 + 메일로 전송된 인증코드를 검증하는 기능 추가
export const sendVerificationEmail = async (u_email, code) => {
    verificationCodes[u_email] = code;

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: '"MyApp" <ravoyanolja@gmail.com>',
        to: u_email,
        subject: '이메일 인증 코드',
        html: `<h1>인증 코드: <strong>${code}</strong></h1>`
    };

    await transporter.sendMail(mailOptions);
};

// 이메일 인증 코드를 '검증'하는 기능
export const verifyEmailCode = (u_email, inputCode, remove = false) => {        // remove = false (마이페이지 개인정보 수정에서 사용)
    // 아래 잠깐 콘솔 로그 추가
    console.log("verifyEmailCode check:", {
        email: u_email,
        input: inputCode,
        stored: verificationCodes[u_email],
        remove
    });
    
    const storeCode = verificationCodes[u_email];

    if (!storeCode) {
        throw new Error("인증 코드가 존재하지 않거나 만료되었습니다.");
    }

    if (storeCode != inputCode) {
        throw new Error("인증 코드가 일치하지 않습니다.");
    }

    // 인증 완료된 경우 인증번호 삭제
    //delete verificationCodes[u_email];

    // 최종 업데이트 시점에서 인증번호 삭제 (잠깐 추가)
    if (remove) {
        delete verificationCodes[u_email];
    }
};


// 휴대폰 번호로 전송하기 위한 인증코드 생성 관련 코드 (비밀번호 찾기 기능)
// const sendSMSVerificationCode = async (phone, code) => {
//     await axios.post('https://api.coolsms.co.kr/messages', {
//         to: phone,
//         from: process.env.MY_PHONE,
//         text: `[MyApp] 인증번호는 ${code}입니다.`,
//         type: 'SMS',
//     }, {
//         headers: {
//             Authorization: `Bearer ${process.env.COOLSMS_API_KEY}`
//         }
//     });
// };

// 휴대폰 번호로 전송된 인증코드 전송 기능 (비밀번호 찾기) -> 테스트라 콘솔창에 인증코드 출력되도록
export const requestPhoneVerification = async (user_id, u_name, u_phone) => {
    const normalizedPhone = String(u_phone).replace(/[^0-9]/g, '');

    const user = await findUserByNamePhone(user_id, u_name, normalizedPhone);

    if (!user) {
        throw new Error('일치하는 사용자가 없습니다.');
    }

    const code = generateVerificationCode();
    //verificationCodes[u_phone] = code;
    verificationCodes[normalizedPhone] = code;

    console.log(`[테스트용 인증코드] ${code}`);

    // await sendSMSVerificationCode(u_phone, code);

    return code;
};

// 휴대폰 번호로 전송된 인증코드 검증 기능
export const verifyPhoneCode = (u_phone, inputCode) => {
    const normalizedPhone = String(u_phone).replace(/[^0-9]/g, '');
    const storedCode = verificationCodes[normalizedPhone];          // 원래는 u_phone였음

    if (!storedCode) {
        throw new Error("인증 코드가 존재하지 않거나 만료되었습니다.");
    }

    if (storedCode !== inputCode) {
        throw new Error("인증 코드가 일치하지 않습니다.");
    }

    delete verificationCodes[normalizedPhone];      // 원래 u_phone

    // 인증 성공하면 -> 일회용 resetToken 발급 (비밀번호 재설정 관련)
    const token = crypto.randomBytes(24).toString('hex');
    passwordResetTokens[normalizedPhone] = token;
    return token;
};

// 휴대폰 인증 기반 비밀번호 재설정 -> 현재 비번 불필요함 (비밀번호 찾기에서 사용중)
export const resetUserPasswordByPhone = async (user_id, new_pw, u_phone, resetToken) => {
  const normalizedPhone = String(u_phone).replace(/[^0-9]/g, '');
  const saved = passwordResetTokens[normalizedPhone];

  if (!saved || saved !== resetToken) {
    throw new Error('인증이 만료되었거나 유효하지 않습니다. 다시 인증해주세요.');
  }

  const user = await findUserById(user_id);
  if (!user) throw new Error('존재하지 않는 아이디입니다.');

  await updateUserPassword(user_id, new_pw);

  // 일회용 토큰 소각
  delete passwordResetTokens[normalizedPhone];
};