// src/controllers/voiceController.js
// DB 연결 모듈
import { pool as db } from '../config/db.js';

// 목록 조회
// [GET] /voice/reports-list?user_no=1
export async function getVoiceReportList(req, res, next) {
  try {
    const user_no_raw = req.query.user_no;
    const user_no = Number(user_no_raw);

    // ✅ 정수 + 양수 검증
    if (!Number.isInteger(user_no) || user_no <= 0) {
      return res.status(400).json({ message: 'user_no는 양의 정수여야 합니다.' });
    }

    console.log('[voice] /reports-list called:', { user_no_raw, user_no });

    const sql = `
      SELECT
        report_no AS id,
        r_title   AS title,
        DATE_FORMAT(IFNULL(r_date, createdDate), '%Y-%m-%d') AS date
      FROM report
      WHERE user_no = ?
        AND report_flag = 'voice'
        AND COALESCE(r_del, 0) = 0
      ORDER BY COALESCE(r_date, createdDate) DESC
    `;

    const [rows] = await db.query(sql, [user_no]);
    console.log('[voice] list rows:', rows.length);

    // 기존 스키마 유지: 배열 반환
    return res.json(rows);
  } catch (err) {
    console.error('[voice] list query error:', err);
    return next(err);
  }
}

// 삭제
// [DELETE] /voice/reports-list/:voice_no
export async function deleteVoiceReport(req, res, next) {
  const voice_no = Number(req.params.voice_no);
  if (!Number.isInteger(voice_no) || voice_no <= 0) {
    return res.status(400).json({ message: 'voice_no는 양의 정수여야 합니다.' });
  }

  try {
    const [r] = await db.query(
      `UPDATE report
       SET r_del=1, modifiedDate=NOW()
       WHERE report_no=? AND report_flag='voice'`,
      [voice_no]
    );

    if (r.affectedRows === 0) {
      return res.status(404).json({ message: '삭제할 보고서를 찾을 수 없습니다.' });
    }
    res.json({ message: '삭제되었습니다.' });
  } catch (e) {
    console.error('[voice] delete error:', e);
    next(e);
  }
}

// 등록 -> AI 연동
// [POST] /voice/reports
export async function createVoiceReport(req, res, next) {
  try {
    const {
      user_no: userNoRaw,
      r_title,
      r_content = null,
      r_date = null,
      emotion_summary = null,
      keyword_summary = null,
      action_summary = null,
      r_overall_review = null,
      r_solution = null,
    } = req.body;

    // ✅ user_no 정수 + 양수 검증
    const user_no = Number(userNoRaw);
    if (!Number.isInteger(user_no) || user_no <= 0) {
      return res.status(400).json({ message: 'user_no는 양의 정수여야 합니다.' });
    }

    // ✅ 제목 트리밍 및 필수 검증
    const title = String(r_title || '').trim();
    if (!title) {
      return res.status(400).json({ message: 'r_title은 필수입니다.' });
    }

    const sql = `
      INSERT INTO report
        (user_no, r_title, r_content, emotion_summary, keyword_summary, action_summary,
         r_overall_review, r_solution, report_flag, r_del, r_date, createdDate, modifiedDate)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, 'voice', 0, COALESCE(?, NOW()), NOW(), NOW())
    `;

    const params = [
      user_no, title, r_content,
      emotion_summary, keyword_summary, action_summary,
      r_overall_review, r_solution,
      r_date
    ];

    const [result] = await db.query(sql, params);

    return res.status(201).json({
      id: result.insertId,
      title,
      date: r_date || new Date().toISOString().slice(0, 10),
      message: '음성 보고서가 등록되었습니다.'
    });
  } catch (err) {
    console.error('[voice] create error:', err);
    return next(err);
  }
}

// ID 조회
// [GET] /voice/:voice_no
export async function getVoiceReportById(req, res, next) {
  try {
    const voice_no = Number(req.params.voice_no);
    if (!Number.isInteger(voice_no) || voice_no <= 0) {
      return res.status(400).json({ message: 'voice_no는 양의 정수여야 합니다.' });
    }

    const sql = `
      SELECT
        r.report_no AS id,
        r.r_title   AS title,
        DATE_FORMAT(IFNULL(r.r_date, r.createdDate), '%Y-%m-%d') AS date,
        r.r_content, r.emotion_summary, r.keyword_summary, r.action_summary,
        r.r_overall_review, r.r_solution,
        (
          SELECT c2.c_name
          FROM Child c2
          WHERE c2.parent_no = r.user_no
          ORDER BY c2.createdDate ASC
          LIMIT 1
        ) AS child_name
      FROM report r
      WHERE r.report_no=? AND r.report_flag='voice' AND COALESCE(r.r_del,0)=0
      LIMIT 1
    `;

    const [rows] = await db.query(sql, [voice_no]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '보고서를 찾을 수 없습니다.' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('[voice] detail error:', err);
    return next(err);
  }
}

// 제목 검색
// [GET] /voice/search?user_no=1&title=foo
export async function getVoiceReportByTitle(req, res, next) {
  try {
    const user_no = Number(req.query.user_no);
    if (!Number.isInteger(user_no) || user_no <= 0) {
      return res.status(400).json({ message: 'user_no는 양의 정수여야 합니다.' });
    }

    const title = String(req.query.title || '').trim();
    if (!title) {
      return res.status(400).json({ message: 'title이 필요합니다.' });
    }

    const like = `%${title}%`;
    const [rows] = await db.query(`
      SELECT report_no AS id, r_title AS title,
             DATE_FORMAT(IFNULL(r_date, createdDate), '%Y-%m-%d') AS date
      FROM report
      WHERE user_no=? AND report_flag='voice' AND COALESCE(r_del,0)=0
        AND r_title LIKE ?
      ORDER BY COALESCE(r_date, createdDate) DESC
      LIMIT 50
    `, [user_no, like]);

    return res.json({ items: rows, total: rows.length });
  } catch (err) {
    console.error('[voice] search error:', err);
    next(err);
  }
}
