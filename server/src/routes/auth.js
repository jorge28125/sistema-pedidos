import { Router } from 'express';
import { get } from '../db.js';
import { createToken, verifyPassword } from '../utils.js';
import { requireAuth } from '../middleware/auth.js';

export const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  if (!user.activo) {
    return res.status(403).json({ error: 'Usuario inactivo' });
  }
  const token = createToken(user.id);
  res.json({
    token,
    user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
  });
});

router.get('/me', requireAuth(), (req, res) => {
  const user = get('SELECT id, nombre, email, rol FROM users WHERE id = ?', [req.user.id]);
  res.json({ user });
});

export default router;
