import { Router } from 'express';
import { get, all } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

export const router = Router();

router.get('/', requireAdmin(), (req, res) => {
  const hoy = new Date().toISOString().slice(0, 10);

  const ventasHoy = all(`SELECT * FROM ventas WHERE date(created_at) = ?`, [hoy]);
  const totalVentasHoy = ventasHoy.reduce((acc, v) => acc + v.total, 0);
  const entregadosHoy = ventasHoy.length;

  const pedidosActivos = all(
    `SELECT * FROM pedidos WHERE estado IN ('PENDIENTE','EN_PREPARACION','LISTO')`
  );
  const pedidosHoy = all(`SELECT * FROM pedidos WHERE date(created_at) = ?`, [hoy]);

  const hace7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const pedidosRecientes = all(
    `SELECT * FROM pedidos WHERE estado = 'ENTREGADO' AND date(created_at) >= ?`,
    [hace7]
  );
  const topMap = new Map();
  for (const p of pedidosRecientes) {
    const items = JSON.parse(p.items || '[]');
    for (const it of items) {
      const cur = topMap.get(it.productoId) || { productoId: it.productoId, nombre: it.nombre, cantidad: 0, total: 0 };
      cur.cantidad += it.cantidad;
      cur.total += it.cantidad * it.precio;
      topMap.set(it.productoId, cur);
    }
  }
  const topProductos = [...topMap.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

  res.json({
    dashboard: {
      ventasHoy: {
        total: totalVentasHoy,
        pedidos: entregadosHoy,
        ticketPromedio: entregadosHoy ? totalVentasHoy / entregadosHoy : 0,
      },
      pedidosHoy: { total: pedidosHoy.length },
      pedidosActivos: pedidosActivos.length,
      topProductos,
    },
  });
});

export default router;
