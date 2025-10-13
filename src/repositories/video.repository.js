// repositories/video.repository.js
import { pool } from "../config/db.js";

export const getNextQueuedRow = async () => {
  const [rows] = await pool.execute(
    `SELECT id, file_key, mime, status, created_at
     FROM video WHERE status='queued' ORDER BY created_at ASC LIMIT 1`
  );
  return rows[0] || null;
};

export const getVideoRowById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT id, file_key, mime, status, created_at
     FROM video WHERE id = ? LIMIT 1`, [id]
  );
  return rows[0] || null;
};
