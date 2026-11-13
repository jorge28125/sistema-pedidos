import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark, Icon, ESTADO_TXT } from '../components/ui';

const OPCIONES = [
  { to: '/pedido?mesa=1', icon: 'phone', title: 'Menú de clientes', text: 'Ver el menú y enviar un pedido desde la mesa.' },
  { to: '/cocina', icon: 'chef', title: 'Cocina', text: 'Ver los pedidos que llegan y marcarlos listos.' },
  { to: '/admin/login', icon: 'chart', title: 'Administración', text: 'Pedidos, productos, inventario, ventas y reportes.' },
];

const FLUJO = ['PENDIENTE', 'EN_PREPARACION', 'LISTO'];
const LINEAS = [
  ['1 × Hamburguesa Clásica', '$ 12.500'],
  ['2 × Jugo Natural', '$ 8.000'],
  ['1 × Arepa de Queso', '$ 6.500'],
];

export default function Home() {
  const [paso, setPaso] = useState(0);
  const estado = FLUJO[paso];

  return (
    <main className="home-page">
      <div className="home-inner">
        <header className="home-header">
          <div className="home-brand"><BrandMark /> CAFETERIA UCC</div>
          <span className="home-version">Cafetería UCC</span>
        </header>

        <section className="home-hero">
          <div>
            <h1>Del QR de la mesa a la cocina, sin filas.</h1>
            <p className="home-subtitle">
              El cliente escanea, elige y envía. La cocina ve el pedido al instante y el administrador lleva ventas e inventario en un solo lugar.
            </p>
            <nav className="home-options" aria-label="Módulos">
              {OPCIONES.map((o) => (
                <Link key={o.to} className="home-option" to={o.to}>
                  <span className="home-option-icon"><Icon name={o.icon} size={24} /></span>
                  <span>
                    <span className="home-option-title">{o.title}</span>
                    <span className="home-option-description">{o.text}</span>
                  </span>
                  <span className="home-option-go"><Icon name="arrow" /></span>
                </Link>
              ))}
            </nav>
            <p className="home-note">Los clientes entran escaneando el QR de su mesa y no necesitan cuenta.</p>
          </div>

          <div className="demo-stage">
            <div className="ticket printing" aria-label="Ejemplo de comanda">
              <div className="print-in">
                <div className="ticket-head" style={{ '--i': 0 }}>
                  <strong>Mesa 4</strong>
                  <span>Pedido de ejemplo</span>
                </div>
                <hr className="ticket-rule" style={{ '--i': 1 }} />
                {LINEAS.map(([n, p], i) => (
                  <div className="ticket-line" key={n} style={{ '--i': i + 2 }}>
                    <span>{n}</span><span>{p}</span>
                  </div>
                ))}
                <hr className="ticket-rule" style={{ '--i': 5 }} />
                <div className="ticket-line total" style={{ '--i': 6 }}>
                  <span>Total</span><span>$ 27.000</span>
                </div>
              </div>
              <span key={estado} className={`ticket-stamp ${estado}`}>{ESTADO_TXT[estado]}</span>
            </div>
            <button className="btn sun" onClick={() => setPaso((p) => (p + 1) % FLUJO.length)}>
              <Icon name="refresh" size={16} /> Probar el avance del pedido
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
