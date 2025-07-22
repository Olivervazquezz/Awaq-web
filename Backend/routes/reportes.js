import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

import verifyToken from '../middlewares/verifyToken.js';
import {
  getReportesByUser,
  getReporteById,
  saveEvidenciaPdf            // 👈 nuevo controlador
} from '../controllers/reportesController.js';

/* ───────── helpers de ruta ───────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// FrontEnd está dos niveles arriba =>  /<root>/FrontEnd
const FRONT_PATH      = path.join(__dirname, '..', '..', 'FrontEnd');
const EVIDENCIAS_DIR  = path.join(FRONT_PATH, 'evidencias');

/* ───────── Multer ───────── */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, EVIDENCIAS_DIR),
  filename:    (_, file, cb) => {
    const uid = Date.now() + '-' + Math.round(Math.random() * 1e4);
    cb(null, uid + path.extname(file.originalname));   // 1690000-3423.pdf
  }
});
const upload = multer({
  storage,
  fileFilter: (_, file, cb) =>
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Solo PDFs')),
  limits: { fileSize: 10 * 1024 * 1024 }               // 10 MB máx
});

/* ───────── Rutas ───────── */
const router = express.Router();

// ► POST  /api/reportes/:id/evidencias   → subir PDF
router.post('/:id/evidencias', verifyToken, upload.single('pdf'), saveEvidenciaPdf);

// ► GET   /api/reportes/usuario/:id      → lista del usuario
router.get('/usuario/:id', verifyToken, getReportesByUser);

// ► GET   /api/reportes/:id              → detalle
router.get('/:id', verifyToken, getReporteById);

export default router;

