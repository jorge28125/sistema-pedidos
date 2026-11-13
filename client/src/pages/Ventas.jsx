import { useEffect, useState } from 'react';
import { api, fmt } from '../api';
import { SkeletonRows, useToast } from '../components/ui';

export default function Ventas() {
  const toast = useToast();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.get('/api/ventas')
      .then((res) => setVentas(res.ventas || []))
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const facturar = async (id) => {
    try {
      const res = await api.post('/api/facturas', { ventaId: id });
      toast(`Factura emitida: ${res.factura?.numeroFactura}`);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const suma = ventas.reduce((a, v) => a + Number(v.total || 0), 0);

  return (
    <div>
      <div className="admin-topbar">
        <div><h1>Ventas</h1><p className="muted">{ventas.length ? `${ventas.length} ventas por un total de ${fmt(suma)}.` : 'Cada pedido entregado queda registrado aquí.'}</p></div>
      </div>
      <div className="card">
        {loading && <SkeletonRows n={5} />}
        {!loading && ventas.length === 0 && <div className="empty"><strong>Aún no hay ventas</strong>Se registran cuando entregas un pedido.</div>}
        {!loading && ventas.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Venta</th><th>Pedido</th><th>Mesa</th><th>Fecha</th><th className="num">Total</th><th>Acción</th></tr></thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id}>
                    <td>#{v.id}</td>
                    <td className="order-code">{v.codigo}</td>
                    <td><span className="table-pill">{v.mesa_numero}</span></td>
                    <td>{v.created_at}</td>
                    <td className="num"><strong>{fmt(v.total)}</strong></td>
                    <td><button className="btn small" onClick={() => facturar(v.pedido_id)}>Facturar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
