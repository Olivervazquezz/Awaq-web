import db from '../db.js'; // ✅ importación por defecto

export const getReportesByUser = async (req, res) => {
  try {
    const idUsuario = req.params.id;
    const [rows] = await db.query(`
      SELECT id_reporte, tipo_ecosistema, record_type, fecha_reporte, imagenes
      FROM reportes
      WHERE id_usuario = ?
      ORDER BY fecha_reporte DESC
    `, [idUsuario]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reportes del usuario' });
  }
};

export const getReporteById = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT * FROM reportes WHERE id_reporte = ?', [id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Reporte no encontrado' });

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el reporte' });
  }
};

export const saveEvidenciaPdf = async (req, res) => {
  try {
    const { id }   = req.params;   // id del reporte (viene en la URL)
    const archivo  = req.file.filename;    // nombre generado por Multer

    // 1. Actualiza el campo evidencias en la fila del reporte
    await db.query(
      'UPDATE reportes SET evidencias = ? WHERE id_reporte = ?',
      [archivo, id]
    );

    // 2. Devuelve al front el nombre para que pueda hacer el preview
    res.json({ ok: true, file: archivo });
  } catch (err) {
    console.error('❌ saveEvidenciaPdf:', err);
    res.status(500).json({ ok: false, msg: 'Error al guardar la evidencia' });
  }
};