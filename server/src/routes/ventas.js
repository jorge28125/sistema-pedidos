import { Router } from 'express';
import { get, all } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

export const router = Router();

router.get('/', requireAdmin(), (req, res) => {
  const { desde, hasta } = req.query;
  let sql = `SELECT v.id, v.pedido_id, v.total, v.created_at, p.codigo, p.estado, m.numero AS mesa_numero
             FROM ventas v
             JOIN pedidos p ON p.id = v.pedido_id
             JOIN mesas m ON m.id = p.mesa_id`;
  const params = [];
  const conditions = [];
  if (desde) { conditions.push('v.created_at >= ?'); params.push(desde); }
  if (hasta) { conditions.push('v.created_at <= ?'); params.push(`${hasta} 23:59:59`); }
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ' ORDER BY v.created_at DESC';
  const ventas = all(sql, params);
  res.json({ ventas });
});

export default router;
