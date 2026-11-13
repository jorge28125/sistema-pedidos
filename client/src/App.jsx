import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import PublicMenu from './pages/PublicMenu';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Usuarios from './pages/Usuarios';
import Ventas from './pages/Ventas';
import Facturacion from './pages/Facturacion';
import Reportes from './pages/Reportes';
import Kitchen from './pages/Kitchen';
import QRCodes from './pages/QRCodes';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pedido" element={<PublicMenu />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="pedidos" element={<Orders />} />
        <Route path="productos" element={<Products />} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="facturacion" element={<Facturacion />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="qr" element={<QRCodes />} />
      </Route>
      <Route path="/cocina" element={<Kitchen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
