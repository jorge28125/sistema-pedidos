import { Router } from 'express';
import { get, run, all } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { generateOrderCode } from '../utils.js';

export const router = Router();
const IVA = 0.19;

router.get('/', requireAuth(), (req, res) => {
  const { estado, mesa, desde, hasta, take } = req.query;
  let sql = `SELECT p.id, p.codigo, p.mesa_id, p.usuario_id, p.items, p.subtotal, p.iva, p.total,
                    p.estado, p.observaciones, p.created_at, p.updated_at, m.numero AS mesa_numero
             FROM pedidos p JOIN mesas m ON m.id = p.mesa_id`;
  const params = [];
  const conditions = [];
  if (estado) { conditions.push('p.estado = ?'); params.push(estado); }
  if (mesa) { conditions.push('m.numero = ?'); params.push(Number(mesa)); }
  if (desde) { conditions.push('p.created_at >= ?'); params.push(desde); }
  if (hasta) { conditions.push('p.created_at <= ?'); params.push(`${hasta} 23:59:59`); }
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ' ORDER BY p.created_at DESC';
  if (take) { sql += ' LIMIT ?'; params.push(Number(take)); }
  const pedidos = all(sql, params);
  res.json({ pedidos: pedidos.map((p) => ({ ...p, items: JSON.parse(p.items || '[]') })) });
});

router.post('/', (req, res) => {
  const { mesa, items, observaciones } = req.body || {};
  const mesaNumero = Number(mesa);
  const mesaRow = get('SELECT * FROM mesas WHERE numero = ?', [mesaNumero]);
  if (!mesaRow) return res.status(404).json({ error: 'Mesa no encontrada' });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Debe enviar al menos un producto' });
  }
  const detalle = [];
  let subtotal = 0;
  for (const it of items) {
    const producto = get('SELECT * FROM productos WHERE id = ?', [Number(it.productoId)]);
    if (!producto) return res.status(400).json({ error: `Producto ${it.productoId} no encontrado` });
    if (!producto.disponible) return res.status(400).json({ error: `Producto ${producto.nombre} no disponible` });
    const inv = get('SELECT * FROM inventario WHERE producto_id = ?', [producto.id]);
    const cantidad = Number(it.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) return res.status(400).json({ error: 'Cantidad inválida' });
    if (Number(inv.stock) < cantidad) {
      return res.status(409).json({ error: `Stock insuficiente para ${producto.nombre}` });
    }
    subtotal += producto.precio * cantidad;
    detalle.push({ productoId: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad });
  }
  const iva = subtotal * IVA;
  const total = subtotal + iva;
  const codigo = generateOrderCode();
  const info = run(
    `INSERT INTO pedidos (codigo, mesa_id, usuario_id, items, subtotal, iva, total, estado, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?)`,
    [codigo, mesaRow.id, null, JSON.stringify(detalle), subtotal, iva, total, observaciones || '']
  );
  const pedidoId = Number(info.lastInsertRowid);
  for (const d of detalle) {
    run('UPDATE inventario SET stock = stock - ? WHERE producto_id = ?', [d.cantidad, d.productoId]);
  }
  const pedido = get('SELECT * FROM pedidos WHERE id = ?', [pedidoId]);
  res.status(201).json({
    pedido: { ...pedido, items: JSON.parse(pedido.items || '[]'), mesa: { numero: mesaNumero } },
  });
});

router.patch('/:id', requireAuth(['admin', 'cocina']), (req, res) => {
  const id = Number(req.params.id);
  const { estado } = req.body || {};
  const pedido = get('SELECT * FROM pedidos WHERE id = ?', [id]);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  const transiciones = {
    PENDIENTE: ['EN_PREPARACION', 'CANCELADO'],
    EN_PREPARACION: ['LISTO'],
    LISTO: ['ENTREGADO'],
    ENTREGADO: [],
    CANCELADO: [],
  };
  const permitidos = transiciones[pedido.estado] || [];
  if (!permitidos.includes(estado)) {
    return res.status(400).json({ error: `Transición inválida de ${pedido.estado} a ${estado}` });
  }
  if (estado === 'ENTREGADO') {
    run('INSERT INTO ventas (pedido_id, total) VALUES (?, ?)', [id, pedido.total]);
  }
  if (estado === 'CANCELADO') {
    const items = JSON.parse(pedido.items || '[]');
    for (const it of items) {
      run('UPDATE inventario SET stock = stock + ? WHERE producto_id = ?', [it.cantidad, it.productoId]);
    }
  }
  run("UPDATE pedidos SET estado = ?, updated_at = datetime('now') WHERE id = ?", [estado, id]);
  const updated = get('SELECT * FROM pedidos WHERE id = ?', [id]);
  res.json({ pedido: { ...updated, items: JSON.parse(updated.items || '[]') } });
});

export default router;
