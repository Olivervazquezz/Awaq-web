import express from 'express';
import auth from '../middlewares/auth1.js';
import {
  crearAnteproyecto,
  listarAnteproyectos,
  listarPorUsuario
} from '../controllers/NuevoanteproyectosController.js';

const r = express.Router();

r.get('/', auth, listarAnteproyectos);
r.get('/usuario/:id', auth, listarPorUsuario);
r.post('/', auth, crearAnteproyecto);

export default r;
