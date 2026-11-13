import { useEffect, useState } from 'react';
import { api, fmt } from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/dashboard')
      .then((res) => setData(res.dashboard))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="empty">Error: {error}</div>;
  if (!data) return <div className="empty">Cargando...</div>;

  const cards = [
    { label: 'Ventas de hoy', value: fmt(data.ventasHoy?.total) },
    { label: 'Pedidos entregados hoy', value: String(data.ventasHoy?.pedidos || 0) },
    { label: 'Ticket promedio (hoy)', value: fmt(data.ventasHoy?.ticketPromedio) },
    { label: 'Pedidos activos', value: String(data.pedidosActivos) },
  ];

  return (
    <div>
      <div className="admin-topbar">
        <h1>Dashboard</h1>
      </div>
      <div className="stat-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="label">{c.label}</div>
            <div className="value">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="section-title">Top productos (últimos 7 días)</h2>
        {data.topProductos?.length === 0 && <div className="empty">Sin ventas aún</div>}
        {data.topProductos?.map((p) => (
          <div className="cart-item" key={p.productoId}>
            <span>{p.nombre} — {p.cantidad} vendidos</span>
            <span>{fmt(p.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
