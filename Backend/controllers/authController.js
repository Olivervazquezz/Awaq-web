// Backend/controllers/authController.js  (columna 'contrasena' sin eñe)
import db from '../db.js'; // ✅ importación por defecto
import bcrypt       from 'bcryptjs';
import jwt          from 'jsonwebtoken';
import crypto       from 'crypto';
import nodemailer   from 'nodemailer';

/* ---------- Config de correo ---------- */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

/* ================ REGISTRO ================ */
export const register = async (req, res) => {
  const { nombre, apellidos, email, password } = req.body;
  if (!password) return res.status(400).json({ error: 'La contraseña es obligatoria' });

  try {
    const [dup] = await db.execute('SELECT 1 FROM usuarios WHERE email = ?', [email]);
    if (dup.length) return res.status(400).json({ error: 'Correo ya registrado' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      `INSERT INTO usuarios (nombre, apellidos, email, contrasena, aprobado, rol)
       VALUES (?, ?, ?, ?, 0, 'usuario')`,
      [nombre, apellidos, email, hashed]
    );

    const token = jwt.sign(
      { id_usuario: result.insertId, rol: 'usuario' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Cuenta creada. Pendiente de aprobación.',
      token,
      user: {
        id_usuario: result.insertId,
        nombre,
        apellidos,
        rol: 'usuario'
      }
    });
  } catch (err) {
    console.error('Error en registro:', err.sqlMessage || err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

/* ================ LOGIN ================ */
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!password) return res.status(400).json({ error: 'La contraseña es obligatoria' });
  try {
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    if (user.aprobado === 0) return res.status(403).json({ error: 'Cuenta pendiente de aprobación' });

    const ok = await bcrypt.compare(password, user.contrasena);
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' });

    // Aquí generas el token
    const token = jwt.sign(
      { id_usuario: user.id_usuario, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Decides la ruta a la que rediriges según rol
    let redirect = 'dashboard.html';
    if (user.rol === 'admin')      redirect = 'admin.html';
    if (user.rol === 'superadmin') redirect = 'super-admin.html';

    // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
    // MODIFICACIÓN: Incluimos `foto_perfil` en la respuesta al cliente
    // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

    res.json({
      message: 'Inicio de sesión exitoso',
      redirect,
      token,
      user: {
        id_usuario    : user.id_usuario,
        nombre        : user.nombre,
        apellidos     : user.apellidos,
        rol           : user.rol,
        foto_perfil   : user.foto_perfil  // <---- Aquí agregamos la ruta tal cual está en la BD
      }
    });
  } catch (err) {
    console.error('Error en login:', err.sqlMessage || err);
    res.status(500).json({ error: 'Error al autenticar usuario' });
  }
};

/* ================ RECUPERAR PASSWORD ================ */
export const recoverPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'Correo no encontrado' });
    if (user.aprobado === 0) return res.status(403).json({ error: 'La cuenta está pendiente de aprobación.' });

    const token = crypto.randomBytes(32).toString('hex');
    await db.execute('UPDATE usuarios SET token_recuperacion = ? WHERE email = ?', [token, email]);

    const link = `http://localhost:3000/recuperarContraseña/cambiar-contraseña.html?token=${token}`;
    await transporter.sendMail({
      from   : `Soporte Vitanova <${process.env.EMAIL_USER}>`,
      to     : email,
      subject: 'Recuperación de contraseña - Vitanova',
      html   : `<h2>Recuperación de contraseña</h2>
                <p>Haz clic en el enlace para cambiar tu contraseña:</p>
                <a href="${link}">Cambiar Contraseña</a>`
    });

    res.json({ message: 'Correo de recuperación enviado correctamente' });
  } catch (err) {
    console.error('Error al enviar correo de recuperación:', err.sqlMessage || err);
    res.status(500).json({ error: 'Error al enviar correo de recuperación' });
  }
};

/* ================ CAMBIAR PASSWORD ================ */
export const changePassword = async (req, res) => {
  const { token, nuevaContraseña } = req.body;
  if (!nuevaContraseña) return res.status(400).json({ error: 'La nueva contraseña es obligatoria' });

  try {
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE token_recuperacion = ?', [token]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'Token inválido o expirado' });

    const hashed = await bcrypt.hash(nuevaContraseña, 10);
    await db.execute(
      'UPDATE usuarios SET contrasena = ?, token_recuperacion = NULL WHERE id_usuario = ?',
      [hashed, user.id_usuario]
    );
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error al cambiar la contraseña:', err.sqlMessage || err);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
};
