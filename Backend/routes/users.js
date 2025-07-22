// Backend/routes/users.js
import express from 'express';
import {
  saveLocation,
  saveProfile,
  getMyProfile,   // ← Importa la nueva función
  changeOwnPassword,
} from '../controllers/usersController.js';
import upload from '../middlewares/upload.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

// -------------- RUTAS PROTEGIDAS (JWT) --------------
// Para acceder a cualquiera de estas rutas, el token debe ser válido
router.use(verifyToken);

/**
 * GET /api/users/me
 * Devuelve los datos actuales del usuario logueado.
 */
router.get('/me', getMyProfile);

/**
 * PUT /api/users/location
 * Guarda / actualiza únicamente los campos de ubicación.
 */
router.put('/location', saveLocation);

/**
 * PUT /api/users/profile
 * Guarda / actualiza todos los campos de perfil (imagen + otros).
 * El fieldName para la foto es "foto" en el FormData.
 */
router.put(
  '/profile',
  upload.single('foto'),
  saveProfile
);

router.put('/change-password', changeOwnPassword);

export default router;
