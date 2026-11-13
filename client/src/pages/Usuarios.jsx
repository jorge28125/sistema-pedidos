import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('cocina');

  const load = () => {
    api.get('/api/usuarios')
      .then((res) => setUsuarios(res.usuarios || []))
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const crear = async (e) => {
    e.preventDefault();
    await api.post('/api/usuarios', { nombre, email, password, rol });
    setNombre(''); setEmail(''); setPassword(''); setRol('cocina');
    load();
  };

  const toggleActivo = async (id, activo) => {
    await api.patch(`/api/usuarios/${id}`, { activo });
    load();
  };

  const cambiarRol = async (id, r) => {
    await api.patch(`/api/usuarios/${id}`, { rol: r });
    load();
  };

  return (
    <div>
      <div className="admin-topbar"><h1>Usuarios</h1></div>
      <div className="card">
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <table>
          <thead>
            <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Activo</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>
                  <select defaultValue={u.rol} key={u.id + u.rol} onChange={(e) => cambiarRol(u.id, e.target.value)}>
                    <option value="cocina">Cocina</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
                <td>
                  <button className="btn small" onClick={() => toggleActivo(u.id, !u.activo)}>
                    {u.activo ? 'Sí' : 'No'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2 className="section-title">Nuevo usuario</h2>
        <form className="form-row" onSubmit={crear}>
          <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <select value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="cocina">Cocina</option>
            <option value="admin">Administrador</option>
          </select>
          <button className="btn" type="submit">Crear</button>
        </form>
      </div>
    </div>
  );
}
