import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api, getToken, getUser, logout } from '../api';
import { Icon, minutesSince, useToast } from '../components/ui';

const SIGUIENTE = {
  PENDIENTE: { a: 'EN_PREPARACION', label: 'Empezar a preparar', cls: 'next' },
  EN_PREPARACION: { a: 'LISTO', label: 'Marcar listo', cls: 'done' },
  LISTO: { a: 'ENTREGADO', label: 'Entregado en la mesa', cls: 'secondary' },
};

const LANES = [
  { estado: 'PENDIENTE', titulo: 'Por preparar', color: '#f2c12e', vacio: 'Sin pedidos nuevos.' },
  { estado: 'EN_PREPARACION', titulo: 'En preparación', color: '#4fb3d6', vacio: 'Nada en preparación.' },
  { estado: 'LISTO', titulo: 'Listos para entregar', color: '#5fe0a0', vacio: 'Nada esperando entrega.' },
];

export default function Kitchen() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [saliendo, setSaliendo] = useState(null);
  const [nuevos, setNuevos] = useState(new Set());
  const vistos = useRef(null);
  const token = getToken();
  const user = getUser();

  const load = () => {
    if (!getToken()) return;
    Promise.all(LANES.map((l) => api.get('/api/pedidos', { params: { estado: l.estado } }).then((r) => r.pedidos || [])))
      .then((listas) => {
        const todos = listas.flat();
        const ids = new Set(todos.map((p) => p.id));
        if (vistos.current) {
          const frescos = todos.filter((p) => !vistos.current.has(p.id) && p.estado === 'PENDIENTE');
          if (frescos.length) {
            setNuevos(new Set(frescos.map((p) => p.id)));
            toast(frescos.length === 1 ? `Llegó un pedido: mesa ${frescos[0].mesa_numero}` : `Llegaron ${frescos.length} pedidos nuevos`);
            setTimeout(() => setNuevos(new Set()), 6000);
          }
        }
        vistos.current = ids;
        setPedidos(todos);
        setError('');
        setNow(Date.now());
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const poll = setInterval(load, 10000);
    const clock = setInterval(() => setNow(Date.now()), 30000);
    return () => { clearInterval(poll); clearInterval(clock); };
  }, []);

  if (!token) return <Navigate to="/admin/login" replace state={{ from: location }} />;

  const cambiar = async (p, nuevo) => {
    try {
      await api.patch(`/api/pedidos/${p.id}`, { estado: nuevo });
      setSaliendo(p.id);
      setTimeout(() => {
        setPedidos((l) => (nuevo === 'ENTREGADO' ? l.filter((x) => x.id !== p.id) : l.map((x) => (x.id === p.id ? { ...x, estado: nuevo } : x))));
        setSaliendo(null);
      }, 280);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const salir = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const tarjeta = (p) => {
    const min = minutesSince(p.created_at, now);
    const tarde = min >= 15;
    const sig = SIGUIENTE[p.estado];
    return (
      <article key={p.id} className={`k-ticket ${tarde ? 'late' : ''} ${nuevos.has(p.id) ? 'new' : ''} ${saliendo === p.id ? 'leaving' : ''}`}>
        <div className="k-head">
          <h3>Mesa {p.mesa_numero}</h3>
          <span className={`k-age ${tarde ? 'late' : min >= 8 ? 'warn' : ''}`} title="Tiempo desde que llegó">{min} min</span>
        </div>
        <div className="k-code">Pedido {p.codigo}</div>
        <ul>
          {p.items?.map((i) => (
            <li key={i.productoId}><b>{i.cantidad}</b>{i.nombre}</li>
          ))}
        </ul>
        {p.observaciones && <p className="k-note">Nota: {p.observaciones}</p>}
        {sig && <button className={`btn ${sig.cls}`} onClick={() => cambiar(p, sig.a)}>{sig.label}</button>}
      </article>
    );
  };

  return (
    <div className="kitchen-page">
      <div className="kitchen-top">
        <div>
          <h1>Cocina</h1>
          <Link className="kitchen-home-link" to="/">Volver a la portada</Link>
        </div>
        <span className="spacer" />
        <span className={`live ${error ? 'stale' : ''}`}><i />{error ? 'Sin conexión, reintentando…' : 'En vivo'}</span>
        <button className="btn small ghost" onClick={load}><Icon name="refresh" size={16} /> Actualizar</button>
        {user?.rol === 'admin' && <button className="btn small ghost" onClick={() => navigate('/admin')}>Ir al panel</button>}
        <button className="btn small ghost" onClick={salir}><Icon name="out" size={16} /> Salir</button>
      </div>

      <div className="board">
        {LANES.map((l) => {
          const lista = pedidos.filter((p) => p.estado === l.estado).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
          return (
            <section className="lane" key={l.estado} aria-label={l.titulo}>
              <h2 className="lane-head"><i className="dot" style={{ background: l.color }} />{l.titulo}<span className="n">{lista.length}</span></h2>
              {loading && <div className="lane-empty">Cargando pedidos…</div>}
              {!loading && lista.length === 0 && <div className="lane-empty">{l.vacio}</div>}
              {lista.map(tarjeta)}
            </section>
          );
        })}
      </div>
    </div>
  );
}
