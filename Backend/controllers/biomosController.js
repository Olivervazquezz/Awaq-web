import db from '../db.js';

/* ───────────────────────────────────────────────────────────── */
/* 1. LISTA DEL USUARIO NORMAL  (/api/biomos)                    */
/* ───────────────────────────────────────────────────────────── */
export const listBiomos = async (req, res) => {
  try {
    const idUsuario = req.user.id_usuario;

    const [rows] = await db.execute(
      `SELECT  r.id_reporte       AS id_biomo,
              r.record_type      AS estado,
              r.tipo_ecosistema,
              r.fecha_reporte    AS fecha_creacion,
              r.imagenes
       FROM    reportes r
       WHERE   r.id_usuario = ?
       ORDER   BY r.fecha_reporte DESC`,
      [idUsuario]
    );

    res.json(rows);
  } catch (err) {
    console.error('listBiomos →', err.sqlMessage || err);
    res.status(500).json({ error: 'Error al obtener biomos' });
  }
};

/* ───────────────────────────────────────────────────────────── */
/* 2. DETALLE DE UN REPORTE  (/api/biomos/:id)                   */
/* ───────────────────────────────────────────────────────────── */
export const getBiomo = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.*, u.nombre AS nombre_usuario, u.email AS correo_usuario
       FROM reportes r
       JOIN usuarios u ON u.id_usuario = r.id_usuario
       WHERE r.id_reporte = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });

    res.json(rows[0]);
  } catch (err) {
    console.error('getBiomo →', err.sqlMessage || err);
    res.status(500).json({ error: 'Error al obtener biomo' });
  }
};

/* ───────────────────────────────────────────────────────────── */
/* 3. LISTA GLOBAL (SUPER-ADMIN)  (/api/admin/biomos)            */
/* ───────────────────────────────────────────────────────────── */
export const listAllBiomos = async (req, res) => {
  try {
    const {
      search = '',
      days   = '',
      limit  = 30,
      page   = 1
    } = req.query;

    const where = [];
    const params = [];

    if (search) {
      where.push(`(
        r.id_reporte       LIKE ? OR
        u.nombre           LIKE ? OR
        r.record_type      LIKE ? OR
        r.tipo_ecosistema  LIKE ?
      )`);
      for (let i = 0; i < 4; i++) params.push(`%${search}%`);
    }

    if (days) {
      where.push('r.fecha_reporte >= DATE_SUB(NOW(), INTERVAL ? DAY)');
      params.push(+days);
    }

    const perPage = parseInt(limit, 10) || 30;
    const offset  = (parseInt(page, 10) - 1) * perPage;

    const sql = `
      SELECT  SQL_CALC_FOUND_ROWS
              r.id_reporte      AS id_biomo,
              r.record_type     AS estado,
              r.tipo_ecosistema,
              r.fecha_reporte   AS fecha_creacion,
              r.imagenes,
              u.id_usuario,
              u.nombre          AS nombre_usuario
      FROM    reportes r
      JOIN    usuarios u ON u.id_usuario = r.id_usuario
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER   BY r.fecha_reporte DESC
      LIMIT   ${perPage} OFFSET ${offset};
    `;

    const [rows] = await db.execute(sql, params);
    const [[{ 'FOUND_ROWS()': total }]] = await db.execute('SELECT FOUND_ROWS();');

    res.json({ total, rows });
  } catch (err) {
    console.error('listAllBiomos →', err.sqlMessage || err);
    res.status(500).json({ error: 'Error al obtener biomos (admin)' });
  }
};
