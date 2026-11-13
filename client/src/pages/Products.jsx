import { useEffect, useState } from 'react';
import { api, fmt } from '../api';
import { Icon, SkeletonRows, Switch, useToast } from '../components/ui';

export default function Products() {
  const toast = useToast();
  const [productos, setProductos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('Platos');

  const load = () =>
    api.get('/api/productos')
      .then((res) => { setProductos(res.productos || []); setInventario(res.inventario || []); })
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const guardar = async (fn, ok) => {
    try { await fn(); toast(ok); load(); } catch (e) { toast(e.message, 'error'); }
  };

  const crear = (e) => {
    e.preventDefault();
    guardar(async () => {
      await api.post('/api/productos', { nombre, descripcion: '', precio: Number(precio), categoria, disponible: true, stock: 10, unidad: 'unidad' });
      setNombre(''); setPrecio('');
    }, `Producto "${nombre}" creado`);
  };

  const lista = productos.filter((p) => `${p.nombre} ${p.categoria}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div>
      <div className="admin-topbar"><div><h1>Productos</h1><p className="muted">Cambia un precio escribiendo y saliendo de la casilla. Apaga un producto para ocultarlo del menú.</p></div></div>

      <div className="card">
        <div className="toolbar">
          <h2 className="section-title" style={{ margin: 0 }}>Catálogo</h2>
          <span className="spacer" />
          <div className="search" style={{ maxWidth: 280 }}>
            <Icon name="search" size={18} />
            <input className="field" type="search" placeholder="Buscar producto" aria-label="Buscar producto" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {loading ? <SkeletonRows n={5} /> : lista.length === 0 ? (
          <div className="empty"><strong>No hay productos</strong>Crea el primero con el formulario de abajo.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th className="num">Stock</th><th>En el menú</th></tr></thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.nombre}</strong></td>
                    <td>{p.categoria}</td>
                    <td>
                      <input className="cell-input" type="number" step="0.1" min="0" defaultValue={p.precio} key={`${p.id}-${p.precio}`} aria-label={`Precio de ${p.nombre}`}
                        onBlur={(e) => Number(e.target.value) !== Number(p.precio) && guardar(() => api.patch(`/api/productos/${p.id}`, { precio: Number(e.target.value) }), `Precio de ${p.nombre}: ${fmt(e.target.value)}`)} />
                    </td>
                    <td className="num">{inventario.find((i) => i.producto_id === p.id)?.stock ?? '-'}</td>
                    <td><Switch checked={!!p.disponible} label={`${p.nombre} en el menú`} onChange={(v) => guardar(() => api.patch(`/api/productos/${p.id}`, { disponible: v }), `${p.nombre} ${v ? 'visible' : 'oculto'} en el menú`)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Nuevo producto</h2>
        <form className="form-row" onSubmit={crear}>
          <input placeholder="Nombre" aria-label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <input placeholder="Precio" aria-label="Precio" type="number" step="0.1" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
          <input placeholder="Categoría" aria-label="Categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
          <button className="btn" type="submit">Crear producto</button>
        </form>
      </div>
    </div>
  );
}
