import { Router } from 'express';
import multer from 'multer';
import { importFromFile } from '../services/importService.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const result = await importFromFile(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
    res.json(result);
  } catch (err) {
    console.error('Import error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
