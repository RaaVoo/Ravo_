// controllers/video.controller.js
import { findNextQueuedVideo, findVideoById } from "../services/video.service.js";
import { buildVideoAccess } from "../services/video.access.service.js"; // S3 or Local URL 생성

export const getNextVideoController = async (req, res) => {
  try {
    const v = await findNextQueuedVideo(); // {id, file_key, mime}
    if (!v) return res.status(404).json({ success:false, message:"no queued video" });

    const access = await buildVideoAccess(v); // { url } or { signed_url }
    return res.json({ success:true, data: { ...v, ...access }});
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, message:"server error" });
  }
};

export const getVideoByIdController = async (req, res) => {
  try {
    const v = await findVideoById(req.params.id);
    if (!v) return res.status(404).json({ success:false, message:"not found" });

    const access = await buildVideoAccess(v);
    return res.json({ success:true, data: { ...v, ...access }});
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, message:"server error" });
  }
};
