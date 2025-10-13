// src/controllers/reportControllers.js
import { pool as db } from '../config/db.js';

/**
 * 공통 유틸: 정수 양수 검증
 */
function isPosInt(n) {
  return Number.isInteger(n) && n > 0;
}

/**
 * 1) 영상 보고서 생성
 * [POST] /record/reports
 * body: { user_no, r_title, r_content, r_date? }
 */
export const createReport = async (req, res, next) => {
  try {
    const user_no = Number(req.body.user_no);
    if (!isPosInt(user_no)) {
      return res.status(400).json({ message: 'user_no는 양의 정수여야 합니다.' });
    }

    const title = String(req.body.r_title || '').trim();
    if (!title) {
      return res.status(400).json({ message: 'r_title은 필수입니다.' });
    }

    const r_content = req.body.r_content ?? null;
    const r_date = req.body.r_date ?? null; // YYYY-MM-DD 권장

    const sql = `
      INSERT INTO report
        (user_no, r_title, r_content, report_flag, r_del, r_date, createdDate, modifiedDate)
      VALUES
        (?, ?, ?, 'video', 0, COALESCE(?, NOW()), NOW(), NOW())
    `;
    const params = [user_no, title, r_content, r_date];

    const [result] = await db.query(sql, params);

    return res.status(201).json({
      message: '등록 성공',
      report_no: result.insertId,
      title,
      date: r_date || new Date().toISOString().slice(0, 10),
    });
  } catch (err) {
    console.error('[record] create error:', err);
    return next(err);
  }
};

/**
 * 2) 영상 보고서 상세
 * [GET] /record/reports/:record_no
 */
export const getReportById = async (req, res, next) => {
  try {
    const record_no = Number(req.params.record_no);
    if (!isPosInt(record_no)) {
      return res.status(400).json({ message: 'record_no는 양의 정수여야 합니다.' });
    }

    const sql = `
      SELECT
        report_no AS record_no,
        r_title,
        r_content,
        DATE_FORMAT(IFNULL(r_date, createdDate), '%Y-%m-%d') AS date,
        user_no,
        report_flag,
        r_del,
        createdDate,
        modifiedDate
      FROM report
      WHERE report_no = ?
        AND report_flag = 'video'
        AND COALESCE(r_del, 0) = 0
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [record_no]);

    if (rows.length === 0) {
      return res.status(404).json({ message: '존재하지 않음' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('[record] detail error:', err);
    return next(err);
  }
};

/**
 * 3) 영상 보고서 목록 (유저별)
 * [GET] /record/reports-list?user_no=1
 * (선택) page, pageSize 지원하려면 쿼리 추가 처리 가능
 */
export const getReportList = async (req, res, next) => {
  try {
    const user_no = Number(req.query.user_no);
    if (!isPosInt(user_no)) {
      return res.status(400).json({ message: 'user_no는 양의 정수여야 합니다.' });
    }

    const sql = `
      SELECT
        report_no AS record_no,
        r_title   AS title,
        DATE_FORMAT(IFNULL(r_date, createdDate), '%Y-%m-%d') AS date
      FROM report
      WHERE user_no = ?
        AND report_flag = 'video'
        AND COALESCE(r_del, 0) = 0
      ORDER BY COALESCE(r_date, createdDate) DESC
    `;
    const [rows] = await db.query(sql, [user_no]);

    // 기존 스키마 유지: 배열 반환
    return res.json(rows);
  } catch (err) {
    console.error('[record] list error:', err);
    return next(err);
  }
};

/**
 * 4) 영상 보고서 삭제 (소프트 삭제)
 * [DELETE] /record/reports-list/:record_no
 */
export const deleteReport = async (req, res, next) => {
  try {
    const record_no = Number(req.params.record_no);
    if (!isPosInt(record_no)) {
      return res.status(400).json({ message: 'record_no는 양의 정수여야 합니다.' });
    }

    const sql = `
      UPDATE report
      SET r_del = 1,
          modifiedDate = NOW()
      WHERE report_no = ?
        AND report_flag = 'video'
        AND COALESCE(r_del, 0) = 0
    `;
    const [r] = await db.query(sql, [record_no]);

    if (r.affectedRows === 0) {
      return res.status(404).json({ message: '존재하지 않거나 이미 삭제됨' });
    }

    return res.json({ message: '삭제 완료 (soft delete)' });
  } catch (err) {
    console.error('[record] delete error:', err);
    return next(err);
  }
};

/**
 * 5) 영상 보고서 검색 (제목 부분일치, 유저 범위)
 * [GET] /record/reports/search?user_no=1&title=foo
 */
export const searchReports = async (req, res, next) => {
  try {
    const user_no = Number(req.query.user_no);
    if (!isPosInt(user_no)) {
      return res.status(400).json({ message: 'user_no는 양의 정수여야 합니다.' });
    }

    const title = String(req.query.title || '').trim();
    if (!title) {
      return res.status(400).json({ message: 'title을 입력해주세요.' });
    }

    const like = `%${title}%`;
    const sql = `
      SELECT
        report_no AS record_no,
        r_title   AS title,
        DATE_FORMAT(IFNULL(r_date, createdDate), '%Y-%m-%d') AS date
      FROM report
      WHERE user_no = ?
        AND report_flag = 'video'
        AND COALESCE(r_del, 0) = 0
        AND r_title LIKE ?
      ORDER BY COALESCE(r_date, createdDate) DESC
      LIMIT 50
    `;
    const [rows] = await db.query(sql, [user_no, like]);

    return res.json({ items: rows, total: rows.length });
  } catch (err) {
    console.error('[record] search error:', err);
    return next(err);
  }
};
