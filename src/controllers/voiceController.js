//src/controllers/voiceController.js
// DB 연결 모듈
import { pool as db } from '../config/db.js';

// 목록 조회
// [GET] /voice/reports-list?user_no=1
export async function getVoiceReportList(req, res, next) {
  try {
    // 디버그 로그
    const user_no_raw = req.query.user_no;
    const user_no = Number(user_no_raw);
    console.log('[voice] /reports-list called:', { user_no_raw, user_no });

    if (!user_no) {
      return res.status(400).json({ message: 'user_no가 필요합니다.' });
    }

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

    console.log('[voice] before query');
    const [rows] = await db.query(sql, [user_no]);
    console.log('[voice] after query, rows:', rows.length);

    return res.json(rows);
  } catch (err) {
    console.error('[voice] query error:', err);
    return next(err);
  }
}

// 삭제
export async function deleteVoiceReport(req, res, next) {
  const voice_no = Number(req.params.voice_no);
  if (!voice_no) {
    return res.status(400).json({ message: 'voice_no가 필요합니다.' });
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
    next(e);
  }
}

// 등록-> AI 연동
export async function createVoiceReport(req, res, next) {
  try {
    const {
      user_no,
      r_title,
      r_content = null,
      r_date = null,
      emotion_summary = null,
      keyword_summary = null,
      action_summary = null,
      r_overall_review = null,
      r_solution = null,
    } = req.body;

    if (!user_no || !r_title) {
      return res.status(400).json({ message: 'user_no와 r_title은 필수입니다.' });
    }

    const sql = `
      INSERT INTO report
        (user_no, r_title, r_content, emotion_summary, keyword_summary, action_summary,
         r_overall_review, r_solution, report_flag, r_del, r_date, createdDate, modifiedDate)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, 'voice', 0, COALESCE(?, NOW()), NOW(), NOW())
    `;

    const params = [
      user_no, r_title, r_content,
      emotion_summary, keyword_summary, action_summary,
      r_overall_review, r_solution,
      r_date
    ];

    const [result] = await db.query(sql, params);

    return res.status(201).json({
      id: result.insertId,
      title: r_title,
      date: r_date || new Date().toISOString().slice(0, 10),
      message: '음성 보고서가 등록되었습니다.'
    });
  } catch (err) {
    return next(err);
  }
}

// ID 조회 (구현 필요)
export async function getVoiceReportById(req, res, next) {
  try {
    const voice_no = Number(req.params.voice_no);
    if (!voice_no) {
      return res.status(400).json({ message: 'voice_no가 필요합니다.' });
    }

    const sql = `
      SELECT
        report_no AS id,
        r_title   AS title,
        DATE_FORMAT(IFNULL(r_date, createdDate), '%Y-%m-%d') AS date,
        r_content,
        emotion_summary,
        keyword_summary,
        action_summary,
        r_overall_review,
        r_solution
      FROM report
      WHERE report_no = ?
        AND report_flag = 'voice'
        AND COALESCE(r_del, 0) = 0
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [voice_no]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '보고서를 찾을 수 없습니다.' });
    }
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
}

// 제목 검색 (구현 필요)
export async function getVoiceReportByTitle(req, res, next) {
  // TODO: 구현
}