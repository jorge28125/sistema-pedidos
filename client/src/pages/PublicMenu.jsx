import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, fmt } from '../api';
import { Icon, Skeleton } from '../components/ui';

const EMOJI = [
  [/hamburguesa|burger/i, '🍔'], [/pizza/i, '🍕'], [/arepa/i, '🫓'], [/bowl|ensalada/i, '🥗'],
  [/leche/i, '🥛'], [/jugo/i, '🧃'], [/caf[eé]|tinto/i, '☕'], [/perro|hot ?dog/i, '🌭'],
  [/sandwich|s[aá]ndwich/i, '🥪'], [/papas|fritas/i, '🍟'], [/torta|pastel|postre/i, '🍰'],
  [/agua|gaseosa|soda/i, '🥤'], [/helado/i, '🍨'], [/pollo/i, '🍗'],
];
const emojiDe = (p) => EMOJI.find(([re]) => re.test(p.nombre))?.[1] || (p.categoria === 'Bebidas' ? '🥤' : '🍽️');

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
  const [cat, setCat] = useState('Todo');
  const [q, setQ] = useState('');
  const [obs, setObs] = useState('');
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    api
      .get(`/api/mesas/${mesa}/menu`)
      .then((res) => setProductos(res.productos || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mesa]);

  const categorias = useMemo(() => ['Todo', ...new Set(productos.map((p) => p.categoria))], [productos]);
  const tonoDe = (c) => `tone-${Math.max(0, categorias.indexOf(c) - 1) % 4}`;
  const visibles = productos.filter(
    (p) => (cat === 'Todo' || p.categoria === cat) && `${p.nombre} ${p.descripcion}`.toLowerCase().includes(q.trim().toLowerCase())
  );

  const qtyDe = (id) => cart.find((i) => i.productoId === id)?.cantidad || 0;
  const add = (p) => {
    setCart((c) => {
      const ex = c.find((i) => i.productoId === p.id);
      if (ex) return c.map((i) => (i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      return [...c, { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 }];
    });
  };
  const dec = (id) => {
    setCart((c) => c.map((i) => (i.productoId === id ? { ...i, cantidad: i.cantidad - 1 } : i)).filter((i) => i.cantidad > 0));
  };

  const total = cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const unidades = cart.reduce((acc, i) => acc + i.cantidad, 0);

  /* Hoja arrastrable: sigue al dedo 1:1, y al soltar decide con la velocidad proyectada */
  const cartRef = useRef(null);
  const drag = useRef(null);
  const onGripDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const el = cartRef.current;
    el.style.transition = 'none';
    drag.current = { y0: e.clientY, h: el.offsetHeight, pts: [[performance.now(), e.clientY]], dy: 0 };
  };
  const onGripMove = (e) => {
    const d = drag.current;
    if (!d) return;
    d.pts = [...d.pts.slice(-4), [performance.now(), e.clientY]];
    const raw = e.clientY - d.y0;
    // hacia arriba (más allá del tope) resiste progresivamente
    d.dy = raw >= 0 ? raw : (raw * 0.55 * d.h) / (d.h + 0.55 * Math.abs(raw));
    cartRef.current.style.transform = `translateY(${d.dy}px)`;
  };
  const onGripUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const el = cartRef.current;
    const [t0, y0] = d.pts[0];
    const [t1, y1] = d.pts[d.pts.length - 1];
    const v = t1 > t0 ? ((y1 - y0) / (t1 - t0)) * 1000 : 0; // px/s
    const proyectado = d.dy + (v / 1000) * 0.998 / (1 - 0.998);
    const cerrar = proyectado > d.h * 0.4 || v > 700;
    const destino = cerrar ? d.h : 0;
    const anim = el.animate(
      [{ transform: `translateY(${d.dy}px)` }, { transform: `translateY(${destino}px)` }],
      { duration: 380, easing: 'cubic-bezier(.32,.72,0,1)' }
    );
    setSheet(!cerrar);
    const limpiar = () => { el.style.transform = ''; el.style.transition = ''; };
    anim.onfinish = limpiar;
    anim.oncancel = limpiar;
  };

  const placeOrder = async () => {
    setErrorPedido('');
    setEnviando(true);
    try {
      const items = cart.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }));
      const res = await api.post('/api/pedidos', { mesa, items, observaciones: obs.trim() || undefined });
      setCodigo(res.pedido?.codigo);
      setSheet(false);
    } catch (e) {
      setErrorPedido(e.message);
    } finally {
      setEnviando(false);
    }
  };

  if (codigo) {
    return (
      <div className="success-wrap">
        <div>
          <h2>¡Pedido enviado!</h2>
          <p>Muestra este código al personal de la cafetería.</p>
          <div className="success-ticket-slot">
            <div className="ticket printing">
              <div className="print-in">
                <div className="ticket-head" style={{ '--i': 0 }}><strong>Mesa {mesa}</strong><span>Tu pedido</span></div>
                <hr className="ticket-rule" style={{ '--i': 1 }} />
                {cart.map((i, n) => (
                  <div className="ticket-line" key={i.productoId} style={{ '--i': n + 2 }}>
                    <span>{i.cantidad} × {i.nombre}</span><span>{fmt(i.precio * i.cantidad)}</span>
                  </div>
                ))}
                <hr className="ticket-rule" style={{ '--i': cart.length + 2 }} />
                <div className="ticket-code" style={{ '--i': cart.length + 3 }}>{codigo}</div>
              </div>
            </div>
          </div>
          <button className="btn sun" onClick={() => { setCodigo(null); setCart([]); setObs(''); }}>
            Hacer otro pedido
          </button>
        </div>
      </div>
    );
  }

  const carrito = (
    <div className={`cart ${sheet ? 'open' : ''}`} id="carrito" ref={cartRef}>
      <div className="sheet-grip" onPointerDown={onGripDown} onPointerMove={onGripMove} onPointerUp={onGripUp} onPointerCancel={onGripUp} aria-hidden="true"><i /></div>
      <div className="ticket-wrap">
        <div className="ticket">
          <div className="ticket-head"><h2>Tu pedido</h2><span>Mesa {mesa}</span></div>
          <hr className="ticket-rule" />
          {cart.length === 0 && (
            <div className="cart-empty"><span className="big">🛎️</span>Toca el + de un producto para empezar.</div>
          )}
          {cart.map((i) => (
            <div className="cart-item enter" key={i.productoId}>
              <span className="name">{i.nombre}<small>{fmt(i.precio)} c/u</small></span>
              <span className="mini-step">
                <button onClick={() => dec(i.productoId)} aria-label={`Quitar uno de ${i.nombre}`}>−</button>
                <span>{i.cantidad}</span>
                <button onClick={() => add({ id: i.productoId, ...i })} aria-label={`Agregar uno de ${i.nombre}`}>+</button>
              </span>
              <strong>{fmt(i.precio * i.cantidad)}</strong>
            </div>
          ))}
          {cart.length > 0 && (
            <>
              <hr className="ticket-rule" />
              <input className="field" style={{ width: '100%', marginBottom: 12 }} placeholder="Nota para cocina (opcional)" maxLength={120} value={obs} onChange={(e) => setObs(e.target.value)} />
            </>
          )}
          <div className="cart-total"><span>Total</span><span>{fmt(total)}</span></div>
          {errorPedido && <p className="form-error" role="alert" style={{ marginTop: 10 }}>{errorPedido}</p>}
          <button className="btn sun" disabled={cart.length === 0 || enviando} onClick={placeOrder}>
            {enviando ? 'Enviando…' : 'Enviar pedido'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="menu-page">
      <header className="menu-header">
        <div className="menu-header-inner">
          <div className="flex">
            <span className="mesa-pill">Mesa {mesa}</span>
            <Link to="/" style={{ color: '#a7c2b7', fontSize: 14, textDecoration: 'none' }}>Portada</Link>
          </div>
          <h1>¿Qué se te antoja hoy?</h1>
          <p>Elige tus productos y la cocina recibe el pedido al instante.</p>
        </div>
      </header>

      <div className="menu-body">
        <div className="menu-layout">
          <div>
            <div className="menu-controls">
              <div className="search">
                <Icon name="search" size={18} />
                <input className="field" type="search" placeholder="Buscar en el menú" aria-label="Buscar en el menú" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="tabs" role="tablist" aria-label="Categorías">
                {categorias.map((c) => (
                  <button key={c} role="tab" aria-selected={cat === c} className="tab" onClick={() => setCat(c)}>{c}</button>
                ))}
              </div>
            </div>

            <div className="menu-grid">
              {loading && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={230} />)}
              {error && <div className="empty"><strong>No pudimos cargar el menú</strong>{error}. Intenta de nuevo en un momento.</div>}
              {!loading && !error && visibles.length === 0 && (
                <div className="empty"><strong>Sin resultados</strong>Prueba con otra palabra o elige otra categoría.</div>
              )}
              {visibles.map((p) => {
                const n = qtyDe(p.id);
                return (
                  <article className={`menu-card ${n ? 'in-cart' : ''}`} key={p.id}>
                    <div className={`menu-tile ${tonoDe(p.categoria)}`}>
                      <span aria-hidden="true">{emojiDe(p)}</span>
                      {n > 0 && <b className="menu-qty-badge" key={n}>{n}</b>}
                    </div>
                    <div className="menu-card-body">
                      <h3>{p.nombre}</h3>
                      <p className="desc">{p.descripcion}</p>
                      <div className="row">
                        <span className="precio">{fmt(p.precio)}</span>
                        {n > 0 ? (
                          <span className="qty-control">
                            <button className="minus" onClick={() => dec(p.id)} aria-label={`Quitar uno de ${p.nombre}`}>−</button>
                            <output>{n}</output>
                            <button onClick={() => add(p)} aria-label={`Agregar uno de ${p.nombre}`}>+</button>
                          </span>
                        ) : (
                          <button className="add-btn" onClick={() => add(p)} aria-label={`Agregar ${p.nombre}`}>+</button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          {carrito}
        </div>
      </div>

      <div className={`sheet-backdrop ${sheet ? 'open' : ''}`} onClick={() => setSheet(false)} />
      <button className={`cart-bar ${cart.length && !sheet ? 'show' : ''}`} onClick={() => setSheet(true)} aria-controls="carrito">
        <span className="count">{unidades}</span>
        <span className="view">Ver pedido</span>
        <span className="total">{fmt(total)}</span>
      </button>
    </div>
  );
}
