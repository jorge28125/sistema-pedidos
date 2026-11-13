import { useEffect, useState } from 'react';
import { api, fmt } from '../api';

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/api/ventas')
      .then((res) => setVentas(res.ventas || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const facturar = async (id) => {
    try {
      const res = await api.post('/api/facturas', { ventaId: id });
      alert(`Factura emitida: ${res.factura?.numeroFactura}`);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="admin-topbar"><h1>Ventas</h1></div>
      <div className="card">
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {loading && <div className="empty">Cargando ventas…</div>}
        {!loading && ventas.length === 0 && <div className="empty">Sin ventas registradas</div>}
        {!loading && ventas.length > 0 && (
          <table>
            <thead>
              <tr><th>Venta</th><th>Pedido</th><th>Mesa</th><th>Fecha</th><th>Total</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id}>
                  <td>#{v.id}</td>
                  <td>{v.codigo}</td>
                  <td>{v.mesa_numero}</td>
                  <td>{v.created_at}</td>
                  <td>{fmt(v.total)}</td>
                  <td>
                    <button className="btn small" onClick={() => facturar(v.pedido_id)}>Facturar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
