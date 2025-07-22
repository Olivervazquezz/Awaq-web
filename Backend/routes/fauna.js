import express from 'express';
import { registrarFauna, listarFauna, actualizarFauna, eliminarFauna } from '../controllers/faunaController.js';

const router = express.Router();

// Rutas de fauna
router.post('/registrar', registrarFauna);       // Registrar reporte de fauna
router.get('/listar', listarFauna);              // Listar todos los reportes
router.put('/actualizar/:id', actualizarFauna);  // Actualizar reporte por ID
router.delete('/eliminar/:id', eliminarFauna);   // Eliminar reporte por ID

export default router;
