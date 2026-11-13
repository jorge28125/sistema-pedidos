import { useEffect, useMemo, useState } from 'react';
import { api, fmt } from '../api';
import { Badge, ESTADO_TXT, Icon, SkeletonRows, useToast } from '../components/ui';

const ESTADOS = ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'];

const SIGUIENTE = {
  PENDIENTE: { a: 'EN_PREPARACION', label: 'Iniciar preparación' },
  EN_PREPARACION: { a: 'LISTO', label: 'Marcar listo' },
  LISTO: { a: 'ENTREGADO', label: 'Entregar y cobrar' },
};

export default function Orders() {
  const toast = useToast();
  const [pedidos, setPedidos] = useState([]);
  const [estado, setEstado] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);

  const load = () =>
    api.get('/api/pedidos')
      .then((res) => setPedidos(res.pedidos || []))
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, []);

  const conteo = useMemo(() => {
    const c = { '': pedidos.length };
    for (const p of pedidos) c[p.estado] = (c[p.estado] || 0) + 1;
    return c;
  }, [pedidos]);

  const lista = pedidos.filter((p) => {
    if (estado && p.estado !== estado) return false;
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return `${p.codigo} mesa ${p.mesa_numero} ${p.items?.map((i) => i.nombre).join(' ')}`.toLowerCase().includes(t);
  });

  const cambiar = async (p, nuevo) => {
    try {
      await api.patch(`/api/pedidos/${p.id}`, { estado: nuevo });
      setPedidos((l) => l.map((x) => (x.id === p.id ? { ...x, estado: nuevo } : x)));
      setFlash(p.id);
      setTimeout(() => setFlash(null), 1200);
      toast(`Pedido ${p.codigo}: ${ESTADO_TXT[nuevo].toLowerCase()}`);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div>
      <div className="admin-topbar">
        <div><h1>Pedidos</h1><p className="muted">Se actualizan solos cada 20 segundos.</p></div>
      </div>

      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Filtrar por estado">
          {[['', 'Todos'], ...ESTADOS.map((e) => [e, ESTADO_TXT[e]])].map(([val, txt]) => (
            <button key={val} role="tab" aria-selected={estado === val} className="tab" onClick={() => setEstado(val)}>
              {txt} <span className="count">{conteo[val] || 0}</span>
            </button>
          ))}
        </div>
        <div className="search">
          <Icon name="search" size={18} />
          <input className="field" type="search" placeholder="Buscar por código, mesa o producto" aria-label="Buscar pedidos" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card">
        {loading && <SkeletonRows n={5} />}
        {!loading && lista.length === 0 && (
          <div className="empty"><strong>No hay pedidos aquí</strong>{estado || q ? 'Cambia el filtro o la búsqueda.' : 'Cuando un cliente envíe un pedido, aparecerá en esta lista.'}</div>
        )}
        {!loading && lista.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Código</th><th>Mesa</th><th>Productos</th><th className="num">Total</th><th>Estado</th><th>Acción</th></tr>
              </thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.id} className={flash === p.id ? 'flash' : ''}>
                    <td className="order-code">{p.codigo}</td>
                    <td><span className="table-pill">{p.mesa_numero}</span></td>
                    <td className="order-items">{p.items?.map((i) => `${i.cantidad} × ${i.nombre}`).join(', ')}</td>
                    <td className="num">{fmt(p.total)}</td>
                    <td><Badge estado={p.estado} /></td>
                    <td>
                      <div className="flex wrap">
                        {SIGUIENTE[p.estado] && (
                          <button className="btn small" onClick={() => cambiar(p, SIGUIENTE[p.estado].a)}>{SIGUIENTE[p.estado].label}</button>
                        )}
                        {(p.estado === 'PENDIENTE' || p.estado === 'EN_PREPARACION') && (
                          <button className="btn small danger" onClick={() => cambiar(p, 'CANCELADO')}>Cancelar</button>
                        )}
                      </div>
                    </td>
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
