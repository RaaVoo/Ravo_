// backend/controllers/HomecamController.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const service = require('../services/HomecamService');

/* 유틸: 서비스 함수 이름이 코드마다 다를 수 있어 안전하게 선택 */
const pick = (...fns) => fns.find((f) => typeof f === 'function');

/**
 * [POST] /homecam/save
 * 녹화 row 생성 후 insertId(record_no) 반환
 */
export const saveHomecam = async (req, res) => {
  try {
    const saveFn = pick(service.saveHomecam, service.createRecording);
    if (!saveFn) throw new Error('service.saveHomecam 미구현');

    // 세션/토큰에서 사용자 번호 추출(프로젝트 인증 방식에 맞게) - 251006 추가
    const resolvedUserNo =
      req.user?.user_no || req.user?.id ||        // Passport 세션 사용 시
      req.authUser?.user_no || req.authUser?.id ||// JWT 미들웨어가 넣어준 경우
      req.body?.user_no || null;                  // 마지막 폴백
    if (!resolvedUserNo) {
      return res.status(401).json({ error: '로그인이 필요합니다.(user_no 없음)' });
    }
    const body = { ...req.body, user_no: resolvedUserNo }; // ✅ 서버가 최종 확정
    const [result] = await saveFn(body);  // 여기까지
    //const [result] = await saveFn(req.body); // mysql2: [result].insertId  // 잠깐 주석 (원래 코드)

    const record_no = result?.insertId;
    if (!record_no) {
      return res.status(500).json({ error: 'insertId 추출 실패' });
    }
    return res.status(201).json({ message: '홈캠 영상 저장 시작', record_no });
  } catch (err) {
    console.error('❌ DB Error(saveHomecam):', err);
    return res.status(500).json({
      error: 'DB 저장 실패',
      code: err?.code,
      errno: err?.errno,
      detail: err?.sqlMessage || String(err),
    });
  }
};

/**
 * [PATCH] /homecam/:record_no/status
 * cam_status: active | paused | inactive
 */
export const updateHomecamStatus = async (req, res) => {
  const { record_no } = req.params;
  const { cam_status } = req.body;
  const validStatus = ['active', 'inactive', 'paused'];

  if (!record_no) return res.status(400).json({ error: 'record_no 필요' });
  if (!validStatus.includes(cam_status)) {
    return res.status(400).json({ error: 'cam_status 값이 유효하지 않습니다.' });
  }

  try {
    const statusFn = pick(service.updateHomecamStatus, service.updateStatus);
    if (!statusFn) throw new Error('service.updateHomecamStatus 미구현');

    const [result] = await statusFn(record_no, cam_status);
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: '해당 record_no 없음' });
    }
    return res.json({ message: '홈캠 상태 변경 성공' });
  } catch (err) {
    console.error('❌ DB Error(updateHomecamStatus):', err);
    return res.status(500).json({
      error: 'DB 상태 변경 실패',
      code: err?.code,
      errno: err?.errno,
      detail: err?.sqlMessage || String(err),
    });
  }
};

/**
 * [PATCH] /homecam/:record_no/end
 * 종료 메타데이터 업데이트 (r_end 필수)
 * Body: { r_end, cam_url?, snapshot_url?, duration_sec? }
 */
export const updateEndTime = async (req, res) => {
  const { record_no } = req.params;
  const { r_end, cam_url, snapshot_url, duration_sec } = req.body;

  if (!record_no) return res.status(400).json({ error: 'record_no 필요' });
  if (!r_end) return res.status(400).json({ error: 'r_end(ISO) 필요' });

  try {
    const endFn = pick(service.endHomecam, service.updateEndMeta);
    if (!endFn) throw new Error('service.endHomecam/updateEndMeta 미구현');

    const [result] = await endFn(record_no, {
      r_end,
      cam_url: cam_url ?? null,
      snapshot_url: snapshot_url ?? null,
      duration_sec: duration_sec ?? null,
    });

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: '해당 record_no 없음' });
    }
    return res.json({ message: '종료 메타데이터 저장 완료' });
  } catch (err) {
    console.error('❌ updateEndTime Error:', err);
    return res.status(500).json({
      error: 'DB 종료시간 저장 실패',
      code: err?.code,
      errno: err?.errno,
      detail: err?.sqlMessage || String(err),
    });
  }
};

/**
 * [DELETE] /homecam/camlist/:record_no
 * 단일 삭제 (기본 소프트 삭제: record_del='Y')
 */
export const deleteHomecam = async (req, res) => {
  const { record_no } = req.params;
  const { isHardDelete } = req.query;

  if (!record_no) return res.status(400).json({ error: 'record_no 필요' });

  try {
    const delOne = pick(service.deleteHomecam, service.deleteOne);
    if (!delOne) throw new Error('service.deleteHomecam/deleteOne 미구현');

    const [result] = await delOne(record_no, isHardDelete === 'true');
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: '해당 record_no 없음' });
    }
    return res.json({ message: '삭제 성공' });
  } catch (err) {
    console.error('❌ DB Error(deleteHomecam):', err);
    return res.status(500).json({
      error: '삭제 실패',
      code: err?.code,
      errno: err?.errno,
      detail: err?.sqlMessage || String(err),
    });
  }
};

/**
 * [DELETE] /homecam/camlist
 * 다중 삭제
 * Body: { record_nos: number[], isHardDelete?: boolean }
 */
export const deleteMultipleHomecams = async (req, res) => {
  const { record_nos, isHardDelete } = req.body || {};
  if (!Array.isArray(record_nos) || record_nos.length === 0) {
    return res.status(400).json({ error: 'record_nos 배열 필요' });
  }

  try {
    const delMany = pick(service.deleteMultipleHomecams, service.deleteMany);
    if (!delMany) throw new Error('service.deleteMultipleHomecams/deleteMany 미구현');

    const [result] = await delMany(record_nos, !!isHardDelete);
    return res.json({ message: '다중 삭제 성공', affectedRows: result?.affectedRows ?? 0 });
  } catch (err) {
    console.error('❌ DB Error(deleteMultipleHomecams):', err);
    return res.status(500).json({
      error: '다중 삭제 실패',
      code: err?.code,
      errno: err?.errno,
      detail: err?.sqlMessage || String(err),
    });
  }
};

/**
 * [GET] /homecam/camlist
 * 목록 조회 (페이지/날짜 필터)
 */
// export const getHomecamList = async (req, res) => {
//   try {
//     const listFn = pick(service.getHomecamList, service.getList);
//     if (!listFn) throw new Error('service.getHomecamList/getList 미구현');

//     // const data = await listFn(req.query);
//     // return res.json(data);
//     const data = await listFn(req.query);   // { page, size, total, totalPages, videos }
//     const videos = Array.isArray(data?.videos)
//       ? data.videos
//       : (data?.videos ? [data.videos] : []);  // ← 한 개일 때도 배열로
//     return res.json({ ...data, videos }); 
    
//   } catch (err) {
//     console.error('❌ DB Error(getHomecamList):', err);
//     return res.status(500).json({
//       error: '목록 조회 실패',
//       code: err?.code,
//       errno: err?.errno,
//       detail: err?.sqlMessage || String(err),
//     });
//   }
// };

// 수정
export const getHomecamList = async (req, res) => {
  try {
    // ✅ 로그인 사용자 번호 해석 (Passport/JWT 모두 대응)
    const resolvedUserNo =
      req.user?.user_no || req.user?.id ||
      req.authUser?.user_no || req.authUser?.id ||
      null;

    if (!resolvedUserNo) {
      return res.status(401).json({ error: '로그인이 필요합니다.(user_no 없음)' });
    }

    const listFn = [service.getHomecamList, service.getList].find(f => typeof f === 'function');
    if (!listFn) throw new Error('service.getHomecamList/getList 미구현');

    // ✅ 서버가 user_no를 주입해서 서비스로 보냄 (프론트는 user_no 안 보내도 됨)
    const data = await listFn({ ...req.query, userNo: Number(resolvedUserNo) });

    // 한 개만 와도 배열로 보장
    const videos = Array.isArray(data?.videos)
      ? data.videos
      : (data?.videos ? [data.videos] : []);

    return res.json({ ...data, videos });
  } catch (err) {
    console.error('❌ DB Error(getHomecamList):', err);
    return res.status(500).json({
      error: '목록 조회 실패',
      code: err?.code,
      errno: err?.errno,
      detail: err?.sqlMessage || String(err),
    });
  }
};

/**
 * [GET] /homecam/camlist/search
 * 날짜/키워드 검색
 */
export const searchHomecam = async (req, res) => {
  try {
    const searchFn = pick(service.searchHomecam, service.searchByDate);
    if (!searchFn) throw new Error('service.searchHomecam/searchByDate 미구현');

    const data = await searchFn(req.query);
    return res.json(data);
  } catch (err) {
    console.error('❌ DB Error(searchHomecam):', err);
    return res.status(500).json({
      error: '검색 실패',
      code: err?.code,
      errno: err?.errno,
      detail: err?.sqlMessage || String(err),
    });
  }
};

/**
 * [GET] /homecam/camlist/:record_no
 * 단건 상세
 */
export const getHomecamDetail = async (req, res) => {
  const { record_no } = req.params;
  if (!record_no) return res.status(400).json({ error: 'record_no 필요' });

  try {
    const detailFn = pick(service.getHomecamDetail, service.getDetail);
    if (!detailFn) throw new Error('service.getHomecamDetail/getDetail 미구현');

    // mysql2는 [rows, fields] 형태를 반환하므로 rows만 언랩
    const [rows] = await detailFn(record_no);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: '데이터 없음' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('❌ DB Error(getHomecamDetail):', err);
    return res.status(500).json({
      error: '상세 조회 실패',
      code: err?.code,
      errno: err?.errno,
      detail: err?.sqlMessage || String(err),
    });
  }
};

// ✅ default export로 라우트에서 쉽게 import 가능
export default {
  saveHomecam,
  updateHomecamStatus,
  updateEndTime,
  deleteHomecam,
  deleteMultipleHomecams,
  getHomecamList,
  searchHomecam,
  getHomecamDetail,
};