// controllers/adminController.js
import db from '../db.js'; // ✅ importación por defecto

// ----------- usuarios pendientes ------------------
export const getPendingUsers = async (_, res) => {
  const [rows] = await db.execute('SELECT * FROM usuarios WHERE aprobado = 0');
  res.json(rows);
};

// body: { id_usuario, aprobar: true|false }
export const approveUser = async (req, res) => {
  const { id_usuario, aprobar } = req.body;
  await db.execute(
    'UPDATE usuarios SET aprobado = ? WHERE id_usuario = ?',
    [aprobar ? 1 : 0, id_usuario]
  );
  res.json({ message: aprobar ? 'Usuario aprobado' : 'Usuario rechazado' });
};

// ----------- SUPER-ADMIN ONLY ----------------------
export const getAllUsers = async (_, res) => {
  const [rows] = await db.execute('SELECT * FROM usuarios');
  res.json(rows);
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  await db.execute('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
  res.json({ message: 'Usuario eliminado' });
};
