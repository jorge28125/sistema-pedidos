import { Router } from 'express';
import { all, get, run } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

export const router = Router();

router.get('/', requireAdmin(), (req, res) => {
  const inventario = all(
    `SELECT i.id, i.producto_id, i.stock, i.unidad, i.minimo_stock, p.nombre, p.descripcion, p.precio, p.categoria, p.disponible
     FROM inventario i JOIN productos p ON p.id = i.producto_id ORDER BY p.id`
  );
  res.json({ inventario });
});

router.patch('/:productoId', requireAdmin(), (req, res) => {
  const productoId = Number(req.params.productoId);
  const { stock, ajuste } = req.body || {};
  const inv = get('SELECT * FROM inventario WHERE producto_id = ?', [productoId]);
  if (!inv) return res.status(404).json({ error: 'Inventario no encontrado' });
  const nuevaStock = stock !== undefined ? Number(stock) : Number(inv.stock) + Number(ajuste || 0);
  run('UPDATE inventario SET stock = ? WHERE producto_id = ?', [nuevaStock, productoId]);
  const producto = get(
    `SELECT i.id, i.producto_id, i.stock, i.unidad, i.minimo_stock, p.nombre, p.descripcion, p.precio, p.categoria, p.disponible
     FROM inventario i JOIN productos p ON p.id = i.producto_id WHERE i.producto_id = ?`,
    [productoId]
  );
  res.json({ inventario: producto });
});

export default router;
