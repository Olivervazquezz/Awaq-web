import express from 'express';
import { login, register, recoverPassword, changePassword } from '../controllers/authController.js';

const router = express.Router();

// Rutas de autenticación
router.post('/login', login);                // Inicio de sesión
router.post('/register', register);          // Registro de usuario
router.post('/recover-password', recoverPassword); // Enviar token de recuperación
router.post('/change-password', changePassword);   // Cambio de contraseña

export default router;
