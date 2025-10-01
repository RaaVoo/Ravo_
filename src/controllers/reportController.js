//src/controllers/reportControllers.js
import { pool as db } from '../config/db.js';

// 1. 등록
export const createReport = (req, res) => {
  const { r_title, r_content, user_no, report_flag } = req.body;
  const sql = `INSERT INTO report (r_title, r_content, user_no, report_flag, r_del, createdDate, modifiedDate)
            VALUES (?, ?, ?, ?, false, NOW(), NOW())`;
  db.query(sql, [r_title, r_content, user_no, report_flag], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ message: '등록 성공', report_no: result.insertId });
  });
};

// 2. 상세 조회
export const getReportById = (req, res) => {
  const sql = `SELECT * FROM report WHERE report_no = ? AND r_del = false`;
  db.query(sql, [req.params.record_no], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    if (rows.length === 0) return res.status(404).json({ message: '존재하지 않음' });
    res.json(rows[0]);
  });
};

// 3. 리스트 조회 (유저별)
export const getReportList = (req, res) => {
  const sql = `SELECT * FROM report WHERE user_no = ? AND r_del = false`;
  db.query(sql, [req.query.user_no], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
};

// 4. 삭제
export const deleteReport = (req, res) => {
  const sql = `UPDATE report SET r_del = true WHERE report_no = ?`;
  db.query(sql, [req.params.record_no], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: '삭제 완료 (soft delete)' });
  });
};

// 5. 검색 (예: 제목 검색)
export const searchReports = (req, res) => {
  const keyword = req.query.keyword;

  if (!keyword) {
    return res.status(400).json({ message: '검색어(keyword)를 입력해주세요.' });
  }

  const likeKeyword = `%${keyword}%`;

  const sql = `
    SELECT * FROM report
    WHERE (r_title LIKE ? OR r_content LIKE ?)
    AND r_del = false
  `;

  db.query(sql, [likeKeyword, likeKeyword], (err, rows) => {
    if (err) return res.status(500).json({ error: err });

    res.status(200).json(rows);
  });
};
