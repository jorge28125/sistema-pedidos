import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, setToken, setUser } from '../api';
import { BrandMark, Icon } from '../components/ui';

const DEMOS = [
  { rol: 'Administrador', email: 'admin@pedidos.com', password: 'admin123' },
  { rol: 'Cocina', email: 'cocina@pedidos.com', password: 'cocina123' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(import.meta.env.DEV ? 'admin@pedidos.com' : '');
  const [password, setPassword] = useState(import.meta.env.DEV ? 'admin123' : '');
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
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
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <aside className="login-aside">
        <div className="home-brand"><BrandMark /> CAFETERIA UCC</div>
        <div>
          <h2>Todo el servicio en una sola pantalla.</h2>
          <p>Entra para atender pedidos en cocina o revisar ventas e inventario.</p>
        </div>
        <span />
      </aside>
      <div className="login-main">
        <div className="login-card">
          <Link className="login-back" to="/"><Icon name="back" size={16} /> Volver a la portada</Link>
          <h1>Acceso del personal</h1>
          <p className="muted">Usa el correo y la contraseña que te entregó el administrador.</p>
          <form onSubmit={submit} key={shakeKey} className={shakeKey ? 'shake' : ''}>
            <label className="login-label" htmlFor="email">Correo electrónico</label>
            <input id="email" className="field" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label className="login-label" htmlFor="password">Contraseña</label>
            <div className="password-wrap">
              <input id="password" className="field" type={verClave ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="password-toggle" onClick={() => setVerClave((v) => !v)}>
                {verClave ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn sun login-submit" type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
          {import.meta.env.DEV && (
            <div className="login-demo-credentials">
              <strong>Usuarios de prueba (solo en tu computador)</strong>
              {DEMOS.map((d) => (
                <p key={d.email}>
                  <span>{d.rol}: {d.email}</span>
                  <button type="button" onClick={() => { setEmail(d.email); setPassword(d.password); }}>Usar</button>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
