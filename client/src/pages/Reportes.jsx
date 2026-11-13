import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { api, fmt } from '../api';

export default function Reportes() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/api/reportes/ventas')
      .then((res) => setData(res.reporte))
      .catch(() => {});
  }, []);

  const chartData = (data?.porDia || []).map((r) => ({
    dia: r.dia,
    total: Number(r.total || 0),
    pedidos: Number(r.pedidos || 0),
  }));

  return (
    <div>
      <div className="admin-topbar"><h1>Reportes</h1></div>
      <div className="card">
        <h2 className="section-title">Ventas por día</h2>
        {chartData.length === 0 ? (
          <div className="empty">Sin datos de ventas</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" name="Total" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="card">
        <h2 className="section-title">Top productos vendidos</h2>
        <table>
          <thead>
            <tr><th>Producto</th><th>Cantidad</th><th>Total vendido</th></tr>
          </thead>
          <tbody>
            {(data?.porProducto || []).map((p) => (
              <tr key={p.productoId}>
                <td>{p.nombre}</td>
                <td>{p.cantidad}</td>
                <td>{fmt(p.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2 className="section-title">Resumen</h2>
        <p>Total general de ventas: <strong>{fmt(data?.totalGeneral)}</strong></p>
      </div>
    </div>
  );
}
