import './env.js';
import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import authRoutes from './routes/auth.js';
import productosRoutes from './routes/productos.js';
import inventarioRoutes from './routes/inventario.js';
import mesasRoutes from './routes/mesas.js';
import pedidosRoutes from './routes/pedidos.js';
import ventasRoutes from './routes/ventas.js';
import dashboardRoutes from './routes/dashboard.js';
import reportesRoutes from './routes/reportes.js';
import facturasRoutes from './routes/facturas.js';
import usuariosRoutes from './routes/usuarios.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Sirve el frontend compilado (client/dist) si existe, para correr todo con un solo servidor.
const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDist = join(__dirname, '../../client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(join(clientDist, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno', detalle: err.message });
});

app.listen(PORT, () => {
  console.log(`API de pedidos corriendo en http://localhost:${PORT}`);
});
