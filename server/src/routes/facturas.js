import { Router } from 'express';
import { get, run, all } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

export const router = Router();

router.get('/', (req, res) => {
  const facturas = all('SELECT * FROM facturas ORDER BY id DESC', []);
  res.json({ facturas });
});

router.post('/', requireAdmin(), async (req, res) => {
  const { ventaId } = req.body || {};
  const venta = get(
    `SELECT v.id, v.pedido_id, v.total, v.created_at, p.codigo, p.estado, p.items, p.subtotal, p.iva,
            m.numero AS mesa_numero
     FROM ventas v
     JOIN pedidos p ON p.id = v.pedido_id
     JOIN mesas m ON m.id = p.mesa_id
     WHERE v.id = ?`,
    [Number(ventaId)]
  );
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  if (venta.estado !== 'ENTREGADO') {
    return res.status(400).json({ error: 'La venta debe estar entregada para facturar' });
  }

  const payload = {
    tipo: Number(process.env.FACTURA_TIPO) || 1,
    numeroFactura: `F-${Date.now()}`,
    fechaEmision: new Date().toISOString(),
    cliente: {
      tipoDocumento: 'CC',
      documento: '000000000000',
      nombre: 'Cliente general',
    },
    items: JSON.parse(venta.items || '[]').map((it) => ({ ...it, precio: it.precio, cantidad: it.cantidad })),
    totales: { subtotal: venta.subtotal, iva: venta.iva, total: venta.total },
  };

  const respuesta = await new Promise((resolve, reject) => {
    fetch(process.env.FACTURA_API_URL || 'https://api.fiscoapi.com/v1/facturas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FACTURA_API_TOKEN || ''}`,
      },
      body: JSON.stringify(payload),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        resolve({ status: r.status, data });
      })
      .catch(reject);
  });

  if (!respuesta.ok) {
    return res.status(502).json({ error: 'Error en la API de facturación electrónica', detalle: respuesta.data });
  }

  const numeroFactura = respuesta.data?.numeroFactura || payload.numeroFactura;
  const cufe = respuesta.data?.cufe || null;
  const cufi = respuesta.data?.cufi || null;
  run(
    'INSERT INTO facturas (venta_id, numero_factura, estado, cufe, cufi, respuesta) VALUES (?, ?, ?, ?, ?, ?)',
    [Number(ventaId), numeroFactura, 'EMITIDA', cufe, cufi, JSON.stringify(respuesta.data)]
  );
  res.json({ factura: { ventaId, numeroFactura, estado: 'EMITIDA', cufe, cufi } });
});

export default router;
