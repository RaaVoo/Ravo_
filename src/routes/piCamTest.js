// routes/piCamTest.js
import express from 'express';
import multer from 'multer';

const router = express.Router();

// (선택) 디스크 저장 → 파일까지 남겨서 눈으로 확인 가능
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({
  storage, // 저장 안 하려면 storage 빼고 multer()만
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

router.get('/health', (req, res) => {
  res.json({ ok: true, msg: 'pi-cam endpoint alive' });
});

router.post('/frame', upload.single('frame'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, msg: 'no file' });

  console.log(
    '📸 Received frame:',
    req.file.originalname,
    req.file.mimetype,
    req.file.size
  );
  if (req.file.path) console.log('✅ Saved at:', req.file.path);

  res.json({
    ok: true,
    type: 'image',
    size: req.file.size,
    path: req.file.path || null,
  });
});

router.post('/video', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, msg: 'no file' });

  console.log(
    '🎥 Received video:',
    req.file.originalname,
    req.file.mimetype,
    req.file.size
  );
  if (req.file.path) console.log('✅ Saved at:', req.file.path);

  res.json({
    ok: true,
    type: 'video',
    size: req.file.size,
    path: req.file.path || null,
  });
});

export default router; // ✅ ESM default export