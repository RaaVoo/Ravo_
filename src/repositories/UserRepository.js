// Repository는 DB 쿼리 전담 파일
// DB 연결 모듈을 가져옴
// Repository는 DAO와 같은 기능임 = sql문 작성해주기
import { pool } from '../config/db.js';

// '회원가입' 기능
export const insertUser = async (UserDTO) => {
    //const sql = 'INSERT INTO Users (user_id, user_pw, u_name, u_phone, u_email, u_gender) VALUES (?, ?, ?, ?, ?, ?, ?)';       // 원래 코드
    const sql = 'INSERT INTO user (user_id, user_pw, u_name, u_phone, u_email, u_gender) VALUES (?, ?, ?, ?, ?, ?)';          // 지수 테스트 코드

    const normalizedPhone = UserDTO.u_phone ? String(UserDTO.u_phone).replace(/[^0-9]/g, '') : null;

    const values = [
        UserDTO.user_id,
        UserDTO.user_pw,
        UserDTO.u_name,
        //UserDTO.u_phone,      -> 정규화 하기 전 폰번호
        normalizedPhone,        // 정규화 한 폰 번호
        UserDTO.u_email,
        UserDTO.u_gender
    ];
    await pool.execute(sql, values);      // SQL문과 데이터를 함께 실행함
};

// user_id를 가지고 '사용자 정보 조회' + '아이디 중복 체크'에서도 사용
export const findUserById = async (user_id) => {
    //const sql = 'SELECT * FROM Users WHERE user_id = ?';         // ?에는 나중에 값이 들어감 -> 원래 코드
    const sql = 'SELECT * FROM user WHERE user_id = ?';             // 지수 테스트 코드
    const [rows] = await pool.execute(sql, [user_id]);            // sql문을 실행한 결과를 rows에 담고, [user_id]가 ? 위치에 들어감
    return rows[0];             // 1명만 반환
}

// 'email 중복 검사' 기능 + '구글 계정 로그인' 기능에서도 사용
export const findUserByEmail = async (u_email) => {
    //const sql = 'SELECT * FROM Users WHERE u_email = ?';      // 원래 코드
    const sql = 'SELECT * FROM user WHERE u_email = ?';         // 지수 테스트 코드

    const [rows] = await pool.execute(sql, [u_email]);            // sql 쿼리문의 실행 결과가 [rows]에 들어감
    return rows[0];     // sql문 실행 결과 중 첫번째 사용자 정보 리턴
}

// '아이디 찾기' 기능
export const findUserIdByNameAndPhone = async (u_name, u_phone) => {
    const sql = 'SELECT user_id FROM user WHERE u_name = ? AND u_phone = ? AND u_del = FALSE';
    //const sql = 'SELECT user_id FROM Users WHERE u_name = ? AND u_phone = ? AND u_del = FALSE';
    
    const [rows] = await pool.execute(sql, [u_name, u_phone]);
    return rows[0];
}

// '비밀번호 변경(재설정)' 기능
export const updateUserPassword = async (user_id, new_pw) => {
    //const sql = 'UPDATE Users SET user_pw = ? WHERE user_id = ?';           // 원래 코드
    const sql = 'UPDATE user SET user_pw = ? WHERE user_id = ?';          // 지수 테스트 코드
    await pool.execute(sql, [new_pw, user_id]);                   // ? 자리에 user_id의 비밀번호를 new_pw로 업데이트
}

// '비밀번호 찾기' 기능
export const findUserByNamePhone = async (user_id, u_name, u_phone) => {
    const [rows] = await pool.query(
        'SELECT * FROM user WHERE user_id = ? AND u_name = ? AND u_phone = ?', 
        //'SELECT * FROM Users WHERE user_id = ? AND u_name = ? AND u_phone = ?', 
        [user_id, u_name, u_phone]
    );      // From Users가 원래였고 잠깐 From User로 바꿈
    return rows[0];         // 일치하는 사용자 정보 리턴
}

// '구글 계정 로그인' 기능
export const createUser = async (user) => {
    const sql = `INSERT INTO user (u_name, u_email, user_pw, user_id, u_phone, u_gender, chat_flag, user_flag) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        user.u_name,
        user.u_email,
        user.user_pw,
        user.user_id,
        user.u_phone,
        user.u_gender,
        user.chat_flag,
        user.user_flag
    ];

    try {
        const [result] = await pool.query(sql, params);
        console.log("DB에 정보 삽입 성공: ", result);
        return result.insertId;
    } catch (err) {
        console.error("DB에 정보 삽입 오류: ", err);
        throw err;
    }
}

// RefreshToken 저장하는 코드 (구글 계정 로그인 관련)
export const saveRefreshToken = async (user_no, refreshToken) => {
    const sql = `UPDATE user SET refresh_token = ? WHERE user_no = ?`;
    //const sql = `UPDATE Users SET refresh_token = ? WHERE user_no = ?`;
    await pool.execute(sql, [refreshToken, user_no]);
}

// // 토큰 인증 관련 하드코딩한 사용자 정보
// const users = [{
//     id: jisoo, username: 지수4
// }]
// // 토큰 관련) 사용자 데이터를 찾는 로직
// exports.findUserByUsername = (username) => {
//     return users.find(user => user.username === username);
// }

// module.exports = { insertUser, findUserById, findUserByEmail, updateUserPassword, findUserByNamePhone };
// export {
//   insertUser, 
//   findUserById, 
//   findUserByEmail
// };
