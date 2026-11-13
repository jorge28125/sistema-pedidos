import { Router } from 'express';
import { get, run, all } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

export const router = Router();

router.get('/', requireAdmin(), (req, res) => {
  const productos = all('SELECT * FROM productos ORDER BY id DESC', []);
  const inventario = all(
    `SELECT i.id, i.producto_id, i.stock, i.unidad, i.minimo_stock, p.nombre, p.descripcion, p.precio, p.categoria, p.disponible
     FROM inventario i JOIN productos p ON p.id = i.producto_id ORDER BY p.id`,
    []
  );
  res.json({ productos, inventario });
});

router.post('/', requireAdmin(), (req, res) => {
  const { nombre, descripcion, precio, categoria, disponible, stock, unidad } = req.body || {};
  if (!nombre || typeof precio !== 'number' || precio <= 0) {
    return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
  }
  const info = run(
    'INSERT INTO productos (nombre, descripcion, precio, categoria, disponible) VALUES (?, ?, ?, ?, ?)',
    [nombre, descripcion || '', precio, categoria || 'General', disponible === undefined ? 1 : disponible ? 1 : 0]
  );
  const productoId = Number(info.lastInsertRowid);
  run(
    'INSERT INTO inventario (producto_id, stock, unidad, minimo_stock) VALUES (?, ?, ?, ?)',
    [productoId, stock || 0, unidad || 'unidad', 5]
  );
  const producto = get('SELECT * FROM productos WHERE id = ?', [productoId]);
  const inv = get('SELECT * FROM inventario WHERE producto_id = ?', [productoId]);
  res.status(201).json({ producto, inventario: inv });
});

router.patch('/:id', requireAdmin(), (req, res) => {
  const id = Number(req.params.id);
  const { nombre, descripcion, precio, categoria, disponible } = req.body || {};
  const producto = get('SELECT * FROM productos WHERE id = ?', [id]);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  if (nombre !== undefined) run('UPDATE productos SET nombre = ? WHERE id = ?', [nombre, id]);
  if (descripcion !== undefined) run('UPDATE productos SET descripcion = ? WHERE id = ?', [descripcion, id]);
  if (precio !== undefined) run('UPDATE productos SET precio = ? WHERE id = ?', [precio, id]);
  if (categoria !== undefined) run('UPDATE productos SET categoria = ? WHERE id = ?', [categoria, id]);
  if (disponible !== undefined) run('UPDATE productos SET disponible = ? WHERE id = ?', [disponible ? 1 : 0, id]);
  const updated = get('SELECT * FROM productos WHERE id = ?', [id]);
  res.json({ producto: updated });
});

export default router;
