import express from 'express';
import { listBiomos, getBiomo } from '../controllers/biomosController.js';  // Importamos las funciones desde el controlador
import verifyToken from '../middlewares/verifyToken.js';  // Asegurarnos de que el usuario está autenticado

const router = express.Router();

router.get('/', verifyToken, listBiomos);  // Ruta para obtener los biomos del usuario autenticado
router.get('/:id', verifyToken, getBiomo);  // Ruta para obtener un biomo específico con su ID

export default router;