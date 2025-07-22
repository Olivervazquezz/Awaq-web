/* ------------------------------------------------------------------
   Backend/server.js   (ES Modules)
-------------------------------------------------------------------*/
import express           from 'express';
import cors              from 'cors';
import dotenv            from 'dotenv';
import path              from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import fs from 'fs';


import faunaRoutes  from './routes/fauna.js';
import authRoutes   from './routes/auth.js';
import authMiddleware from './middlewares/auth1.js';
import adminRoutes  from './routes/admin.js';
import usersRoutes  from './routes/users.js';
import superRoutes  from './routes/superAdmin.js';
import biomosRoutes from './routes/biomos.js';
import reportesRoutes from './routes/reportes.js';
import convocatoriasRoutes from './routes/convocatorias.js';
import anteproyectosRoutes from './routes/anteproyectos.js';
import nuevoanteproyectosRoutes from './routes/nuevoAnteproyectos.js';


dotenv.config();
const app  = express();
const PORT = process.env.PORT || 3000;

/* ───────── helpers ESM ───────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const FRONT_PATH = path.join(__dirname, '..', 'FrontEnd');
const EVIDENCIAS_DIR = path.join(FRONT_PATH, 'evidencias');

app.use(express.static(FRONT_PATH));                         // html, css, js
app.use('/uploads', express.static(path.join(__dirname, 'utils', 'uploads')));
app.use('/imagesBiomos', express.static(path.join(__dirname, 'FrontEnd', 'imagesBiomos')));

/* ───────── middleware global ───────── */
app.use(cors());
app.use(express.json());

/* ───────── API ───────── */
app.use('/api/auth',  authRoutes);
app.use('/api/fauna', faunaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/biomos', biomosRoutes);
app.use('/api/super', superRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/imagesBiomos', express.static(path.join(FRONT_PATH, 'imagesBiomos')));
app.use('/evidencias', express.static(EVIDENCIAS_DIR));
app.use('/api/convocatorias', convocatoriasRoutes);
app.use('/api/anteproyectos', anteproyectosRoutes);
app.use('/pdfs', express.static(path.join(__dirname, 'Convocatorias_PDF')));
app.use('/pdfs', express.static(path.join(process.cwd(), 'Convocatorias_PDF')));
app.use('/api/NuevoAnteproyectos', nuevoanteproyectosRoutes);


/* ───────── páginas de recuperar contraseña ───────── */
app.get('/recuperarContraseña/cambiar-contraseña.html', (_, res) =>
  res.sendFile(path.join(FRONT_PATH, 'RecuperarContraseña', 'cambiar-contraseña.html'))
);
app.get('/recuperarContraseña/confirmacion-contraseña.html', (_, res) =>
  res.sendFile(path.join(FRONT_PATH, 'RecuperarContraseña', 'confirmacion-contraseña.html'))
);
app.get('/recuperarContraseña/correo-enviado.html', (_, res) =>
  res.sendFile(path.join(FRONT_PATH, 'RecuperarContraseña', 'correo-enviado.html'))
);

/* ───────── ping de salud opcional ───────── */
app.get('/api', (_, res) =>
  res.json({ message: 'API de Vitanova funcionando correctamente' })
);

/* ───────── raíz → index.html ───────── */
app.get('/', (_, res) =>
  res.sendFile(path.join(FRONT_PATH, 'index.html'))
);

app.get('/FrontEnd/Asistentes/Biomo/biomo.html', (_, res) =>
  res.sendFile(path.join(FRONT_PATH, 'Asistentes', 'Biomo', 'biomo.html'))
);

// Ruta explícita para reportes.html
app.get('/FrontEnd/Asistentes/Biomo/reporte.html', (req, res) => {
  res.sendFile(path.join(FRONT_PATH, 'Asistentes', 'Biomo', 'reporte.html'));
});

app.get('/FrontEnd/Asistentes/Convocatorias/chat.html', (req, res) => {
  res.sendFile(path.join(FRONT_PATH, 'Asistentes', 'Convocatorias', 'chat.html'));
});

app.get('/Asistentes/Convocatorias/detalle-convocatoria.html', (_, res) => {
  res.sendFile(path.join(FRONT_PATH, 'Asistentes', 'Convocatorias', 'detalle-convocatoria.html'));
});


app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  try {
    const groq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer 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',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages,
        temperature: 0.7
      })
    });
    const data = await groq.json();
    res.json(data);
  } catch (err) {
    console.error('❌ Error Groq:', err);
    res.status(500).json({ error: 'Error de conexión con Groq.' });
  }
});
/* ───────── fallback SPA → index.html ─────────
   Cualquier ruta que NO empiece con /api/ sirve al front
*/
/* app.get('/*', (_, res) =>
  res.sendFile(path.join(FRONT_PATH, 'index.html'))
);*/

/* ───────── start ───────── */
app.listen(PORT, () =>
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
);
