import { Outlet, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { getToken, getUser, logout } from '../api';

const items = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/qr', label: 'QR de mesas' },
  { to: '/cocina', label: 'Cocina' },
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/inventario', label: 'Inventario' },
  { to: '/admin/usuarios', label: 'Usuarios' },
  { to: '/admin/ventas', label: 'Ventas' },
  { to: '/admin/facturacion', label: 'Facturación' },
  { to: '/admin/reportes', label: 'Reportes' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = getToken();
  const user = getUser();
  if (!token) return <Navigate to="/admin/login" replace state={{ from: location }} />;
  if (user?.rol === 'cocina') return <Navigate to="/cocina" replace />;

  const salir = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="brand">🍽️ Pedidos U</div>
        <NavLink to="/" className="home-sidebar-link">← Inicio</NavLink>
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            {it.label}
          </NavLink>
        ))}
        <div className="sidebar-footer">
          <span className="muted">{user?.nombre || 'Usuario'}</span>
          <button className="btn small ghost" onClick={salir}>Salir</button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
