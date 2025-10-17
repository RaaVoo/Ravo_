// ------------------------------------------------------------------
// 홈캠 서비스 레이어 (ESM)
// - saveHomecam: DB insert + ffmpeg 녹화 시작
// - updateEndMeta: 녹화 종료/메타 업데이트
// - 목록/상세/검색/상태변경/삭제
// ------------------------------------------------------------------

import * as repo from '../repositories/HomecamRepository.js';
import RecordWorker from './RecordWorker.js';

import { getPresignedUrl } from '../utils/s3-presign.js';   // 잠깐 추가 (251017) - 잘 작동 하는지 관련 문제

// HLS 기본 주소 및 경로
const HLS_BASE = (process.env.HLS_BASE || 'http://127.0.0.1:8888').replace(/\/+$/, '');
const CAM_PATH = process.env.CAM_PATH || 'cam';

// 폴백 캡처 길이 (초)
const FALLBACK_SECONDS = Number(process.env.FALLBACK_SECONDS || 8);

// 여기 잠깐 추가 (251017 새벽) - 잘 작동 하는지 관련 문제
// URL 또는 key를 받아 S3 key만 뽑아냄
function extractKey(maybeUrlOrKey) {
  if (!maybeUrlOrKey) return null;
  try {
    const u = new URL(maybeUrlOrKey);
    return u.pathname.replace(/^\/+/, ''); // '/homecam/...' -> 'homecam/...'
  } catch {
    return maybeUrlOrKey; // 이미 key 형태
  }
}

// 1개 레코드에 대해 cam_url / snapshot_url을 프리사인으로 치환
async function signRow(row, ttlSec = 3600) {
  if (!row) return row;
  const camKey  = extractKey(row.cam_url);
  const snapKey = extractKey(row.snapshot_url);

  row.cam_url      = camKey  ? await getPresignedUrl(camKey,  ttlSec) : null;
  row.snapshot_url = snapKey ? await getPresignedUrl(snapKey, ttlSec) : null;
  return row;
}

// 상세 조회 + 프리사인 URL로 치환해서 반환
export async function getDetailSigned(record_no, ttlSec = 3600) {
  const [rows] = await repo.getHomecamDetail(record_no);
  const row = rows?.[0];
  if (!row) return null;
  return signRow(row, ttlSec);
}
// 여기까지 잠깐 추가 (251017 새벽) - 잘 작동 하는지 관련 문제

// JS Date → MySQL DATETIME
function toMySQLDateTime(val) {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* ==================================================================
 * [CREATE] 녹화 시작
 * ================================================================== */
export async function saveHomecam(data = {}) {
  const {
    user_no, r_start, r_end, p_start, p_end,
    record_title, cam_url, snapshot_url, cam_status
  } = data;

  const values = [
    user_no ?? null,
    toMySQLDateTime(r_start),
    toMySQLDateTime(r_end),
    toMySQLDateTime(p_start),
    toMySQLDateTime(p_end),
    record_title ?? null,
    cam_url ?? null,     // 초기엔 HLS 주소일 수 있음
    snapshot_url ?? '',
    cam_status || 'active'
  ];

  const [result] = await repo.insertHomecam(values);
  const record_no = result?.insertId;

  const sourceUrl = cam_url || `${HLS_BASE}/${CAM_PATH}/index.m3u8`;
  try {
    await RecordWorker.start({ record_no, sourceUrl });
    console.log('[HOMEcam] saveHomecam OK → record_no=%d, src=%s', record_no, sourceUrl);
  } catch (e) {
    console.error('[HOMEcam] saveHomecam: RecordWorker.start FAILED →', e.message);
  }

  return [result];
}

/* =========================
 * 상태 변경 / 삭제
 * ========================= */
export async function updateStatus(record_no, cam_status) {
  return repo.updateHomecamStatus(record_no, cam_status);
}

export async function deleteOne(record_no) {
  return repo.softDeleteHomecam(record_no);
}

export async function deleteMany(record_nos, isHardDelete) {
  return repo.deleteMultipleHomecams(record_nos, isHardDelete);
}

/* =========================
 * 목록 / 검색 / 상세
 * ========================= */
// export async function getHomecamList(query = {}) {
//   // 1) 입력 파싱 + 안전값
//   const page = Number.parseInt(query.page ?? '1', 10);
//   const size = Number.parseInt(query.size ?? '8', 10);
//   const dateFilter = (query.date || '').trim();

//   const pageSafe = Number.isFinite(page) && page > 0 ? page : 1;
//   const sizeSafe = Number.isFinite(size) && size > 0 ? size : 8;
//   const offset   = Math.max(0, (pageSafe - 1) * sizeSafe);

//   if (!Number.isInteger(offset) || !Number.isInteger(sizeSafe)) {
//     throw new Error('invalid offset/size');
//   }

//   // 2) WHERE + 바인딩(사용자 입력만 바인딩)
//   let where = ` WHERE record_del != 'Y'`;
//   const params = [];
//   if (dateFilter) {
//     where += ` AND DATE(r_start) = ?`;
//     params.push(dateFilter);
//   }

//   // 3) 목록 쿼리: LIMIT/OFFSET은 정수 리터럴로 직접 삽입 (mysql2 LIMIT 바인딩 이슈 회피)
//   const baseQuery = `
//     SELECT *
//       FROM homecam
//       ${where}
//      ORDER BY r_start DESC, record_no DESC
//      LIMIT ${offset}, ${sizeSafe}
//   `;

//   // 실행
//   const [rowsRaw] = await repo.getHomecamList(baseQuery, params);
//   const rows = Array.isArray(rowsRaw) ? rowsRaw : (rowsRaw ? [rowsRaw] : []);

//   // 4) 카운트
//   const countQuery = `
//     SELECT COUNT(*) AS total
//       FROM homecam
//       ${where}
//   `;
//   const [countRows] = await repo.getHomecamCount(countQuery, params);
//   const total = countRows?.[0]?.total ?? 0;
//   const totalPages = Math.max(1, Math.ceil(total / sizeSafe));

//   // 5) 응답
//   return { page: pageSafe, size: sizeSafe, total, totalPages, videos: rows };
// }

// // 하위 호환
// export async function getList(page, pageSize, date) {
//   return getHomecamList({ page, size: pageSize, date });
// }

// export async function searchByDate(date) {
//   return repo.searchByDate(date);
// }

// export async function getDetail(record_no) {
//   return repo.getHomecamDetail(record_no);
// }

// services/HomecamService.js

export async function getHomecamList(query = {}) {
  // ✅ 로그인 사용자 번호(컨트롤러에서 주입됨)
  const userNo = Number(query.userNo);
  if (!Number.isInteger(userNo) || userNo <= 0) {
    throw new Error('userNo 누락 또는 형식 오류');
  }

  // 1) 입력 파싱 + 안전값
  const page = Number.parseInt(query.page ?? '1', 10);
  const size = Number.parseInt(query.size ?? '8', 10);
  const dateFilter = (query.date || '').trim();

  const pageSafe = Number.isFinite(page) && page > 0 ? page : 1;
  const sizeSafe = Number.isFinite(size) && size > 0 ? size : 8;
  const offset   = Math.max(0, (pageSafe - 1) * sizeSafe);

  if (!Number.isInteger(offset) || !Number.isInteger(sizeSafe)) {
    throw new Error('invalid offset/size');
  }

  // 2) WHERE + 바인딩(사용자 입력만 바인딩)
  let where = ` WHERE record_del != 'Y' AND user_no = ?`;   // ✅ 사용자별 필터
  const params = [userNo];

  if (dateFilter) {
    where += ` AND DATE(r_start) = ?`;
    params.push(dateFilter);
  }

  // 3) 목록 쿼리
  const baseQuery = `
    SELECT *
      FROM homecam
      ${where}
     ORDER BY r_start DESC, record_no DESC
     LIMIT ${offset}, ${sizeSafe}
  `;

  const [rowsRaw] = await repo.getHomecamList(baseQuery, params);
  const rows = Array.isArray(rowsRaw) ? rowsRaw : (rowsRaw ? [rowsRaw] : []);

  // 4) 카운트
  const countQuery = `
    SELECT COUNT(*) AS total
      FROM homecam
      ${where}
  `;
  const [countRows] = await repo.getHomecamCount(countQuery, params);
  const total = countRows?.[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / sizeSafe));

  // 5) 응답
  return { page: pageSafe, size: sizeSafe, total, totalPages, videos: rows };
}

// 하위 호환(사용 중이면 userNo도 받도록 변경)
export async function getList(page, pageSize, date, userNo) {
  return getHomecamList({ page, size: pageSize, date, userNo });
}

// (아래 둘은 그대로 사용해도 OK — 추후 소유자 보호가 필요하면 여기도 userNo 추가)
export async function searchByDate(date) {
  return repo.searchByDate(date);
}
export async function getDetail(record_no) {
  return repo.getHomecamDetail(record_no);
}


/* ====================================================================================
 * 종료 메타 업데이트
 * ==================================================================================== */
export async function updateEndMeta(record_no, meta = {}) {
  console.log('[endMeta] called → record_no=%s, meta.r_end=%s', record_no, meta?.r_end);

  let videoUrl = meta.cam_url ?? null;
  let thumbUrl = meta.snapshot_url ?? null;
  let durationSec = meta.duration_sec ?? null;

  let stopped = false;
  let usedFallback = false;

  // 1) 정상: ffmpeg 세션 종료 + 실제 길이
  try {
    const { s3Url, s3Thumb, durationSec: d } = await RecordWorker.stopAndUpload(record_no);
    console.log('[endMeta] stopAndUpload OK → dur=%s, url=%s', d, s3Url);
    videoUrl = s3Url || videoUrl;
    thumbUrl = s3Thumb || thumbUrl;
    durationSec = d ?? durationSec;
    stopped = true;
  } catch (e) {
    console.warn('[endMeta] stopAndUpload FAIL → fallback 시도:', e.message);
  }

  // 2) 폴백: HLS에서 캡처
  if (!stopped && !videoUrl) {
    let hls = null;
    try {
      const [rows] = await repo.getHomecamDetail(record_no);
      hls = rows?.[0]?.cam_url;
    } catch {}
    if (!hls) hls = `${HLS_BASE}/${CAM_PATH}/index.m3u8`;

    try {
      const { s3Url, s3Thumb, durationSec: d } =
        await RecordWorker.grabNow(hls, FALLBACK_SECONDS, `fallback_${record_no}`);
      console.log('[endMeta] fallback grabNow OK → dur=%s, url=%s', d, s3Url);
      videoUrl = s3Url || videoUrl;
      thumbUrl = s3Thumb || thumbUrl;
      durationSec = d ?? durationSec;
      usedFallback = true;
    } catch (e) {
      console.error('[endMeta] fallback grabNow error:', e.message);
    }
  }

  // 3) 길이 보정: r_start~r_end로 보정
  if (!durationSec || usedFallback) {
    try {
      const [rows] = await repo.getHomecamDetail(record_no);
      const rStart = rows?.[0]?.r_start;
      const rEnd   = meta?.r_end ? new Date(meta.r_end) : new Date();
      if (rStart && rEnd && !Number.isNaN(new Date(rStart).getTime())) {
        const s = new Date(rStart).getTime();
        const e = rEnd.getTime();
        durationSec = Math.max(1, Math.round((e - s) / 1000));
        console.log('[endMeta] duration corrected by r_start~r_end → %ds', durationSec);
      }
    } catch (e) {
      console.warn('[endMeta] duration correction failed:', e.message);
    }
  }

  // 4) DB 업데이트
  const payload = {
    ...meta,
    r_end: toMySQLDateTime(meta?.r_end || new Date()),
    cam_url: videoUrl || null,
    snapshot_url: thumbUrl || null,
    duration_sec: durationSec ?? null,
  };

  const ret = await repo.updateEndMeta(record_no, payload);
  console.log('[endMeta] DB updated → record_no=%s, duration_sec=%s', record_no, payload.duration_sec);
  return ret;
}

export const endHomecam = updateEndMeta;

export default {
  saveHomecam,
  updateStatus,
  deleteOne,
  deleteMany,
  getHomecamList,
  getList,
  searchByDate,
  getDetail,
  updateEndMeta,
  endHomecam,
  getDetailSigned     // 이거 잠깐 추가함
};
