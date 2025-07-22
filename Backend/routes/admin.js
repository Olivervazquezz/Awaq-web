// routes/admin.js
import express from 'express';
import verifyToken       from '../middlewares/verifyToken.js';
import verifySuperAdmin  from '../middlewares/verifySuperAdmin.js';

import {
  getPendingUsers,
  approveUser,
  getAllUsers,
  deleteUser
} from '../controllers/adminController.js';

import { listAllBiomos } from '../controllers/biomosController.js';  // ⬅ nuevo

const router = express.Router();

/* ----------  ADMIN NORMAL (aprobaciones)  --------- */
router.get('/pending',        verifyToken, verifySuperAdmin, getPendingUsers);
router.post('/approve-user',  verifyToken, verifySuperAdmin, approveUser);

/* ----------  SUPER-ADMIN  --------- */
router.get   ('/users',       verifyToken, verifySuperAdmin, getAllUsers);
router.delete('/users/:id',   verifyToken, verifySuperAdmin, deleteUser);

/* ----------  NUEVA RUTA  →  BIOMOS GLOBALES  --------- */
router.get('/biomos',         verifyToken, verifySuperAdmin, listAllBiomos);



export default router;