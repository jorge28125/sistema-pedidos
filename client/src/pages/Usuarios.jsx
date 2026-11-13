import { useEffect, useState } from 'react';
import { api } from '../api';
import { SkeletonRows, Switch, useToast } from '../components/ui';

export default function Usuarios() {
  const toast = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('cocina');

  const load = () =>
    api.get('/api/usuarios')
      .then((res) => setUsuarios(res.usuarios || []))
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const guardar = async (fn, ok) => {
    try { await fn(); toast(ok); load(); } catch (e) { toast(e.message, 'error'); }
  };

  const crear = (e) => {
    e.preventDefault();
    guardar(async () => {
      await api.post('/api/usuarios', { nombre, email, password, rol });
      setNombre(''); setEmail(''); setPassword(''); setRol('cocina');
    }, `Usuario ${nombre} creado`);
  };

  return (
    <div>
      <div className="admin-topbar"><div><h1>Usuarios</h1><p className="muted">Quién puede entrar al panel y a la cocina.</p></div></div>
      <div className="card">
        {loading ? <SkeletonRows n={3} /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Puede entrar</th></tr></thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td><div className="flex"><span className="avatar" style={{ background: 'var(--sun-wash)' }}>{u.nombre[0].toUpperCase()}</span><strong>{u.nombre}</strong></div></td>
                    <td>{u.email}</td>
                    <td>
                      <select className="field" defaultValue={u.rol} key={u.id + u.rol} aria-label={`Rol de ${u.nombre}`}
                        onChange={(e) => guardar(() => api.patch(`/api/usuarios/${u.id}`, { rol: e.target.value }), `Rol de ${u.nombre} actualizado`)}>
                        <option value="cocina">Cocina</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td><Switch checked={!!u.activo} label={`${u.nombre} puede entrar`} onChange={(v) => guardar(() => api.patch(`/api/usuarios/${u.id}`, { activo: v }), `${u.nombre} ${v ? 'activado' : 'desactivado'}`)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card">
        <h2 className="section-title">Nuevo usuario</h2>
        <form className="form-row" onSubmit={crear}>
          <input placeholder="Nombre" aria-label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <input placeholder="Correo" aria-label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input placeholder="Contraseña" aria-label="Contraseña" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <select aria-label="Rol" value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="cocina">Cocina</option>
            <option value="admin">Administrador</option>
          </select>
          <button className="btn" type="submit">Crear usuario</button>
        </form>
      </div>
    </div>
  );
}
