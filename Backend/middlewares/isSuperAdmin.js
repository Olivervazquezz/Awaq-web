export default function isSuperAdmin(req, res, next) {
  if (req.user?.rol !== 'superadmin')
    return res.status(403).json({ error: 'Solo super-admin' });
  next();
}
