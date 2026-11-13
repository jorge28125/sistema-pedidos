import { useEffect, useState } from 'react';
import { api, fmt } from '../api';

export default function Facturacion() {
  const [ventas, setVentas] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [error, setError] = useState('');
  const [emitiendo, setEmitiendo] = useState(null);

  const load = () => {
    Promise.all([api.get('/api/ventas').then((r) => r.ventas || []), api.get('/api/facturas').then((r) => r.facturas || []).catch(() => [])])
      .then(([v, f]) => { setVentas(v); setFacturas(f); })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const emitir = async (ventaId) => {
    setEmitiendo(ventaId);
    try {
      const res = await api.post('/api/facturas', { ventaId });
      alert(`Factura emitida: ${res.factura?.numeroFactura}`);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setEmitiendo(null);
    }
  };

  return (
    <div>
      <div className="admin-topbar"><h1>Facturación electrónica</h1></div>
      <div className="card">
        <h2 className="section-title">Ventas para facturar</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {ventas.length === 0 && <div className="empty">No hay ventas</div>}
        {ventas.map((v) => (
          <div className="cart-item" key={v.id} style={{ borderBottom: '1px solid #eee' }}>
            <span>Pedido {v.codigo} — Mesa {v.mesa_numero} — {v.created_at}</span>
            <span className="flex">
              <strong>{fmt(v.total)}</strong>
              <button className="btn small" disabled={emitiendo === v.pedido_id} onClick={() => emitir(v.pedido_id)}>
                {emitiendo === v.pedido_id ? 'Emitiendo...' : 'Emitir factura'}
              </button>
            </span>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="section-title">Facturas emitidas</h2>
        {facturas.length === 0 && <div className="empty">Aún no se han emitido facturas</div>}
        {facturas.map((f) => (
          <div className="cart-item" key={f.id} style={{ borderBottom: '1px solid #eee' }}>
            <span>Factura #{f.id} — Venta {f.venta_id} — Estado: {f.estado}</span>
            <span>{f.numero_factura}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
