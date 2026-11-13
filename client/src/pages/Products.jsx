import { useEffect, useState } from 'react';
import { api, fmt } from '../api';

export default function Products() {
  const [productos, setProductos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('Platos');

  const load = () => {
    api.get('/api/productos')
      .then((res) => {
        setProductos(res.productos || []);
        setInventario(res.inventario || []);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const crear = async (e) => {
    e.preventDefault();
    await api.post('/api/productos', {
      nombre,
      descripcion: '',
      precio: Number(precio),
      categoria,
      disponible: true,
      stock: 10,
      unidad: 'unidad',
    });
    setNombre('');
    setPrecio('');
    load();
  };

  const toggle = async (id, disponible) => {
    await api.patch(`/api/productos/${id}`, { disponible });
    load();
  };

  const editarPrecio = async (id, precio) => {
    await api.patch(`/api/productos/${id}`, { precio: Number(precio) });
    load();
  };

  return (
    <div>
      <div className="admin-topbar"><h1>Productos</h1></div>
      <div className="card">
        <h2 className="section-title">Catálogo</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <table>
          <thead>
            <tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Disponible</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.categoria}</td>
                <td>
                  <input
                    type="number" step="0.1" defaultValue={p.precio}
                    style={{ width: 90, padding: 4 }}
                    key={p.id + p.precio}
                    onBlur={(e) => editarPrecio(p.id, e.target.value)}
                  />
                </td>
                <td>{inventario.find((i) => i.producto_id === p.id)?.stock ?? '-'}</td>
                <td>
                  <button className="btn small" onClick={() => toggle(p.id, !p.disponible)}>
                    {p.disponible ? 'Sí' : 'No'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2 className="section-title">Nuevo producto</h2>
        <form className="form-row" onSubmit={crear}>
          <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <input placeholder="Precio" type="number" step="0.1" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
          <input placeholder="Categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
          <button className="btn" type="submit">Crear</button>
        </form>
      </div>
    </div>
  );
}
