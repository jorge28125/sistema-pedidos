import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { api, fmt } from '../api';
import { CountUp, SkeletonRows } from '../components/ui';

export default function Reportes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activo, setActivo] = useState(null);

  useEffect(() => {
    api.get('/api/reportes/ventas')
      .then((res) => setData(res.reporte))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chartData = (data?.porDia || []).map((r) => ({ dia: r.dia, total: Number(r.total || 0), pedidos: Number(r.pedidos || 0) }));
  const productos = data?.porProducto || [];

  return (
    <div>
      <div className="admin-topbar">
        <div><h1>Reportes</h1><p className="muted">Pasa el cursor sobre una barra para ver el detalle del día.</p></div>
      </div>
      <div className="stat-grid">
        <div className="stat-card hero">
          <div className="label">Total general de ventas</div>
          <div className="value"><CountUp value={Number(data?.totalGeneral || 0)} format={fmt} /></div>
        </div>
      </div>
      <div className="card">
        <h2 className="section-title">Ventas por día</h2>
        {loading ? <SkeletonRows n={4} /> : chartData.length === 0 ? (
          <div className="empty"><strong>Sin datos todavía</strong>El gráfico aparece con la primera venta.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} onMouseLeave={() => setActivo(null)}>
              <CartesianGrid strokeDasharray="4 4" stroke="#cfdbd2" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: '#6f8a80', fontSize: 13 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6f8a80', fontSize: 13 }} axisLine={false} tickLine={false} width={64} />
              <Tooltip cursor={{ fill: 'rgba(242,193,46,.2)' }} formatter={(v, n) => [n === 'total' ? fmt(v) : v, n === 'total' ? 'Ventas' : 'Pedidos']} />
              <Bar dataKey="total" name="total" radius={[8, 8, 0, 0]} onMouseEnter={(_, i) => setActivo(i)}>
                {chartData.map((_, i) => <Cell key={i} fill={activo === null || activo === i ? '#12372f' : '#b7c6bd'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="card">
        <h2 className="section-title">Productos vendidos</h2>
        {productos.length === 0 ? <div className="empty"><strong>Sin ventas por producto</strong></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Producto</th><th className="num">Cantidad</th><th className="num">Total vendido</th></tr></thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.productoId}><td><strong>{p.nombre}</strong></td><td className="num">{p.cantidad}</td><td className="num">{fmt(p.total)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
