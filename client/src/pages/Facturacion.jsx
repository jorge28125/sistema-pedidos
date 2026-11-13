import { useEffect, useState } from 'react';
import { api, fmt } from '../api';
import { SkeletonRows, useToast } from '../components/ui';

export default function Facturacion() {
  const toast = useToast();
  const [ventas, setVentas] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emitiendo, setEmitiendo] = useState(null);

  const load = () =>
    Promise.all([
      api.get('/api/ventas').then((r) => r.ventas || []),
      api.get('/api/facturas').then((r) => r.facturas || []).catch(() => []),
    ])
      .then(([v, f]) => { setVentas(v); setFacturas(f); })
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const emitir = async (ventaId) => {
    setEmitiendo(ventaId);
    try {
      const res = await api.post('/api/facturas', { ventaId });
      toast(`Factura emitida: ${res.factura?.numeroFactura}`);
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setEmitiendo(null);
    }
  };

  return (
    <div>
      <div className="admin-topbar"><div><h1>Facturación</h1><p className="muted">Emite la factura electrónica de cada venta.</p></div></div>
      <div className="card">
        <h2 className="section-title">Ventas para facturar</h2>
        {loading && <SkeletonRows n={3} />}
        {!loading && ventas.length === 0 && <div className="empty"><strong>No hay ventas por facturar</strong>Aparecerán cuando entregues pedidos.</div>}
        {!loading && ventas.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Pedido</th><th>Mesa</th><th>Fecha</th><th className="num">Total</th><th>Acción</th></tr></thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id}>
                    <td className="order-code">{v.codigo}</td>
                    <td><span className="table-pill">{v.mesa_numero}</span></td>
                    <td>{v.created_at}</td>
                    <td className="num"><strong>{fmt(v.total)}</strong></td>
                    <td>
                      <button className="btn small" disabled={emitiendo === v.pedido_id} onClick={() => emitir(v.pedido_id)}>
                        {emitiendo === v.pedido_id ? 'Emitiendo…' : 'Emitir factura'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card">
        <h2 className="section-title">Facturas emitidas</h2>
        {!loading && facturas.length === 0 && <div className="empty"><strong>Aún no hay facturas</strong>Las facturas que emitas se listarán aquí.</div>}
        {facturas.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Número</th><th>Venta</th><th>Estado</th></tr></thead>
              <tbody>
                {facturas.map((f) => (
                  <tr key={f.id}><td className="order-code">{f.numero_factura}</td><td>#{f.venta_id}</td><td>{f.estado}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
