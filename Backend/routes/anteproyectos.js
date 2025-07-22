// routes/anteproyectos.js
import express from 'express';
import auth from '../middlewares/auth1.js';
import db from '../db.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM proyectos');
    res.json(rows);
  } catch (err) {
    console.error('[Error GET /api/anteproyectos]:', err);
    res.status(500).json({ ok: false, msg: 'Error al obtener proyectos' });
  }
});
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  console.log("ID recibido en la API:", id);  // Verifica que el ID esté bien recibido

  try {
    const result = await db.query('SELECT * FROM proyectos WHERE id_proyecto = ?', [id]);
    if (result[0].length === 0) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    res.json(result[0][0]);
  } catch (err) {
    console.error('[Error GET /api/anteproyectos/:id]', err);
    res.status(500).json({ error: 'Error al obtener el proyecto' });
  }
});


export default router;
