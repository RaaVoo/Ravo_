/**
 * 홈캠 서비스 레이어
 * - 유효성 검사, 데이터 가공, 로직 처리
 * - repository와 controller 사이의 중간 계층
 */

const repo = require('../repositories/homecam.repository');

exports.saveHomecam = async (data) => {
  const {
    user_no, r_start, r_end, p_start, p_end,
    record_title, cam_url, snapshot_url, cam_status
  } = data;

  const values = [
    user_no,
    r_start,
    r_end,
    p_start,
    p_end,
    record_title,
    cam_url,
    snapshot_url,
    cam_status || 'active'  // 기본값 처리
  ];

  return await repo.insertHomecam(values);
};

exports.updateStatus = async (record_no, cam_status) => {
  return await repo.updateHomecamStatus(record_no, cam_status);
};

exports.deleteOne = async (record_no) => {
  return await repo.softDeleteHomecam(record_no);
};

exports.deleteMany = async (record_nos, isHardDelete) => {
  return await repo.deleteMultipleHomecams(record_nos, isHardDelete);
};

exports.getList = async (page, pageSize, dateFilter) => {
  const offset = (page - 1) * pageSize;
  const countParams = [];
  let baseQuery = `SELECT * FROM homecam WHERE record_del != 'Y'`;
  let countQuery = `SELECT COUNT(*) AS total FROM homecam WHERE record_del != 'Y'`;

  if (dateFilter) {
    baseQuery += ` AND DATE(r_start) = ?`;
    countQuery += ` AND DATE(r_start) = ?`;
    countParams.push(dateFilter);
  }

  baseQuery += ` ORDER BY createdDate DESC LIMIT ${offset}, ${pageSize}`;

  const [rows] = dateFilter
    ? await repo.getHomecamList(baseQuery, [dateFilter])
    : await repo.getHomecamListNoBind(baseQuery);

  const [countRows] = await repo.getHomecamCount(countQuery, countParams);
  const total = countRows[0].total;
  const totalPages = Math.ceil(total / pageSize);

  return {
    page,
    totalPages,
    total,
    videos: rows
  };
};

exports.searchByDate = async (date) => {
  return await repo.searchByDate(date);
};

exports.getDetail = async (record_no) => {
  return await repo.getHomecamDetail(record_no);
};
