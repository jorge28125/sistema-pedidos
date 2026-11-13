import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { getToken, getUser, logout } from '../api';
import { BrandMark, Icon } from './ui';

const items = [
  { to: '/admin', label: 'Resumen', icon: 'chart', end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: 'receipt' },
  { to: '/cocina', label: 'Cocina', icon: 'flame' },
  { to: '/admin/qr', label: 'QR de mesas', icon: 'qr' },
  { to: '/admin/productos', label: 'Productos', icon: 'box' },
  { to: '/admin/inventario', label: 'Inventario', icon: 'layers' },
  { to: '/admin/ventas', label: 'Ventas', icon: 'coin' },
  { to: '/admin/facturacion', label: 'Facturación', icon: 'file' },
  { to: '/admin/reportes', label: 'Reportes', icon: 'graph' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
];

/* Ctrl+K: salta a cualquier sección escribiendo unas letras */
function Palette({ onClose, onGo }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const list = useMemo(
    () => items.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase())),
    [q]
  );
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);

  const onKey = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, list.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter' && list[sel]) onGo(list[sel].to);
  };

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-label="Ir a una sección" onMouseDown={(e) => e.stopPropagation()}>
        <input ref={ref} value={q} placeholder="¿A dónde quieres ir?" aria-label="Buscar sección"
          onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey} />
        {list.length === 0 ? (
          <div className="none">No hay secciones con ese nombre.</div>
        ) : (
          <ul role="listbox">
            {list.map((it, i) => (
              <li key={it.to}>
                <button role="option" aria-selected={i === sel} onMouseEnter={() => setSel(i)} onClick={() => onGo(it.to)}>
                  <Icon name={it.icon} /> {it.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const token = getToken();
  const user = getUser();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!token) return <Navigate to="/admin/login" replace state={{ from: location }} />;
  if (user?.rol === 'cocina') return <Navigate to="/cocina" replace />;

  const salir = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-layout">
      <div className="mobile-bar">
        <button onClick={() => setOpen(true)} aria-label="Abrir menú"><Icon name="menu" /></button>
        Pedidos U
      </div>
      <div className={`scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="brand"><BrandMark /> Pedidos U</div>
        <nav className="nav-group" aria-label="Secciones">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end}>
              <Icon name={it.icon} /> {it.label}
            </NavLink>
          ))}
          <NavLink to="/"><Icon name="home" /> Portada</NavLink>
        </nav>
        <div className="sidebar-footer">
          <button className="btn small ghost" onClick={() => setPalette(true)}>
            <Icon name="search" size={16} /> Ir a… <span className="kbd">Ctrl K</span>
          </button>
          <div className="sidebar-user">
            <span className="avatar">{(user?.nombre || 'U')[0].toUpperCase()}</span>
            {user?.nombre || 'Usuario'}
          </div>
          <button className="btn small ghost" onClick={salir}><Icon name="out" size={16} /> Salir</button>
        </div>
      </aside>
      <main className="admin-main">
        <div className="page-enter" key={location.pathname}>
          <Outlet />
        </div>
      </main>
      {palette && <Palette onClose={() => setPalette(false)} onGo={(to) => { setPalette(false); navigate(to); }} />}
    </div>
  );
}
