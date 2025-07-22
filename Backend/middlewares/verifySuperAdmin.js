// middlewares/verifySuperAdmin.js
export default function verifySuperAdmin(req, res, next) {
  if (req.user?.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Acceso restringido' });
  }
  next();
}
