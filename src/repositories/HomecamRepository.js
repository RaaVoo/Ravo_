/**
 * 홈캠 레포지토리 레이어
 * - 실제 DB와 통신 (SQL 실행)
 * - service 레이어에서 호출됨
 */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// db 모듈이 CommonJS여도 안전하게 로드
const db = require('../config/db');

export async function insertHomecam(values) {
  const sql = `
    INSERT INTO homecam (
      user_no, r_start, r_end, p_start, p_end,
      record_title, cam_url, snapshot_url, cam_status, record_del
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'N')
  `;
  return await db.execute(sql, values);
}

export async function updateHomecamStatus(record_no, cam_status) {
  return await db.execute(
    `UPDATE homecam SET cam_status = ? WHERE record_no = ?`,
    [cam_status, record_no]
  );
}

export async function softDeleteHomecam(record_no) {
  return await db.execute(
    `UPDATE homecam SET record_del = 'Y' WHERE record_no = ?`,
    [record_no]
  );
}

export async function deleteMultipleHomecams(record_nos, isHardDelete) {
  const placeholders = record_nos.map(() => '?').join(', ');
  const query = isHardDelete
    ? `DELETE FROM homecam WHERE record_no IN (${placeholders})`
    : `UPDATE homecam SET record_del = 'Y' WHERE record_no IN (${placeholders})`;
  return await db.execute(query, record_nos);
}

export async function getHomecamList(query, params) {
  return await db.execute(query, params);
}

export async function getHomecamListNoBind(query) {
  return await db.query(query,[]);
}

export async function getHomecamCount(query, params) {
  return await db.execute(query, params);
}

export async function searchByDate(date) {
  const sql = `
    SELECT * FROM homecam
    WHERE record_del != 'Y' AND DATE(r_start) = ?
    ORDER BY createdDate DESC
  `;
  return await db.execute(sql, [date]);
}

export async function getHomecamDetail(record_no) {
  return await db.execute(
    `SELECT * FROM homecam WHERE record_no = ? AND record_del != 'Y'`,
    [record_no]
  );
}

/**
 * ✅ [UPDATE] 녹화 종료 메타데이터 업데이트
 * - r_end: 'YYYY-MM-DD HH:MM:SS'
 * - duration_sec: 전달되면 그대로, 없으면 r_start~r_end 계산(최소 1초)
 * - cam_status를 'inactive'로 전환
 */
export async function updateEndMeta(
  record_no,
  { r_end, cam_url, snapshot_url, duration_sec }
) {
  const sql = `
    UPDATE homecam
       SET r_end = ?,
           duration_sec = COALESCE(?, GREATEST(TIMESTAMPDIFF(SECOND, r_start, ?), 1)),
           cam_status = 'inactive',
           cam_url = ?,
           snapshot_url = ?
     WHERE record_no = ? AND record_del = 'N'
  `;
  const params = [
    r_end,                              // 'YYYY-MM-DD HH:MM:SS'
    duration_sec ?? null,               // 직접 넘기면 우선
    r_end,                              // 없으면 r_start~r_end로 계산
    cam_url ?? null,
    snapshot_url ?? null,
    record_no,
  ];
  return await db.execute(sql, params);
}

// 선택: 기본 내보내기(객체)도 제공하면 가져다 쓰기 편함
export default {
  insertHomecam,
  updateHomecamStatus,
  softDeleteHomecam,
  deleteMultipleHomecams,
  getHomecamList,
  getHomecamListNoBind,
  getHomecamCount,
  searchByDate,
  getHomecamDetail,
  updateEndMeta,
};
