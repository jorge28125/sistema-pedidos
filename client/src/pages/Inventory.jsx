import { useEffect, useState } from 'react';
import { api } from '../api';
import { SkeletonRows, useToast } from '../components/ui';

export default function Inventory() {
  const toast = useToast();
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soloBajos, setSoloBajos] = useState(false);

  const load = () =>
    api.get('/api/inventario')
      .then((res) => setInventario(res.inventario || []))
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const enviar = async (nombre, body) => {
    try { await api.patch(`/api/inventario/${body.id}`, body.data); toast(`Inventario de ${nombre} actualizado`); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const bajoStock = (i) => i.stock <= (i.minimo_stock || 5);
  const bajos = inventario.filter(bajoStock).length;
  const tope = Math.max(1, ...inventario.map((i) => i.stock));
  const lista = soloBajos ? inventario.filter(bajoStock) : inventario;

  return (
    <div>
      <div className="admin-topbar">
        <div><h1>Inventario</h1><p className="muted">{bajos ? `${bajos} producto${bajos > 1 ? 's' : ''} con poco stock.` : 'Todo el stock está en buen nivel.'}</p></div>
        <div className="tabs" role="tablist" aria-label="Filtro de stock">
          <button role="tab" aria-selected={!soloBajos} className="tab" onClick={() => setSoloBajos(false)}>Todos</button>
          <button role="tab" aria-selected={soloBajos} className="tab" onClick={() => setSoloBajos(true)}>Poco stock <span className="count">{bajos}</span></button>
        </div>
      </div>
      <div className="card">
        {loading ? <SkeletonRows n={5} /> : lista.length === 0 ? (
          <div className="empty"><strong>Nada con poco stock</strong>Vuelve a “Todos” para ver el inventario completo.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Producto</th><th>Stock</th><th>Mínimo</th><th>Unidad</th><th>Ajuste rápido</th></tr></thead>
              <tbody>
                {lista.map((i) => (
                  <tr key={i.producto_id}>
                    <td><strong>{i.nombre}</strong></td>
                    <td className="stock-cell">
                      <input className="cell-input" type="number" min="0" defaultValue={i.stock} key={`${i.producto_id}-${i.stock}`} aria-label={`Stock de ${i.nombre}`}
                        onBlur={(e) => Number(e.target.value) !== i.stock && enviar(i.nombre, { id: i.producto_id, data: { stock: Number(e.target.value) } })} />
                      <div className="stock-meter"><i className={bajoStock(i) ? 'low' : ''} style={{ width: `${Math.min(100, (i.stock / tope) * 100)}%` }} /></div>
                    </td>
                    <td>{i.minimo_stock}</td>
                    <td>{i.unidad}</td>
                    <td>
                      <div className="stepper">
                        <button className="btn small secondary" onClick={() => enviar(i.nombre, { id: i.producto_id, data: { ajuste: -5 } })}>−5</button>
                        <button className="btn small" onClick={() => enviar(i.nombre, { id: i.producto_id, data: { ajuste: 5 } })}>+5</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
