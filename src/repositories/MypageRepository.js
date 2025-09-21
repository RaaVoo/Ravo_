// 마이페이지 기능(회원정보 수정, 아이정보 수정) 관련 repository 코드
import { pool } from '../config/db.js';

// user_no로 사용자 조회
export const getUserById = async (user_no) => {
  const sql = 'SELECT user_id, user_pw, u_name, u_phone, u_email, u_gender FROM User WHERE user_no = ? AND u_del = FALSE';
  const [rows] = await pool.execute(sql, [user_no]);
  return rows[0];
};

// 회원정보 업데이트(수정)
export const updateUser = async (user_no, data) => {
  const sql = `
    UPDATE User SET 
      u_name = ?, 
      u_phone = ?, 
      u_email = ?, 
      u_gender = ?, 
      user_pw = ?
    WHERE user_no = ?`;
  
  const values = [data.u_name, data.u_phone, data.u_email, data.u_gender, data.user_pw, user_no];
  await pool.execute(sql, values);
};

// email 중복 검사 (선택적)
export const findUserByEmail = async (u_email) => {
  const sql = 'SELECT * FROM User WHERE u_email = ? AND u_del = FALSE';
  const [rows] = await pool.execute(sql, [u_email]);
  return rows[0];
};

// 부모(user_no)로 '자녀 정보 조회'
export const getChildrenByParentId = async (parent_no) => {
  const sql = `
    SELECT child_id, c_name, c_gender, c_birth, c_content
    FROM Child
    WHERE parent_no = ?
  `;
  const [rows] = await pool.execute(sql, [parent_no]);
  return rows;
};

// '자녀 정보 업데이트'
export const updateChild = async (child_id, data) => {
  const sql = `
    UPDATE Child SET 
      c_name = ?, 
      c_gender = ?, 
      c_birth = ?, 
      c_content = ?
    WHERE child_id = ?
  `;
  const values = [data.c_name, data.c_gender, data.c_birth, data.c_content, child_id];
  await pool.execute(sql, values);
};

// '자녀 정보 삭제'
export const deleteChild = async (child_id) => {
  const sql = `DELETE FROM Child WHERE child_id = ?`;
  await pool.execute(sql, [child_id]);
};