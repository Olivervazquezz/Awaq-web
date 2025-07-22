// Backend/middlewares/upload.js
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/* raíz de Backend */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/* carpeta utils/uploads */
const UPLOAD_DIR = path.join(__dirname, '..', 'utils', 'uploads');

/* crea utils/uploads si no existe */
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log('🗂️  Carpeta utils/uploads creada:', UPLOAD_DIR);
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename   : (_, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname.replace(/\s+/g, ''));
  }
});

export default multer({ storage });
