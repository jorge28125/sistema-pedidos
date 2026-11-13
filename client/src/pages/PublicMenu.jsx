import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, fmt } from '../api';

export default function PublicMenu() {
  const [params] = useSearchParams();
  const mesa = Number(params.get('mesa') || 1);

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);
  const [codigo, setCodigo] = useState(null);
  const [errorPedido, setErrorPedido] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api
      .get(`/api/mesas/${mesa}/menu`)
      .then((res) => setProductos(res.productos || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mesa]);

  const add = (p) => {
    setCart((c) => {
      const ex = c.find((i) => i.productoId === p.id);
      if (ex) return c.map((i) => (i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      return [...c, { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 }];
    });
  };

  const dec = (id) => {
    setCart((c) =>
      c
        .map((i) => (i.productoId === id ? { ...i, cantidad: i.cantidad - 1 } : i))
        .filter((i) => i.cantidad > 0)
    );
  };

  const total = cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  const placeOrder = async () => {
    setErrorPedido('');
    setEnviando(true);
    try {
      const items = cart.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }));
      const res = await api.post('/api/pedidos', { mesa, items });
      setCodigo(res.pedido?.codigo);
    } catch (e) {
      setErrorPedido(e.message);
    } finally {
      setEnviando(false);
    }
  };

  if (codigo) {
    return (
      <div className="menu-header">
        <div className="success-box">
          <h2>¡Pedido enviado!</h2>
          <p>
            Muestra este <strong>código numérico</strong> al personal de la cafetería:
          </p>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 2 }}>{codigo}</div>
          <p className="muted">Mesa {mesa}</p>
          <button className="btn" onClick={() => { setCodigo(null); setCart([]); }}>
            Hacer otro pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="menu-header">
        <h1>🍽️ Menú — Mesa {mesa}</h1>
        <p>Selecciona los productos y envía tu pedido desde esta mesa</p>
      </div>
      <div className="menu-layout">
        <div>
          <div className="menu-grid">
            {loading && <div className="empty">Cargando menú...</div>}
            {error && <div className="empty">Error: {error}</div>}
            {!loading && productos.map((p) => (
              <div className="menu-card" key={p.id}>
                <h3>{p.nombre}</h3>
                <p className="desc">{p.descripcion}</p>
                <div className="row">
                  <span className="precio">{fmt(p.precio)}</span>
                  <span className="qty-control">
                    {cart.find((i) => i.productoId === p.id)?.cantidad > 0 && (
                      <>
                        <button onClick={() => dec(p.id)}>−</button>
                        <span>{cart.find((i) => i.productoId === p.id).cantidad}</span>
                      </>
                    )}
                    <button onClick={() => add(p)}>+</button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="cart">
          <h2>Tu pedido</h2>
          {cart.length === 0 && <p className="muted">Agrega productos desde el menú</p>}
          {cart.map((i) => (
            <div className="cart-item" key={i.productoId}>
              <span>{i.nombre} × {i.cantidad}</span>
              <span>{fmt(i.precio * i.cantidad)}</span>
            </div>
          ))}
          <div className="cart-total">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
          {errorPedido && <p className="form-error">{errorPedido}</p>}
          <button className="btn" style={{ width: '100%', marginTop: 10 }} disabled={cart.length === 0 || enviando} onClick={placeOrder}>
            {enviando ? 'Enviando...' : 'Enviar pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}
