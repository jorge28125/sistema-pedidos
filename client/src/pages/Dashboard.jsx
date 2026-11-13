import { useEffect, useState } from 'react';
import { api, fmt, getUser } from '../api';
import { CountUp, SkeletonRows } from '../components/ui';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/dashboard')
      .then((res) => setData(res.dashboard))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="empty"><strong>No se pudo cargar el resumen</strong>{error}</div>;
  if (!data) return <div className="card"><SkeletonRows n={5} /></div>;

  const cards = [
    { label: 'Ventas de hoy', value: data.ventasHoy?.total, format: fmt, hero: true },
    { label: 'Pedidos entregados hoy', value: data.ventasHoy?.pedidos || 0 },
    { label: 'Ticket promedio de hoy', value: data.ventasHoy?.ticketPromedio, format: fmt },
    { label: 'Pedidos activos ahora', value: data.pedidosActivos || 0 },
  ];
  const top = data.topProductos || [];
  const max = Math.max(1, ...top.map((p) => p.cantidad));
  const nombre = getUser()?.nombre?.split(' ')[0];

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1>Hola{nombre ? `, ${nombre}` : ''}</h1>
          <p className="muted">Así va la cafetería hoy.</p>
        </div>
      </div>
      <div className="stat-grid">
        {cards.map((c) => (
          <div className={`stat-card ${c.hero ? 'hero' : ''}`} key={c.label}>
            <div className="label">{c.label}</div>
            <div className="value"><CountUp value={Number(c.value || 0)} format={c.format} /></div>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="section-title">Lo más vendido en los últimos 7 días</h2>
        {top.length === 0 && <div className="empty"><strong>Aún no hay ventas</strong>Cuando se entreguen pedidos, los productos aparecerán aquí.</div>}
        {top.map((p, i) => (
          <div className="rank-row" key={p.productoId}>
            <span className="rank-pos">{i + 1}</span>
            <div>
              <div className="rank-name"><span>{p.nombre}</span><span>{p.cantidad} vendidos</span></div>
              <div className="rank-bar"><i style={{ width: `${(p.cantidad / max) * 100}%`, animationDelay: `${i * 90}ms` }} /></div>
            </div>
            <span className="rank-total">{fmt(p.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
