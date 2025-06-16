// 서비스 로직 호출용
const service = require('../services/homecam.service');


 // [홈캠 영상 저장]

 // record_no - 기본 키, 고유번호 AUTO_INCREMENT라서 자동 생성됨 (입력 안 해도 됨)
// createdDate	최초 생성일	DEFAULT CURRENT_TIMESTAMP로 자동 저장됨
// modifiedDate	수정일	ON UPDATE CURRENT_TIMESTAMP로 자동 갱신됨 (수정 시)
// 그 외 나머지 다 저장

exports.saveHomecam = async (req, res) => {
  try {
    await service.saveHomecam(req.body);
    res.status(201).json({ message: '홈캠 영상 저장 성공!' });
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ error: 'DB 저장 실패' });
  }
};


// [홈캠 상태 변경]
exports.updateHomecamStatus = async (req, res) => {
  const { record_no } = req.params;
  const { cam_status } = req.body;
  const validStatus = ['active', 'inactive', 'paused'];

  // 유효한 상태값인지 검사 - cam_status가 없거나 잘못된 값인 경우
  if (!validStatus.includes(cam_status)) {
    return res.status(400).json({ message: 'cam_status 값이 유효하지 않습니다.' });
  }

  try {
    const [result] = await service.updateStatus(record_no, cam_status);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '해당 홈캠 영상이 존재하지 않습니다.' });
    }
    res.status(200).json({ message: '홈캠 상태가 성공적으로 변경되었습니다.' });
  } catch (err) {
    console.error('상태 변경 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
};

// [홈캠 단일 삭제] 소프트 딜리트 처리 (record_del = 'Y')
exports.deleteHomecam = async (req, res) => {
  try {
    const [result] = await service.deleteOne(req.params.record_no);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '해당 영상이 존재하지 않습니다.' });
    }
    res.status(200).json({ message: ' 홈캠 영상이 삭제 처리되었습니다.' });
  } catch (err) {
    console.error('삭제 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
};

// [홈캠 다중 삭제] 여러 영상을 소프트 또는 하드 딜리트 처리
exports.deleteMultipleHomecams = async (req, res) => {
  const { record_nos, isHardDelete } = req.body;

  if (!Array.isArray(record_nos) || record_nos.length === 0) {
    return res.status(400).json({ message: '삭제할 영상 번호를 배열로 전달해주세요.' });
  }

  try {
    const [result] = await service.deleteMany(record_nos, isHardDelete);
    res.status(200).json({ message: ` 총 ${result.affectedRows}개의 영상이 삭제 처리되었습니다.` });
  } catch (err) {
    console.error('다중 삭제 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
};

//  [홈캠 목록 조회] 삭제되지 않은 영상만 페이지 단위로 조회 + 날짜 필터링
exports.getHomecamList = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const date = req.query.date || '';

  try {
    const result = await service.getList(page, 8, date);
    res.status(200).json(result);
  } catch (err) {
    console.error(' 홈캠 목록 조회 오류:', err);
    res.status(500).json({ message: 'DB 조회 실패', error: err.message });
  }
};

// [홈캠 날짜 기반 검색] 쿼리 파라미터로 받은 날짜(date)로 영상 목록 조회(r_start의 날짜가 일치하는)
exports.searchHomecam = async (req, res) => {
  let { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: '날짜(date) 쿼리 파라미터가 필요합니다.' });
  }

  // 다양한 날짜 형식 지원: 0614, 20250614, 2025-06-14
  if (date.length === 4) {
    const year = new Date().getFullYear();
    date = `${year}-${date.slice(0, 2)}-${date.slice(2, 4)}`;
  } else if (date.length === 8 && /^\d{8}$/.test(date)) {
    date = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  }

  try {
    const [rows] = await service.searchByDate(date);
    res.status(200).json(rows);
  } catch (err) {
    console.error('홈캠 날짜 검색 오류:', err);
    res.status(500).json({ message: 'DB 검색 실패' });
  }
};

//  [홈캠 상세 조회] record_no로 특정 영상의 상세정보 조회
exports.getHomecamDetail = async (req, res) => {
  try {
    const [rows] = await service.getDetail(req.params.record_no);
    if (rows.length === 0) {
      return res.status(404).json({ message: '해당 영상이 존재하지 않습니다.' });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('홈캠 상세조회 오류:', err);
    res.status(500).json({ message: 'DB 조회 실패', error: err });
  }
};
