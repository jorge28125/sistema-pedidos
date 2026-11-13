import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api, fmt, getToken, getUser, logout } from '../api';

const SIGUIENTE = {
  PENDIENTE: { a: 'EN_PREPARACION', label: 'Iniciar preparación' },
  EN_PREPARACION: { a: 'LISTO', label: 'Marcar listo' },
  LISTO: { a: 'ENTREGADO', label: 'Entregar' },
};

export default function Kitchen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendientes, setPendientes] = useState([]);
  const [enPreparacion, setEnPreparacion] = useState([]);
  const [listos, setListos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const token = getToken();
  const user = getUser();

  const load = () => {
    if (!getToken()) return;
    Promise.all([
      api.get('/api/pedidos', { params: { estado: 'PENDIENTE' } }).then((r) => r.pedidos || []),
      api.get('/api/pedidos', { params: { estado: 'EN_PREPARACION' } }).then((r) => r.pedidos || []),
      api.get('/api/pedidos', { params: { estado: 'LISTO' } }).then((r) => r.pedidos || []),
    ])
      .then(([p, ep, l]) => {
        setPendientes(p);
        setEnPreparacion(ep);
        setListos(l);
        setError('');
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  if (!token) return <Navigate to="/admin/login" replace state={{ from: location }} />;

  const cambiar = async (id, nuevo) => {
    try {
      await api.patch(`/api/pedidos/${id}`, { estado: nuevo });
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const salir = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const tarjeta = (p) => (
    <div className="card" key={p.id} style={{ borderLeft: '5px solid #f59e0b' }}>
      <div className="flex">
        <h3 style={{ margin: 0 }}>Mesa {p.mesa_numero}</h3>
        <span className={`badge ${p.estado}`}>{p.estado}</span>
        <span className="spacer" />
        <strong>{fmt(p.total)}</strong>
      </div>
      <p><strong>Código:</strong> {p.codigo}</p>
      <ul>
        {p.items?.map((i) => (
          <li key={i.productoId}>{i.nombre} × {i.cantidad} — {fmt(i.precio * i.cantidad)}</li>
        ))}
      </ul>
      {p.observaciones && <p className="muted">Obs: {p.observaciones}</p>}
      <div className="flex">
        {SIGUIENTE[p.estado] && (
          <button className="btn small" onClick={() => cambiar(p.id, SIGUIENTE[p.estado].a)}>
            {SIGUIENTE[p.estado].label}
          </button>
        )}
      </div>
    </div>
  );

  const columna = (titulo, lista) => (
    <>
      <h2 className="section-title">{titulo} ({lista.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {lista.map(tarjeta)}
      </div>
    </>
  );

  return (
    <div>
      <div className="admin-topbar">
        <div><h1>Cocina</h1><Link className="muted kitchen-home-link" to="/">← Volver al inicio</Link></div>
        <span className="spacer" />
        <span className="muted">{user?.nombre || 'Usuario'}</span>
        <button className="btn small ghost" onClick={load}>Actualizar</button>
        {user?.rol === 'admin' && (
          <button className="btn small ghost" onClick={() => navigate('/admin')}>Panel</button>
        )}
        <button className="btn small ghost" onClick={salir}>Salir</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <div className="empty">Cargando pedidos…</div>}
      {!loading && (
        <>
          {columna('Pendientes', pendientes)}
          <div style={{ marginTop: 24 }}>{columna('En preparación', enPreparacion)}</div>
          <div style={{ marginTop: 24 }}>{columna('Listos para entregar', listos)}</div>
        </>
      )}
    </div>
  );
}
