// controllers/convocatoriasController.js
import db from '../db.js';

export const crearConvocatoria = async (req, res) => {
  try {
    const {
      nombre,
      fecha_cierre,
      sitio_web,
      region,
      organizacion,
      pais,
      descripcion
    } = req.body;

    const archivo_pdf = req.file?.filename || null;

    await db.query(
      `INSERT INTO proyectos (
        id_usuario_owner,
        titulo,
        descripcion,
        fecha_cierre,
        estado,
        fecha_creacion,
        archivo_pdf,
        sitio_web,
        region,
        organizacion,
        pais
      ) VALUES (?, ?, ?, ?, 'abierto', NOW(), ?, ?, ?, ?, ?)`,
      [
        req.user.id_usuario,
        nombre,
        descripcion,
        fecha_cierre,
        archivo_pdf,
        sitio_web,
        region,
        organizacion,
        pais
      ]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('[Error crearConvocatoria]:', err);
    res.status(500).json({ ok: false, msg: 'Error al guardar la convocatoria' });
  }
};
