// 녹화 시작 시 HLS를 mp4로 그대로 copy 하도록 ffmpeg child를 띄움
// 정지 시 프로세스 종료 → 파일 경로를 돌려줌

// backend/recorder/RecorderManager.js
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const STORAGE_DIR = process.env.STORAGE_LOCAL_DIR || path.join(__dirname, '..', 'storage');
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

/**
 * record_no => { proc, filePath }
 */
const running = new Map();

/**
 * 시작: HLS → MP4 (copy, faststart)
 */
async function start(record_no, hlsUrl) {
  const outPath = path.join(STORAGE_DIR, `record_${record_no}.mp4`);

  // 기존 파일 있으면 삭제
  try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch {}

  return new Promise((resolve, reject) => {
    const command = ffmpeg(hlsUrl)
      .inputOptions(['-rw_timeout', '5000000'])              // 네트워크 타임아웃
      .outputOptions(['-c', 'copy', '-movflags', '+faststart'])
      .on('start', (cmd) => {
        running.set(String(record_no), { command, filePath: outPath });
        resolve({ filePath: outPath });
      })
      .on('error', (err) => {
        running.delete(String(record_no));
        reject(err);
      })
      .on('end', () => {
        // end는 stop()에서 kill 후에도 호출됨
      })
      .save(outPath);
  });
}

/**
 * 정지: ffmpeg 종료
 */
async function stop(record_no) {
  const rec = running.get(String(record_no));
  if (!rec) return null;
  try {
    // SIGINT로 안전종료 시도
    rec.command.kill('SIGINT');
  } catch {}
  running.delete(String(record_no));
  return rec.filePath;
}

module.exports = { start, stop, STORAGE_DIR };
