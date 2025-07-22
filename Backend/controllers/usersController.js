// Backend/controllers/usersController.js
import db from '../db.js'; // ✅ importación por defecto
import bcrypt from 'bcryptjs';
import path from 'path';
import fs   from 'fs';

/* util: arma SET dinámico para solo campos enviados */
function buildUpdate(fields) {
  const keys   = Object.keys(fields).filter(k => fields[k] !== undefined);
  const setStr = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => fields[k]);
  return { setStr, values };
}

/* =================  GET MI PERFIL ================= */
/**
 * GET /api/users/me
 * Middleware: verifyToken → req.user.id_usuario está disponible
 * Devuelve: { id_usuario, nombre, apellidos, organizacion, descripcion_organizacion,
 *             pais, region, ciudad, telefono, codigo_postal, foto_perfil, email, rol }
 */
export const getMyProfile = async (req, res) => {
  try {
    const id = req.user.id_usuario;
    const [rows] = await db.execute(
      `SELECT 
         id_usuario,
         nombre,
         apellidos,
         organizacion,
         descripcion_organizacion,
         pais,
         region,
         ciudad,
         telefono,
         codigo_postal,
         foto_perfil,
         email,
         rol
       FROM usuarios
       WHERE id_usuario = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    // Devolvemos el primer (único) registro
    const user = rows[0];
    res.json(user);
  } catch (err) {
    console.error('getMyProfile →', err.sqlMessage || err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};


/* ===============  SAVE UBICACIÓN (igual que antes) =============== */
export const saveLocation = async (req, res) => {
  const { pais, telefono, region, ciudad, codigo_postal } = req.body;
  const id = req.user.id_usuario;
  try {
    const { setStr, values } = buildUpdate({
      pais, telefono, region, ciudad, codigo_postal
    });
    if (!setStr) return res.status(400).json({ error: 'Sin datos que actualizar' });

    const [result] = await db.execute(
      `UPDATE usuarios SET ${setStr} WHERE id_usuario = ?`,
      [...values, id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ message: 'Ubicación guardada con éxito' });
  } catch (err) {
    console.error('saveLocation →', err.sqlMessage || err);
    res.status(500).json({ error: 'Error al guardar la ubicación' });
  }
};


/* ===============  SAVE PERFIL COMPLETO =============== */
export const saveProfile = async (req, res) => {
  const {
    nombre,
    apellidos,
    organizacion,
    descripcion_organizacion,
    pais,
    region,
    ciudad,
    telefono,
    codigo_postal
  } = req.body;

  const id = req.user.id_usuario;
  try {
    /* ----- maneja foto nueva (si se adjuntó) ----- */
    let foto_perfil = undefined;
    if (req.file) {
      // Asignamos la ruta que luego almacenaremos en BD
      foto_perfil = `/uploads/${req.file.filename}`;

      // (opcional) borra la foto vieja en disco:
      const [[{ foto_perfil: oldFoto }]] = await db.execute(
        `SELECT foto_perfil FROM usuarios WHERE id_usuario = ?`,
        [id]
      );
      if (oldFoto) {
        const oldPath = path.resolve('.' + oldFoto);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    /* ----- arma el UPDATE dinámico ----- */
    const { setStr, values } = buildUpdate({
      nombre,
      apellidos,
      organizacion,
      descripcion_organizacion,
      pais,
      region,
      ciudad,
      telefono,
      codigo_postal,
      foto_perfil
    });
    if (!setStr) return res.status(400).json({ error: 'Sin datos que actualizar' });

    // Ejecutamos el UPDATE en BD
    await db.execute(
      `UPDATE usuarios SET ${setStr} WHERE id_usuario = ?`,
      [...values, id]
    );

    // Para regresar al frontend, devolvemos de nuevo el perfil actualizado
    const [rows] = await db.execute(
      `SELECT 
         id_usuario,
         nombre,
         apellidos,
         organizacion,
         descripcion_organizacion,
         pais,
         region,
         ciudad,
         telefono,
         codigo_postal,
         foto_perfil
       FROM usuarios WHERE id_usuario = ?`,
      [id]
    );
    const user = rows[0];
    return res.json({
      message: 'Perfil actualizado correctamente',
      user
    });
  } catch (err) {
    console.error('saveProfile →', err.sqlMessage || err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};
/* ================== changeOwnPassword ================== */
export const changeOwnPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const id = req.user.id_usuario;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Debes enviar contraseña actual y nueva contraseña.' });
  }

  try {
    // 1) Obtener hash actual de la BD
    const [rows] = await db.execute(
      'SELECT contrasena FROM usuarios WHERE id_usuario = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    const hashedPassword = rows[0].contrasena;

    // 2) Comparar contrasena actual
    const isMatch = await bcrypt.compare(currentPassword, hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    // 3) Hashear la nueva contraseña y actualizar en BD
    const newHashed = await bcrypt.hash(newPassword, 10);
    await db.execute(
      'UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?',
      [newHashed, id]
    );

    res.json({ message: 'Contraseña cambiada correctamente.' });
  } catch (err) {
    console.error('changeOwnPassword →', err.sqlMessage || err);
    res.status(500).json({ error: 'Error al cambiar la contraseña.' });
  }
};