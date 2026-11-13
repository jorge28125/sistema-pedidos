import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="home-page">
      <header className="home-header">
        <div className="home-brand">🍽️ Sistema de Pedidos</div>
        <span className="home-version">Plataforma de pedidos y gestión</span>
      </header>

      <section className="home-content">
        <p className="home-eyebrow">BIENVENIDO</p>
        <h1>¿A qué módulo deseas ingresar?</h1>
        <p className="home-subtitle">
          Elige el espacio que necesitas. Los módulos de trabajo están protegidos por inicio de sesión.
        </p>

        <div className="home-options">
          <Link className="home-option admin-option" to="/admin/login">
            <span className="home-option-icon">📊</span>
            <span className="home-option-title">Administración</span>
            <span className="home-option-description">
              Dashboard, pedidos, productos, inventario, usuarios, ventas, facturación y reportes.
            </span>
            <span className="home-option-link">Entrar al panel →</span>
          </Link>

          <Link className="home-option kitchen-option" to="/cocina">
            <span className="home-option-icon">👨‍🍳</span>
            <span className="home-option-title">Cocina</span>
            <span className="home-option-description">
              Consultar pedidos pendientes, preparar órdenes y marcar los pedidos listos.
            </span>
            <span className="home-option-link">Abrir cocina →</span>
          </Link>

          <Link className="home-option customer-option" to="/pedido?mesa=1">
            <span className="home-option-icon">📱</span>
            <span className="home-option-title">Menú de clientes</span>
            <span className="home-option-description">
              Ver el menú, agregar productos al carrito y enviar un pedido desde una mesa.
            </span>
            <span className="home-option-link">Ver menú →</span>
          </Link>
        </div>

        <p className="home-note">
          Los clientes pueden entrar directamente escaneando el QR de su mesa. No necesitan crear una cuenta.
        </p>
      </section>
    </main>
  );
}
