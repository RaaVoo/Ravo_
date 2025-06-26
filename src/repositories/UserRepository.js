// Repository는 DB 쿼리 전담 파일
// DB 연결 모듈을 가져옴
// Repository는 DAO와 같은 기능임 = sql문 작성해주기
import { pool } from '../config/db.js';

// 회원가입 기능
export const insertUser = async (UserDTO) => {
    //const sql = 'INSERT INTO Users (user_id, user_pw, u_name, u_phone, u_email, u_gender, u_birth) VALUES (?, ?, ?, ?, ?, ?, ?)';       // 원래 코드
    const sql = 'INSERT INTO User (user_id, user_pw, u_name, u_phone, u_email, u_gender, u_birth) VALUES (?, ?, ?, ?, ?, ?, ?)';          // 지수 테스트 코드

    const values = [
        UserDTO.user_id,
        UserDTO.user_pw,
        UserDTO.u_name,
        UserDTO.u_phone,
        UserDTO.u_email,
        UserDTO.u_gender,
        UserDTO.u_birth
    ];
    await pool.execute(sql, values);      // SQL문과 데이터를 함께 실행함
};

// user_id를 가지고 '사용자 정보 조회' + 아이디 중복 체크에서도 사용
export const findUserById = async (user_id) => {
    //const sql = 'SELECT * FROM Users WHERE user_id = ?';         // ?에는 나중에 값이 들어감 -> 원래 코드
    const sql = 'SELECT * FROM User WHERE user_id = ?';             // 지수 테스트 코드
    const [rows] = await pool.execute(sql, [user_id]);            // sql문을 실행한 결과를 rows에 담고, [user_id]가 ? 위치에 들어감
    return rows[0];             // 1명만 반환
}

// email 중복 검사 기능
export const findUserByEmail = async (u_email) => {
    //const sql = 'SELECT * FROM Users WHERE u_email = ?';      // 원래 코드
    const sql = 'SELECT * FROM User WHERE u_email = ?';         // 지수 테스트 코드

    const [rows] = await pool.execute(sql, [u_email]);            // sql 쿼리문의 실행 결과가 [rows]에 들어감
    return rows[0];     // sql문 실행 결과 중 첫번째 사용자 정보 리턴
}

// 비밀번호 변경 기능
export const updateUserPassword = async (user_id, new_pw) => {
    //const sql = 'UPDATE Users SET user_pw = ? WHERE user_id = ?';           // 원래 코드
    const sql = 'UPDATE User SET user_pw = ? WHERE user_id = ?';          // 지수 테스트 코드
    await pool.execute(sql, [new_pw, user_id]);                   // ? 자리에 user_id의 비밀번호를 new_pw로 업데이트
}

// 비밀번호 찾기 기능
export const findUserByNamePhone = async (user_id, u_name, u_phone) => {
    const [rows] = await pool.query(
        'SELECT * FROM User WHERE user_id = ? AND u_name = ? AND u_phone = ?', 
        [user_id, u_name, u_phone]
    );      // From Users가 원래였고 잠깐 From User로 바꿈
    return rows[0];         // 일치하는 사용자 정보 리턴
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
