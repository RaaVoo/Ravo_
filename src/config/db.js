import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from "node:url";

// __dirname 대체 (ESM에는 없음)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv.config();

/* 0) .env 로드
 * - 백엔드 루트의 .env 사용
 */
dotenv.config({ path: path.join(process.cwd(), '.env') });

/* ============================================================================
 * 1) 환경변수 점검
 *    - 필수값 누락 시 즉시 에러로 빠르게 인지
 *    - 단, 로컬 개발 편의를 위해 기본값(fallback)도 제공 가능
 * ========================================================================== */
const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
for (const k of required) {
  if (!process.env[k]) {
    // 필요 시 아래 주석 해제해 엄격 모드로 사용
    // throw new Error(`[DB CONFIG] Missing env: ${k}`);
  }
}


export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost", // mysql의 hostname
  user: process.env.DB_USER || "root", // user 이름
  // port: process.env.DB_PORT || 3306, // 포트 번호
  port: Number(process.env.DB_PORT || 3306),     // 포트
  database: process.env.DB_NAME || "ravo", // 데이터베이스 이름
  password: process.env.DB_PASSWORD || "quf!sla0380", // 비밀번호

  //port: process.env.DB_PORT, // 포트 번호 -> 지수 테스트 사용 코드
  //database: process.env.DB_NAME, // 데이터베이스 이름 -> 지수 테스트 사용 코드
  //password: process.env.DB_PASSWORD, // 비밀번호 -> 지수 테스트 사용 코드

  waitForConnections: true,
  // Pool에 획득할 수 있는 connection이 없을 때,
  // true면 요청을 queue에 넣고 connection을 사용할 수 있게 되면 요청을 실행하며, false이면 즉시 오류를 내보내고 다시 요청
  connectionLimit: 10, // 몇 개의 커넥션을 가지게끔 할 것인지
  queueLimit: 0, // getConnection에서 오류가 발생하기 전에 Pool에 대기할 요청의 개수 한도
});

/* ====================================================================
 * 3) 편의 메서드
 * ==================================================================== */
export async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function execute(sql, params) {
  return await pool.execute(sql, params); // [rows/result, fields]
}

export default pool;