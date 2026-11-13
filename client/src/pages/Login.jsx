import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, setToken, setUser } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(import.meta.env.DEV ? 'admin@pedidos.com' : '');
  const [password, setPassword] = useState(import.meta.env.DEV ? 'admin123' : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      setToken(res.token);
      setUser(res.user);
      const requestedPath = location.state?.from?.pathname;
      const destino = res.user?.rol === 'cocina'
        ? '/cocina'
        : requestedPath === '/cocina'
          ? '/cocina'
          : '/admin';
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <Link className="login-back" to="/">← Volver al inicio</Link>
        <div className="login-symbol">🔐</div>
        <h1>Acceso del personal</h1>
        <p className="muted">Inicia sesión para ingresar al módulo que corresponde a tu usuario.</p>
        <form onSubmit={submit}>
          <div className="form-row">
            <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-row">
            <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn login-submit" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
        {import.meta.env.DEV && (
          <div className="login-demo-credentials">
            <strong>Usuarios de demostración local</strong>
            <p>Admin: admin@pedidos.com / admin123</p>
            <p>Cocina: cocina@pedidos.com / cocina123</p>
          </div>
        )}
      </div>
    </div>
  );
}
