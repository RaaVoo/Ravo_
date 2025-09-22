/**
 * 홈캠 레포지토리 레이어
 * - 실제 DB와 통신 (SQL 실행)
 * - service 레이어에서 호출됨
 */

const db = require('../config/db');

//  [CREATE] 홈캠 저장 (record_del = 'N')
exports.insertHomecam = async (values) => {
  const sql = `
    INSERT INTO homecam (
      user_no, r_start, r_end, p_start, p_end,
      record_title, cam_url, snapshot_url, cam_status, record_del
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'N')
  `;
  return await db.execute(sql, values);
};

//  [UPDATE] 상태 변경
exports.updateHomecamStatus = async (record_no, cam_status) => {
  return await db.execute(
    `UPDATE homecam SET cam_status = ? WHERE record_no = ?`,
    [cam_status, record_no]
  );
};

//  [DELETE] 단일 소프트 삭제
exports.softDeleteHomecam = async (record_no) => {
  return await db.execute(
    `UPDATE homecam SET record_del = 'Y' WHERE record_no = ?`,
    [record_no]
  );
};

//  [DELETE] 다중 삭제 (소프트/하드)
exports.deleteMultipleHomecams = async (record_nos, isHardDelete) => {
  const placeholders = record_nos.map(() => '?').join(', ');
  const query = isHardDelete
    ? `DELETE FROM homecam WHERE record_no IN (${placeholders})`
    : `UPDATE homecam SET record_del = 'Y' WHERE record_no IN (${placeholders})`;
  return await db.execute(query, record_nos);
};

//  [READ] 목록 쿼리 실행 (LIMIT 포함된 SQL)
exports.getHomecamList = async (query, params) => {
  return await db.execute(query, params);
};

//  [READ] 목록 쿼리 실행 (LIMIT 숫자 직접 삽입)
exports.getHomecamListNoBind = async (query) => {
  return await db.query(query);
};

//  [READ] 전체 개수
exports.getHomecamCount = async (query, params) => {
  return await db.execute(query, params);
};

//  [READ] 특정 날짜만
exports.searchByDate = async (date) => {
  const sql = `
    SELECT * FROM homecam
    WHERE record_del != 'Y' AND DATE(r_start) = ?
    ORDER BY createdDate DESC
  `;
  return await db.execute(sql, [date]);
};

//  [READ] 상세
exports.getHomecamDetail = async (record_no) => {
  return await db.execute(
    `SELECT * FROM homecam WHERE record_no = ? AND record_del != 'Y'`,
    [record_no]
  );
};

/**
 * ✅ [UPDATE] 녹화 종료 메타데이터 업데이트
 * - r_end: 'YYYY-MM-DD HH:MM:SS' (Service에서 변환)
 * - duration_sec: 전달되면 그대로, 없으면 r_start~r_end로 계산 (최소 1초)
 * - cam_status를 'inactive'로 전환
 */
exports.updateEndMeta = async (
  record_no,
  { r_end, cam_url, snapshot_url, duration_sec }
) => {
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
};
