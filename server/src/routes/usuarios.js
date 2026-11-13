import { Router } from 'express';
import { get, run, all } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { hashPassword } from '../utils.js';

export const router = Router();

router.get('/', requireAdmin(), (req, res) => {
  const usuarios = all(
    'SELECT id, nombre, email, rol, activo, created_at FROM users ORDER BY id',
    []
  );
  res.json({ usuarios });
});

router.post('/', requireAdmin(), (req, res) => {
  const { nombre, email, password, rol } = req.body || {};
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email, password y rol son obligatorios' });
  }
  const existe = get('SELECT id FROM users WHERE email = ?', [email]);
  if (existe) return res.status(409).json({ error: 'El email ya está registrado' });
  const info = run(
    'INSERT INTO users (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
    [nombre, email, hashPassword(password), rol || 'cocina']
  );
  const usuario = get('SELECT id, nombre, email, rol, activo FROM users WHERE id = ?', [Number(info.lastInsertRowid)]);
  res.status(201).json({ usuario });
});

router.patch('/:id', requireAdmin(), (req, res) => {
  const id = Number(req.params.id);
  const { nombre, rol, activo, password } = req.body || {};
  const usuario = get('SELECT id, nombre, email, rol, activo FROM users WHERE id = ?', [id]);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (nombre !== undefined) run('UPDATE users SET nombre = ? WHERE id = ?', [nombre, id]);
  if (rol !== undefined) run('UPDATE users SET rol = ? WHERE id = ?', [rol, id]);
  if (activo !== undefined) run('UPDATE users SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
  if (password) run('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(password), id]);
  const updated = get('SELECT id, nombre, email, rol, activo FROM users WHERE id = ?', [id]);
  res.json({ usuario: updated });
});

export default router;
