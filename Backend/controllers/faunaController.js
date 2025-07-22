import db from '../db.js'; // ✅ importación por defecto

// Registrar Fauna
export const registrarFauna = async (req, res) => {
  const { id_usuario, tipo_ecosistema, observaciones, imagenes, ubicacion, weather_condition, season, record_type } = req.body;

  try {
    if (!id_usuario || !tipo_ecosistema || !observaciones || !record_type) {
      return res.status(400).json({ error: 'Campos obligatorios faltantes.' });
    }

    if (!Array.isArray(imagenes) || imagenes.length > 5) {
      return res.status(400).json({ error: 'Se permite un máximo de 5 imágenes.' });
    }

    await db.execute(
      'INSERT INTO Reportes (id_usuario, tipo_ecosistema, observaciones, imagenes, ubicacion, weather_condition, season, record_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id_usuario,
        tipo_ecosistema,
        observaciones,
        JSON.stringify(imagenes),
        ubicacion || null,
        weather_condition || null,
        season || null,
        record_type
      ]
    );

    res.status(201).json({ message: 'Reporte registrado correctamente' });
  } catch (err) {
    console.error('Error al registrar fauna:', err);
    res.status(500).json({ error: 'Error al registrar fauna' });
  }
};

// Listar Fauna
export const listarFauna = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Reportes');
    res.json(rows);
  } catch (err) {
    console.error('Error al listar fauna:', err);
    res.status(500).json({ error: 'Error al listar fauna' });
  }
};

// Actualizar Fauna
export const actualizarFauna = async (req, res) => {
  const { id } = req.params;
  const { tipo_ecosistema, observaciones, imagenes, ubicacion, weather_condition, season, record_type } = req.body;

  try {
    await db.execute(
      'UPDATE Reportes SET tipo_ecosistema = ?, observaciones = ?, imagenes = ?, ubicacion = ?, weather_condition = ?, season = ?, record_type = ? WHERE id = ?',
      [
        tipo_ecosistema,
        observaciones,
        JSON.stringify(imagenes) || null,
        ubicacion || null,
        weather_condition || null,
        season || null,
        record_type,
        id
      ]
    );

    res.json({ message: 'Reporte actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar fauna:', err);
    res.status(500).json({ error: 'Error al actualizar fauna' });
  }
};

// Eliminar Fauna
export const eliminarFauna = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM Reportes WHERE id = ?', [id]);
    res.json({ message: 'Reporte eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar fauna:', err);
    res.status(500).json({ error: 'Error al eliminar fauna' });
  }
};
