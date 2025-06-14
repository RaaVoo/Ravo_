const db = require('../db');

// record_no - 기본 키, 고유번호 AUTO_INCREMENT라서 자동 생성됨 (입력 안 해도 됨)
// createdDate	최초 생성일	DEFAULT CURRENT_TIMESTAMP로 자동 저장됨
// modifiedDate	수정일	ON UPDATE CURRENT_TIMESTAMP로 자동 갱신됨 (수정 시)
// 그 외 나머지 다 저장


// 홈캠 저장
exports.saveHomecam = async (req, res) => {
  const {
    user_no, r_start, r_end, p_start, p_end,
    record_title, cam_url, snapshot_url, cam_status
  } = req.body;

  try {
    const sql = `
      INSERT INTO homecam (
        user_no, r_start, r_end, p_start, p_end,
        record_title, cam_url, snapshot_url, cam_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      user_no, r_start, r_end, p_start, p_end,
      record_title, cam_url, snapshot_url, cam_status
    ];

    await db.execute(sql, values);
    res.status(201).json({ message: '홈캠 영상 저장 성공!' });
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ error: 'DB 저장 실패' });
  }
};

// 홈캠 상태 변경
exports.updateHomecamStatus = async (req, res) => {
  const { record_no } = req.params;
  const { cam_status } = req.body;

  // cam_status가 없거나 잘못된 값인 경우
  const validStatus = ['active', 'inactive', 'paused'];
  if (!validStatus.includes(cam_status)) {
    return res.status(400).json({ message: 'cam_status 값이 유효하지 않습니다.' });
  }

  try {
    const [result] = await db.execute(
      'UPDATE homecam SET cam_status = ? WHERE record_no = ?',
      [cam_status, record_no]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '해당 홈캠 영상이 존재하지 않습니다.' });
    }

    res.status(200).json({ message: '홈캠 상태가 성공적으로 변경되었습니다.' });
  } catch (error) {
    console.error('상태 변경 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
};

// 홈캠 단일 삭제 - 소프트 딜리트 (기본)
exports.deleteHomecam = async (req, res) => {
  const { record_no } = req.params;

  try {
    const [result] = await db.execute(
      'UPDATE homecam SET record_del = ? WHERE record_no = ?',
      ['Y', record_no]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '해당 영상이 존재하지 않습니다.' });
    }

    res.status(200).json({ message: '✅ 홈캠 영상이 삭제 처리되었습니다.' });
  } catch (error) {
    console.error('삭제 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
};


// 홈캠 다중 삭제 - 체크박스 선택 기반, 소프트/하드 선택 가능
exports.deleteMultipleHomecams = async (req, res) => {
  const { record_nos, isHardDelete } = req.body;

  if (!Array.isArray(record_nos) || record_nos.length === 0) {
    return res.status(400).json({ message: '삭제할 영상 번호를 배열로 전달해주세요.' });
  }

  try {
    const placeholders = record_nos.map(() => '?').join(', ');

    let query, params;
    if (isHardDelete) {
      query = `DELETE FROM homecam WHERE record_no IN (${placeholders})`;
      params = record_nos;
    } else {
      query = `UPDATE homecam SET record_del = 'Y' WHERE record_no IN (${placeholders})`;
      params = record_nos;
    }

    const [result] = await db.execute(query, params);

    res.status(200).json({ message: `✅ 총 ${result.affectedRows}개의 영상이 삭제 처리되었습니다.` });
  } catch (error) {
    console.error('다중 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
};

// ✅ 홈캠 영상 목록 조회 (삭제 제외 + 페이징 + 날짜 필터 추가됨)
exports.getHomecamList = async (req, res) => {
  const rawPage = req.query.page;
  const page = parseInt(rawPage, 10);
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;

  const pageSize = 8;
  const offset = (safePage - 1) * pageSize;
  const dateFilter = req.query.date || '';

  try {
    const countParams = [];
    let baseQuery = `SELECT * FROM homecam WHERE record_del != 'Y'`;
    let countQuery = `SELECT COUNT(*) AS total FROM homecam WHERE record_del != 'Y'`;

    if (dateFilter) {
      baseQuery += ` AND DATE(r_start) = ?`;
      countQuery += ` AND DATE(r_start) = ?`;
      countParams.push(dateFilter);
    }

    baseQuery += ` ORDER BY createdDate DESC LIMIT ${offset}, ${pageSize}`;

    // 🔍 로그 확인
    console.log('🟨 baseQuery:', baseQuery);
    console.log('🟦 countParams:', countParams);

    const [rows] = dateFilter
      ? await db.execute(baseQuery, [dateFilter])
      : await db.query(baseQuery);  // 🔁 query 사용 (LIMIT 안에 숫자 직접 바인딩했기 때문에!)

    const [countRows] = await db.execute(countQuery, countParams);
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / pageSize);

    res.status(200).json({
      page: safePage,
      totalPages,
      total,
      videos: rows
    });
  } catch (error) {
    console.error('🔥 홈캠 목록 조회 오류:', error);
    res.status(500).json({
      message: 'DB 조회 실패',
      error: error.message
    });
  }
};



// ✅ 홈캠 날짜 기반 검색 (r_start의 날짜가 일치하는 영상 목록 조회)
exports.searchHomecam = async (req, res) => {
  let { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: '날짜(date) 쿼리 파라미터가 필요합니다.' });
  }

  // ✅ 다양한 형식 처리: "0614", "20250614", "2025-06-14"
  if (date.length === 4) {
    // 예: "0614" → 오늘 연도 기준 "2025-06-14"
    const year = new Date().getFullYear(); // 또는 최신 날짜 기준으로 변경 가능
    date = `${year}-${date.slice(0, 2)}-${date.slice(2, 4)}`;
  } else if (date.length === 8 && /^\d{8}$/.test(date)) {
    // 예: "20250614" → "2025-06-14"
    date = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  }

  try {
    const sql = `
      SELECT * FROM homecam
      WHERE record_del != 'Y' AND DATE(r_start) = ?
      ORDER BY createdDate DESC
    `;
    const [rows] = await db.execute(sql, [date]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('홈캠 날짜 검색 오류:', error);
    res.status(500).json({ message: 'DB 검색 실패' });
  }
};

// 홈캠 상세페이지 - record_no에 해당하는 홈캠 영상 하나의 모든 정보가 정확히 조회(나중에 선택해서 가져오고 싶은것만 가져올수있도록 수정가능능)
exports.getHomecamDetail = async (req, res) => {
  const { record_no } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM homecam WHERE record_no = ? AND record_del != 'Y'`,
      [record_no]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '해당 영상이 존재하지 않습니다.' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('홈캠 상세조회 오류:', error);
    res.status(500).json({ message: 'DB 조회 실패', error });
  }
};

