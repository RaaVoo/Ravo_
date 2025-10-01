// backend/service/HomecamService.js
// ------------------------------------------------------------------
// 홈캠 서비스 레이어 (유효성 검사/가공/비즈 로직)
// - saveHomecam: DB insert + ffmpeg 녹화 시작
// - updateEndMeta: 녹화 종료/메타 업데이트 (정상 종료 or 폴백 처리)
// - 목록, 상세, 검색, 상태변경, 삭제 등
// ------------------------------------------------------------------

// 리포지토리는 CJS일 수 있으므로 require 사용 (확장자 없이도 동작)
import * as repo from '../repositories/HomecamRepository.js';

// RecordWorker는 ESM으로 변환되어 있다고 가정
import RecordWorker from './RecordWorker.js';

// HLS 기본 주소 및 경로 (프론트에서 안 보내면 이 값 사용)
const HLS_BASE = (process.env.HLS_BASE || 'http://127.0.0.1:8888').replace(/\/+$/, '');
const CAM_PATH = process.env.CAM_PATH || 'cam';

// 폴백 캡처 길이 (초)
const FALLBACK_SECONDS = Number(process.env.FALLBACK_SECONDS || 8);

// --------------------------------------------------------------
// 유틸: JS Date/문자열 → MySQL DATETIME (YYYY-MM-DD hh:mm:ss)
// --------------------------------------------------------------
function toMySQLDateTime(val) {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* ==================================================================
 * [CREATE] 녹화 시작
 * - DB에 한 행을 만들고, ffmpeg 워커(RecordWorker.start)를 가동
 * - cam_url은 처음엔 HLS 주소일 수 있음 (최종 mp4는 종료 시 세팅)
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
    cam_url ?? null,        // 초기에는 HLS 주소가 들어올 수 있음
    snapshot_url ?? '',
    cam_status || 'active'
  ];

  const [result] = await repo.insertHomecam(values);
  const record_no = result?.insertId;

  // ffmpeg 녹화 시작 (우선순위: 프론트 cam_url → .env HLS_BASE/CAM_PATH)
  const sourceUrl = cam_url || `${HLS_BASE}/${CAM_PATH}/index.m3u8`;
  try {
    await RecordWorker.start({ record_no, sourceUrl });
    console.log('[HOMEcam] saveHomecam OK → record_no=%d, src=%s', record_no, sourceUrl);
  } catch (e) {
    console.error('[HOMEcam] saveHomecam: RecordWorker.start FAILED →', e.message);
    // DB insert는 성공했으므로, 녹화 실패만 로깅
  }

  return [result];
}

/* =========================
 * 상태 변경 / 삭제 관련 API
 * ========================= */
export async function updateStatus(record_no, cam_status) {
  return await repo.updateHomecamStatus(record_no, cam_status);
}

export async function deleteOne(record_no) {
  return await repo.softDeleteHomecam(record_no);
}

export async function deleteMany(record_nos, isHardDelete) {
  return await repo.deleteMultipleHomecams(record_nos, isHardDelete);
}

/* =========================
 * 목록 / 검색 / 상세 조회
 * ========================= */
export async function getHomecamList(query = {}) {
  const page = Number.parseInt(query.page ?? '1', 10);
  const size = Number.parseInt(query.size ?? '8', 10);
  const dateFilter = query.date || '';

  const pageSafe = Number.isFinite(page) && page > 0 ? page : 1;
  const sizeSafe = Number.isFinite(size) && size > 0 ? size : 8;

  const offset = (pageSafe - 1) * sizeSafe;
  const params = [];

  let baseQuery  = `SELECT * FROM homecam WHERE record_del != 'Y'`;
  let countQuery = `SELECT COUNT(*) AS total FROM homecam WHERE record_del != 'Y'`;

  if (dateFilter) {
    baseQuery  += ` AND DATE(r_start) = ?`;
    countQuery += ` AND DATE(r_start) = ?`;
    params.push(dateFilter);
  }

  baseQuery += ` ORDER BY createdDate DESC LIMIT ${offset}, ${sizeSafe}`;

  // const [rows] = params.length
  //   ? await repo.getHomecamList(baseQuery, params)
  //   : await repo.getHomecamListNoBind(baseQuery);

  const [rowsRaw] = params.length
   ? await repo.getHomecamList(baseQuery, params)
   : await repo.getHomecamListNoBind(baseQuery);
  const rows = Array.isArray(rowsRaw) ? rowsRaw : (rowsRaw ? [rowsRaw] : []);  // ✅ 배열 보정


  const [countRows] = await repo.getHomecamCount(countQuery, params);
  const total = countRows[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / sizeSafe));

  return { page: pageSafe, size: sizeSafe, total, totalPages, videos: rows };
}

// 하위 호환
export async function getList(page, pageSize, date) {
  return getHomecamList({ page, size: pageSize, date });
}

// 날짜/상세
export async function searchByDate(date) {
  return await repo.searchByDate(date);
}

export async function getDetail(record_no) {
  return await repo.getHomecamDetail(record_no);
}

/* ====================================================================================
 * ✅ 종료 메타 업데이트 (핵심)
 * - 정상 경로: 실행 중인 ffmpeg 세션을 종료(stopAndUpload) → mp4/썸네일/실제 길이(ffprobe)
 * - 폴백 경로: 세션이 없거나 종료 실패 시, HLS에서 FALLBACK_SECONDS만큼 캡처(grabNow)
 * - 추가 보정: 폴백이거나 durationSec이 비어있으면 r_start~r_end 차이로 실제 구간 길이 보정
 * ==================================================================================== */
export async function updateEndMeta(record_no, meta = {}) {
  console.log('[endMeta] called → record_no=%s, meta.r_end=%s', record_no, meta?.r_end);

  let videoUrl = meta.cam_url ?? null;
  let thumbUrl = meta.snapshot_url ?? null;
  let durationSec = meta.duration_sec ?? null;

  let stopped = false;       // 정상 경로 성공 여부
  let usedFallback = false;  // 폴백 사용 여부

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

  // 2) 폴백: DB에 저장된 HLS(또는 .env 기본 HLS)에서 N초 캡처
  if (!stopped && !videoUrl) {
    let hls = null;
    try {
      const [rows] = await repo.getHomecamDetail(record_no);
      hls = rows?.[0]?.cam_url;   // 초기 cam_url이 HLS일 수 있음
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

  // 3) 길이 보정: 폴백이었거나(durationSec 미확정) r_start~r_end로 "실제 녹화 구간" 보정
  if (!durationSec || usedFallback) {
    try {
      const [rows] = await repo.getHomecamDetail(record_no);
      const rStart = rows?.[0]?.r_start;
      const rEnd   = meta?.r_end ? new Date(meta.r_end) : new Date();
      if (rStart && rEnd && !Number.isNaN(new Date(rStart).getTime())) {
        const s = new Date(rStart).getTime();
        const e = rEnd.getTime();
        const delta = Math.max(1, Math.round((e - s) / 1000)); // 초 단위
        durationSec = delta;
        console.log('[endMeta] duration corrected by r_start~r_end → %ds', delta);
      }
    } catch (e) {
      console.warn('[endMeta] duration correction failed:', e.message);
    }
  }

  // 4) DB 업데이트 (r_end가 없으면 현재시각으로 마감)
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

// 별칭 (과거 호출명 호환)
export const endHomecam = updateEndMeta;

// ✅ default export (컨트롤러에서 default로 가져다 쓰고 싶을 때)
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
};