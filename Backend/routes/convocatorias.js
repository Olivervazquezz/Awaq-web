// routes/convocatorias.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import auth from '../middlewares/auth1.js';
import { crearConvocatoria } from '../controllers/convocatoriasController.js';

const router = express.Router();

// Necesario para __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, '..', 'Convocatorias_PDF'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `convocatoria_${Date.now()}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// POST /api/convocatorias
router.post('/', auth, upload.single('archivo'), crearConvocatoria);

export default router;
