import { Router } from 'express';
import { get, run, all } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

export const router = Router();

router.get('/', (req, res) => {
  res.json({ mesas: all('SELECT * FROM mesas ORDER BY numero', []) });
});

router.post('/', requireAdmin(), (req, res) => {
  const numero = Number(req.body?.numero);
  if (!numero) return res.status(400).json({ error: 'Numero de mesa requerido' });
  const mesa = get('SELECT * FROM mesas WHERE numero = ?', [numero]);
  if (mesa) return res.status(409).json({ error: 'La mesa ya existe' });
  const info = run('INSERT INTO mesas (numero) VALUES (?)', [numero]);
  res.status(201).json({ mesa: get('SELECT * FROM mesas WHERE id = ?', [Number(info.lastInsertRowid)]) });
});

router.get('/:numero/menu', (req, res) => {
  const numero = Number(req.params.numero);
  const mesa = get('SELECT * FROM mesas WHERE numero = ?', [numero]);
  if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });
  const productos = all(
    `SELECT p.id, p.nombre, p.descripcion, p.precio, p.categoria, p.disponible, i.stock, i.unidad
     FROM productos p JOIN inventario i ON i.producto_id = p.id
     WHERE p.disponible = 1
     ORDER BY p.categoria, p.id`,
    []
  );
  const disponibles = productos.filter((p) => p.stock > 0);
  res.json({ mesa: { numero }, productos: disponibles });
});

export default router;
