import { useEffect, useState } from 'react';
import { api, fmt } from '../api';

const ESTADOS = ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'];

const SIGUIENTE = {
  PENDIENTE: { a: 'EN_PREPARACION', label: 'Iniciar preparación' },
  EN_PREPARACION: { a: 'LISTO', label: 'Marcar listo' },
  LISTO: { a: 'ENTREGADO', label: 'Entregar / cobrar' },
};

const CANCELAR = { desde: ['PENDIENTE', 'EN_PREPARACION'], a: 'CANCELADO', label: 'Cancelar' };

export default function Orders() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (estadoFiltro) => {
    setLoading(true);
    api
      .get('/api/pedidos', { params: { estado: estadoFiltro || undefined } })
      .then((res) => setPedidos(res.pedidos || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(estado);
  }, [estado]);

  const cambiar = async (id, nuevo) => {
    try {
      await api.patch(`/api/pedidos/${id}`, { estado: nuevo });
      load(estado);
    } catch (e) {
      alert(e.message);
    }
  };

  const badgeClass = (e) => `badge ${e}`;

  return (
    <div>
      <div className="admin-topbar">
        <h1>Pedidos</h1>
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>
      <div className="card">
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {loading && <div className="empty">Cargando pedidos…</div>}
        {!loading && pedidos.length === 0 && <div className="empty">No hay pedidos</div>}
        {!loading && pedidos.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Mesa</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td>{p.codigo}</td>
                  <td>{p.mesa_numero}</td>
                  <td>
                    {p.items?.map((i) => `${i.nombre} ×${i.cantidad}`).join(', ')}
                  </td>
                  <td>{fmt(p.total)}</td>
                  <td><span className={badgeClass(p.estado)}>{p.estado}</span></td>
                  <td>
                    <div className="flex">
                      {SIGUIENTE[p.estado] && (
                        <button className="btn small" onClick={() => cambiar(p.id, SIGUIENTE[p.estado].a)}>
                          {SIGUIENTE[p.estado].label}
                        </button>
                      )}
                      {(p.estado === 'PENDIENTE' || p.estado === 'EN_PREPARACION') && (
                        <button className="btn small danger" onClick={() => cambiar(p.id, CANCELAR.a)}>
                          {CANCELAR.label}
                        </button>
                      )}
                    </div>
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
