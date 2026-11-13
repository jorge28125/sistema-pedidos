import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Inventory() {
  const [inventario, setInventario] = useState([]);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/api/inventario')
      .then((res) => setInventario(res.inventario || []))
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const ajustar = async (productoId, ajuste) => {
    await api.patch(`/api/inventario/${productoId}`, { ajuste });
    load();
  };

  const setStock = async (productoId, stock) => {
    await api.patch(`/api/inventario/${productoId}`, { stock });
    load();
  };

  const bajoStock = (i) => i.stock <= (i.minimo_stock || 5);

  return (
    <div>
      <div className="admin-topbar"><h1>Inventario</h1></div>
      <div className="card">
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <table>
          <thead>
            <tr><th>Producto</th><th>Stock</th><th>Mínimo</th><th>Unidad</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {inventario.map((i) => (
              <tr key={i.producto_id}>
                <td>{i.nombre}</td>
                <td>
                  <input
                    type="number" defaultValue={i.stock} key={i.producto_id + i.stock}
                    style={{ width: 80, padding: 4 }}
                    onBlur={(e) => setStock(i.producto_id, Number(e.target.value))}
                  />
                </td>
                <td>{i.minimo_stock}</td>
                <td>{i.unidad}</td>
                <td>
                  {bajoStock(i) ? <span className="badge CANCELADO">Bajo stock</span> : <span className="badge ENTREGADO">OK</span>}
                </td>
                <td>
                  <button className="btn small" onClick={() => ajustar(i.producto_id, 5)}>+5</button>
                  <button className="btn small secondary" onClick={() => ajustar(i.producto_id, -5)}>-5</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
