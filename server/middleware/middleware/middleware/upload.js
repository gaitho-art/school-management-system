import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';
['photos','logos','documents'].forEach(d => {
  const p = path.join(uploadDir, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.fieldname === 'logo' || file.fieldname === 'stamp'
      ? 'logos' : file.mimetype.startsWith('image') ? 'photos' : 'documents';
    cb(null, path.join(uploadDir, type));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|pdf|docx?/.test(file.mimetype);
    cb(ok ? null : new Error('Unsupported file type'), ok);
  },
});