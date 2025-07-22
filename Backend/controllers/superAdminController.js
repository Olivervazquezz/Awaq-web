/* ------------------------------------------------------------------
   Controlador Super Admin - Gestión completa de usuarios y datos
-------------------------------------------------------------------*/
import db from '../db.js'; // ✅ importación por defecto

/* ────────────  GESTIÓN DE USUARIOS  ──────────── */

/* Todos los usuarios con paginación y filtros */
export const allUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const search = (req.query.search || '').trim();
    const role = (req.query.role || '').trim();
    
    const where = [];
    const args = [];

    if (search) {
      where.push('(nombre LIKE ? OR email LIKE ?)');
      args.push(`%${search}%`, `%${search}%`);
    }
    if (role) {
      where.push('rol = ?');
      args.push(role);
    }

    const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (page - 1) * limit;

    // Total de registros
    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM usuarios ${whereSQL}`, 
      args
    );

    // Datos paginados
    const [rows] = await db.execute(
      `SELECT id_usuario, nombre, email, rol, aprobado, fecha_registro, telefono, organizacion
       FROM usuarios ${whereSQL}
       ORDER BY fecha_registro DESC
       LIMIT ? OFFSET ?`, 
      [...args, limit, offset]
    );

    res.json({ 
      total, 
      page, 
      limit, 
      totalPages: Math.ceil(total / limit),
      users: rows 
    });
  } catch (error) {
    console.error('Error en allUsers:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

/* Usuarios pendientes de aprobación */
export const pendingUsers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id_usuario, nombre, email, telefono, organizacion, fecha_registro
       FROM usuarios 
       WHERE aprobado = 0 
       ORDER BY fecha_registro ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en pendingUsers:', error);
    res.status(500).json({ error: 'Error al obtener usuarios pendientes' });
  }
};

/* Cambiar rol de usuario */
export const setRole = async (req, res) => {
  try {
    const { rol } = req.body;
    const { id } = req.params;

    // Validar rol
    if (!['usuario', 'admin', 'superadmin'].includes(rol)) {
      return res.status(400).json({ error: 'Rol no válido' });
    }

    const [result] = await db.execute(
      'UPDATE usuarios SET rol = ? WHERE id_usuario = ?', 
      [rol, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Rol actualizado correctamente' });
  } catch (error) {
    console.error('Error en setRole:', error);
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
};

/* Aprobar usuario */
export const approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'UPDATE usuarios SET aprobado = 1 WHERE id_usuario = ?', 
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario aprobado correctamente' });
  } catch (error) {
    console.error('Error en approveUser:', error);
    res.status(500).json({ error: 'Error al aprobar usuario' });
  }
};

/* Eliminar usuario */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que no sea el último superadmin
    const [[{ count }]] = await db.execute(
      'SELECT COUNT(*) as count FROM usuarios WHERE rol = "superadmin" AND id_usuario != ?',
      [id]
    );

    const [user] = await db.execute(
      'SELECT rol FROM usuarios WHERE id_usuario = ?',
      [id]
    );

    if (user.length > 0 && user[0].rol === 'superadmin' && count === 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el último super administrador' 
      });
    }

    const [result] = await db.execute(
      'DELETE FROM usuarios WHERE id_usuario = ?', 
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error en deleteUser:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

/* ────────────  DATOS POR USUARIO  ──────────── */

/* Biomos/Reportes por usuario */
export const listBiomosPorUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      `SELECT r.*, u.nombre AS nombre_usuario, u.email AS email_usuario
       FROM reportes r
       JOIN usuarios u ON u.id_usuario = r.id_usuario
       WHERE r.id_usuario = ?
       ORDER BY r.fecha_reporte DESC`, 
      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error en listBiomosPorUsuario:', error);
    res.status(500).json({ error: 'Error al obtener biomos del usuario' });
  }
};

export const listProyectosPorUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(`
      SELECT p.*, u.nombre AS nombre_usuario, u.email AS email_usuario
      FROM proyectos p
      JOIN usuarios u ON u.id_usuario = p.id_usuario_owner
      WHERE p.id_usuario_owner = ?
      ORDER BY p.fecha_creacion DESC
    `, [id]);

    res.json(rows);
  } catch (error) {
    console.error('Error en listProyectosPorUsuario:', error);
    res.status(500).json({ error: 'Error al obtener proyectos del usuario' });
  }
};

/* ────────────  ESTADÍSTICAS GENERALES  ──────────── */

/* Dashboard con estadísticas generales */
export const getDashboardStats = async (req, res) => {
  try {
    // Usuarios totales
    const [[{ totalUsuarios }]] = await db.execute(
      'SELECT COUNT(*) as totalUsuarios FROM usuarios'
    );

    // Usuarios pendientes
    const [[{ usuariosPendientes }]] = await db.execute(
      'SELECT COUNT(*) as usuariosPendientes FROM usuarios WHERE aprobado = 0'
    );

    // Biomos/Reportes totales
    const [[{ totalBiomos }]] = await db.execute(
      'SELECT COUNT(*) as totalBiomos FROM reportes'
    );

    // Proyectos totales - CORREGIDO
    const [[{ totalProyectos }]] = await db.execute(
      'SELECT COUNT(*) as totalProyectos FROM proyectos'
    );

    // Usuarios por rol
    const [usuariosPorRol] = await db.execute(
      'SELECT rol, COUNT(*) as cantidad FROM usuarios GROUP BY rol'
    );

    // Actividad reciente (últimos 10 registros) - CORREGIDO
    const [actividadReciente] = await db.execute(
      `SELECT 'usuario' as tipo, nombre, fecha_registro as fecha FROM usuarios 
       UNION ALL
       SELECT 'proyecto' as tipo, titulo as nombre, fecha_creacion as fecha FROM proyectos
       ORDER BY fecha DESC LIMIT 10`
    );

    res.json({
      estadisticas: {
        totalUsuarios,
        usuariosPendientes,
        totalBiomos,
        totalProyectos
      },
      usuariosPorRol,
      actividadReciente
    });

  } catch (error) {
    console.error('Error en getDashboardStats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

/* Obtener información detallada de un usuario */
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Información del usuario
    const [user] = await db.execute(
      `SELECT id_usuario, nombre, email, telefono, organizacion, rol, aprobado, 
              fecha_registro, foto_perfil
       FROM usuarios WHERE id_usuario = ?`,
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Contadores de actividad - CORREGIDOS
    const [[{ totalBiomos }]] = await db.execute(
      'SELECT COUNT(*) as totalBiomos FROM reportes WHERE id_usuario = ?',
      [id]
    );

    const [[{ totalProyectos }]] = await db.execute(
      'SELECT COUNT(*) as totalProyectos FROM proyectos WHERE id_usuario_owner = ?',
      [id]
    );

    res.json({
      usuario: user[0],
      actividad: {
        totalBiomos,
        totalProyectos
      }
    });

  } catch (error) {
    console.error('Error en getUserDetails:', error);
    res.status(500).json({ error: 'Error al obtener detalles del usuario' });
  }
};


/* Búsqueda avanzada de usuarios */
export const searchUsers = async (req, res) => {
  try {
    const { query, filters = {} } = req.body;
    const { rol, aprobado, organizacion } = filters;

    let whereConditions = [];
    let params = [];

    if (query) {
      whereConditions.push('(nombre LIKE ? OR email LIKE ? OR organizacion LIKE ?)');
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    if (rol) {
      whereConditions.push('rol = ?');
      params.push(rol);
    }

    if (aprobado !== undefined) {
      whereConditions.push('aprobado = ?');
      params.push(aprobado);
    }

    if (organizacion) {
      whereConditions.push('organizacion LIKE ?');
      params.push(`%${organizacion}%`);
    }

    const whereSQL = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';

    const [users] = await db.execute(
      `SELECT id_usuario, nombre, email, telefono, organizacion, rol, aprobado, fecha_registro
       FROM usuarios ${whereSQL}
       ORDER BY fecha_registro DESC`,
      params
    );

    res.json(users);

  } catch (error) {
    console.error('Error en searchUsers:', error);
    res.status(500).json({ error: 'Error en la búsqueda de usuarios' });
  }
};