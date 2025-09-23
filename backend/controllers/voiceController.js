const db = require('../config/db');

// 등록
exports.createVoiceReport = (req, res) => {
    const { r_title, r_content, user_no } = req.body;

    const sql = `
    INSERT INTO report (r_title, r_content, user_no, report_flag, r_del, createdDate, modifiedDate)
    VALUES (?, ?, ?, 'voice', false, NOW(), NOW())
    `;

    db.query(sql, [r_title, r_content, user_no], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    res.status(201).json({ message: '음성 보고서 등록 성공', report_no: result.insertId });
    });
};

// 상세 조회
exports.getVoiceReportById = (req, res) => {
    const report_no = req.params.voice_no;
  const sql = `SELECT * FROM report WHERE report_no = ? AND report_flag = 'voice' AND r_del = false`;

    db.query(sql, [report_no], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    if (rows.length === 0) {
        return res.status(404).json({ message: '음성 보고서가 존재하지 않음' });
    }
    res.status(200).json(rows[0]);
    });
};

// 목록 조회
exports.getVoiceReportList = (req, res) => {
    const user_no = req.query.user_no;
    const sql = `
    SELECT * FROM report
    WHERE user_no = ? AND report_flag = 'voice' AND r_del = false
    ORDER BY createdDate DESC
    `;

    db.query(sql, [user_no], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.status(200).json(rows);
    });
};

// 삭제
exports.deleteVoiceReport = (req, res) => {
    const report_no = req.params.voice_no;
    const sql = `UPDATE report SET r_del = true WHERE report_no = ? AND report_flag = 'voice'`;

    db.query(sql, [report_no], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: '삭제할 음성 보고서를 찾을 수 없습니다' });
    }
    res.status(200).json({ message: '음성 보고서 삭제 완료' });
    });
};
