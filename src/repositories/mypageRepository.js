import db from '../config/db.js';

// 부모 이메일로 부모 정보 조회 (로그인된 사용자 정보)
async function findMypageUserByEmail(email) {
  const [rows] = await db.execute(
    `
    SELECT user_no, user_id, u_email, user_flag
    FROM User
    WHERE u_email = ? AND u_del = false AND user_flag = 'parent'
    `,
    [email]
  );
  return rows[0];
}

// (신규) 이메일로 비번 포함 조회(인증용)
export async function findParentAuthByEmail(email) {
  const [rows] = await db.execute(
    `
    SELECT user_no, user_id, u_email, user_pw
    FROM User
    WHERE u_email = ? AND u_del = false AND user_flag = 'parent'
    `,
    [email]
  );
  return rows[0];
}

// (신규) user_no로 부분 업데이트
export async function updateUserByUserNo(user_no, updates) {
  const keys = Object.keys(updates);
  const vals = Object.values(updates);

  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const sql = `UPDATE User SET ${setClause} WHERE user_no = ? AND u_del = false`;

  await db.execute(sql, [...vals, user_no]);
}

// (신규) user_no로 상세 조회(업데이트 후 최신값 반환용)
export async function findMypageUserByUserNo(user_no) {
  const [rows] = await db.execute(
    `
    SELECT user_no, user_id, u_email, u_name, u_phone, u_gender, u_birth, u_img, chat_flag, user_flag
    FROM User
    WHERE user_no = ? AND u_del = false
    `,
    [user_no]
  );
  return rows[0];
}

// 부모의 user_id를 공유하는 자녀들만 조회
async function findChildrenByUserId(user_id) {
  const [rows] = await db.execute(
    `
    SELECT user_no, u_name, u_birth, u_gender
    FROM User
    WHERE user_flag = 'child' AND u_del = false AND user_id = ?
    `,
    [user_id]
  );
  return rows;
}

// 자녀 단일 조회
export async function findChildByUserNo(child_no) {
  const [rows] = await db.execute(
    `
    SELECT user_no, user_id, u_name, u_birth, u_gender, u_img
    FROM User
    WHERE user_no = ? AND user_flag = 'child' AND u_del = false
    `,
    [child_no]
  );
  return rows[0];
}

// 자녀 업데이트
export async function updateChildByUserNo(child_no, updates) {
  const keys = Object.keys(updates);
  const vals = Object.values(updates);

  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const sql = `UPDATE User SET ${setClause} WHERE user_no = ? AND user_flag = 'child' AND u_del = false`;

  await db.execute(sql, [...vals, child_no]);
}

export { findMypageUserByEmail, findChildrenByUserId };
