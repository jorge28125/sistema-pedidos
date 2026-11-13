import { Router } from 'express';
import { all } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

export const router = Router();

router.get('/ventas', requireAdmin(), (req, res) => {
  const { desde, hasta } = req.query;
  const params = [];
  let sql = `SELECT date(v.created_at) AS dia, COUNT(*) AS pedidos, SUM(v.total) AS total
             FROM ventas v`;
  const conditions = [];
  if (desde) { conditions.push('v.created_at >= ?'); params.push(desde); }
  if (hasta) { conditions.push('v.created_at <= ?'); params.push(`${hasta} 23:59:59`); }
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ' GROUP BY dia ORDER BY dia DESC';
  const porDia = all(sql, params);

  const detalle = all(
    `SELECT v.total, p.items, p.created_at FROM ventas v JOIN pedidos p ON p.id = v.pedido_id`,
    []
  );
  const porProductoMap = new Map();
  for (const d of detalle) {
    const items = JSON.parse(d.items || '[]');
    for (const it of items) {
      const cur = porProductoMap.get(it.productoId) || { productoId: it.productoId, nombre: it.nombre, cantidad: 0, total: 0 };
      cur.cantidad += it.cantidad;
      cur.total += it.cantidad * it.precio;
      porProductoMap.set(it.productoId, cur);
    }
  }
  const porProducto = [...porProductoMap.values()].sort((a, b) => b.cantidad - a.cantidad);

  const totalGeneral = all(`SELECT COALESCE(SUM(total), 0) AS total FROM ventas`, [])[0];

  res.json({
    reporte: {
      porDia: porDia || [],
      porProducto,
      totalGeneral: totalGeneral?.total || 0,
    },
  });
});

export default router;
