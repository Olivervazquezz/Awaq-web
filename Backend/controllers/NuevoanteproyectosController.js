import db from '../db.js';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Convocatorias_PDF'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
export const upload = multer({ storage }).single('archivo_pdf');

export const listarAnteproyectos = async (req, res) => {
  const [rows] = await db.execute(`SELECT * FROM anteproyectos ORDER BY fecha_creacion DESC`);
  res.json(rows);
};

export const listarPorUsuario = async (req, res) => {
  // ✅ CORREGIDO: Campo correcto de la BD
  const [rows] = await db.execute(
    `SELECT * FROM anteproyectos WHERE id_usuario_owner = ? ORDER BY fecha_creacion DESC`,
    [req.params.id]
  );
  res.json(rows);
};

export const crearAnteproyecto = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ error: 'Error al subir archivo' });

    const {
      titulo, 
      descripcion, 
      fecha_cierre, 
      sitio_web,
      region, 
      organizacion, 
      pais, 
      convocatoria_rel,  // ✅ CORREGIDO: Campo correcto del frontend
      id_usuario_owner   // ✅ CORREGIDO: Campo correcto de la BD
    } = req.body;

    const archivo_pdf = req.file?.filename || null;
    // ✅ CORREGIDO: Usar el id_usuario_owner del body, no del token
    const usuario_owner = id_usuario_owner || req.user?.id_usuario;

    try {
      // ✅ CORREGIDO: Query que coincide con tu estructura de BD
      await db.execute(
        `INSERT INTO anteproyectos 
         (titulo, fecha_cierre, sitio_web, archivo_pdf, descripcion, region, organizacion, pais, convocatoria_rel, id_usuario_owner, fecha_creacion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [titulo, fecha_cierre, sitio_web, archivo_pdf, descripcion, region, organizacion, pais, convocatoria_rel, usuario_owner]
      );
      
      console.log('✅ Anteproyecto creado exitosamente');
      res.json({ 
        ok: true, 
        message: 'Anteproyecto creado exitosamente' 
      });
    } catch (e) {
      console.error('❌ Error al guardar anteproyecto:', e);
      res.status(500).json({ error: 'Error al guardar anteproyecto: ' + e.message });
    }
  });
};
