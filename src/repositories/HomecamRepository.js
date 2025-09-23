// /**
//  * 홈캠 레포지토리 레이어
//  * - 실제 DB와 통신 (SQL 실행)
//  * - service 레이어에서 호출됨
//  */

// const db = require('../config/db');

// //  홈캠 영상 저장
// exports.insertHomecam = async (values) => {
//   const sql = `
//     INSERT INTO homecam (
//       user_no, r_start, r_end, p_start, p_end,
//       record_title, cam_url, snapshot_url, cam_status
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `;
//   return await db.execute(sql, values);
// };

// //  홈캠 상태 변경
// exports.updateHomecamStatus = async (record_no, cam_status) => {
//   return await db.execute(
//     'UPDATE homecam SET cam_status = ? WHERE record_no = ?',
//     [cam_status, record_no]
//   );
// };

// //  단일 소프트 삭제
// exports.softDeleteHomecam = async (record_no) => {
//   return await db.execute(
//     'UPDATE homecam SET record_del = ? WHERE record_no = ?',
//     ['Y', record_no]
//   );
// };

// //  다중 삭제 (소프트/하드)
// exports.deleteMultipleHomecams = async (record_nos, isHardDelete) => {
//   const placeholders = record_nos.map(() => '?').join(', ');
//   const query = isHardDelete
//     ? `DELETE FROM homecam WHERE record_no IN (${placeholders})`
//     : `UPDATE homecam SET record_del = 'Y' WHERE record_no IN (${placeholders})`;

//   return await db.execute(query, record_nos);
// };

// //  영상 목록 (LIMIT 포함된 SQL)
// exports.getHomecamList = async (query, params) => {
//   return await db.execute(query, params);
// };

// //  영상 목록 (LIMIT 숫자 직접 박아넣은 경우 → query()로 실행)
// exports.getHomecamListNoBind = async (query) => {
//   return await db.query(query);
// };

// //  영상 전체 개수 (페이징 계산용)
// exports.getHomecamCount = async (query, params) => {
//   return await db.execute(query, params);
// };

// //  특정 날짜의 영상만 조회
// exports.searchByDate = async (date) => {
//   const sql = `
//     SELECT * FROM homecam
//     WHERE record_del != 'Y' AND DATE(r_start) = ?
//     ORDER BY createdDate DESC
//   `;
//   return await db.execute(sql, [date]);
// };

// //  단일 상세 조회
// exports.getHomecamDetail = async (record_no) => {
//   return await db.execute(
//     `SELECT * FROM homecam WHERE record_no = ? AND record_del != 'Y'`,
//     [record_no]
//   );
// };

/**
 * 홈캠 레포지토리 레이어
 * - 실제 DB와 통신 (SQL 실행)
 * - service 레이어에서 호출됨
 */

import { pool as db } from '../config/db.js'; // ← ESM 방식은 default import로 처리해줘야 할 수도 있음

// 홈캠 영상 저장
export const insertHomecam = async (values) => {
  const sql = `
    INSERT INTO homecam (
      user_no, r_start, r_end, p_start, p_end,
      record_title, cam_url, snapshot_url, cam_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return await db.execute(sql, values);
};

// 홈캠 상태 변경
export const updateHomecamStatus = async (record_no, cam_status) => {
  return await db.execute(
    'UPDATE homecam SET cam_status = ? WHERE record_no = ?',
    [cam_status, record_no]
  );
};

// 단일 소프트 삭제
export const softDeleteHomecam = async (record_no) => {
  return await db.execute(
    'UPDATE homecam SET record_del = ? WHERE record_no = ?',
    ['Y', record_no]
  );
};

// 다중 삭제 (소프트/하드)
export const deleteMultipleHomecams = async (record_nos, isHardDelete) => {
  const placeholders = record_nos.map(() => '?').join(', ');
  const query = isHardDelete
    ? `DELETE FROM homecam WHERE record_no IN (${placeholders})`
    : `UPDATE homecam SET record_del = 'Y' WHERE record_no IN (${placeholders})`;

  return await db.execute(query, record_nos);
};

// 영상 목록 (LIMIT 포함된 SQL)
export const getHomecamList = async (query, params) => {
  return await db.execute(query, params);
};

// 영상 목록 (LIMIT 숫자 직접 박아넣은 경우 → query()로 실행)
export const getHomecamListNoBind = async (query) => {
  return await db.query(query);
};

// 영상 전체 개수 (페이징 계산용)
export const getHomecamCount = async (query, params) => {
  return await db.execute(query, params);
};

// 특정 날짜의 영상만 조회
export const searchByDate = async (date) => {
  const sql = `
    SELECT * FROM homecam
    WHERE record_del != 'Y' AND DATE(r_start) = ?
    ORDER BY createdDate DESC
  `;
  return await db.execute(sql, [date]);
};

// 단일 상세 조회
export const getHomecamDetail = async (record_no) => {
  return await db.execute(
    `SELECT * FROM homecam WHERE record_no = ? AND record_del != 'Y'`,
    [record_no]
  );
};
