import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);

db.exec(`
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'cocina',
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  precio REAL NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'General',
  disponible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL UNIQUE,
  stock INTEGER NOT NULL DEFAULT 0,
  unidad TEXT NOT NULL DEFAULT 'unidad',
  minimo_stock INTEGER NOT NULL DEFAULT 5
);

CREATE TABLE IF NOT EXISTS mesas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero INTEGER NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  mesa_id INTEGER NOT NULL,
  usuario_id INTEGER,
  items TEXT NOT NULL,
  subtotal REAL NOT NULL,
  iva REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',
  observaciones TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL UNIQUE,
  total REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS facturas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL UNIQUE,
  numero_factura TEXT,
  estado TEXT NOT NULL DEFAULT 'BORRADOR',
  cufe TEXT,
  cufi TEXT,
  respuesta TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(created_at);
`);

export function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}
export function get(sql, params = []) {
  return db.prepare(sql).get(...params);
}
export function run(sql, params = []) {
  return db.prepare(sql).run(...params);
}

function hashSeedPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function seedIfNeeded() {
  if (Number(get('SELECT COUNT(*) AS c FROM users', []).c) > 0) return;

  const isProduction = process.env.NODE_ENV === 'production';
  const adminEmail = process.env.ADMIN_EMAIL || (isProduction ? '' : 'admin@pedidos.com');
  const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? '' : 'admin123');
  const kitchenEmail = process.env.KITCHEN_EMAIL || (isProduction ? '' : 'cocina@pedidos.com');
  const kitchenPassword = process.env.KITCHEN_PASSWORD || (isProduction ? '' : 'cocina123');

  if (!adminEmail || !adminPassword || !kitchenEmail || !kitchenPassword) {
    throw new Error('Configura ADMIN_EMAIL, ADMIN_PASSWORD, KITCHEN_EMAIL y KITCHEN_PASSWORD antes de iniciar en producción.');
  }

  run(
    'INSERT INTO users (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
    ['Administrador', adminEmail, hashSeedPassword(adminPassword), 'admin']
  );
  run(
    'INSERT INTO users (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
    ['Cocina', kitchenEmail, hashSeedPassword(kitchenPassword), 'cocina']
  );
  const productos = [
    ['Hamburguesa Clásica', 'Pan brioche, carne, queso, lechuga, tomate, salsa', 12.5, 'Platos', 20],
    ['Hamburguesa Doble', 'Doble carne, queso, bacon, salsa especial', 16.9, 'Platos', 15],
    ['Pizza Pepperoni', 'Masa fina, salsa de tomate, pepperoni, mozzarella', 14.9, 'Platos', 12],
    ['Arepa de Queso', 'Arepa pelada de queso blanco', 6.5, 'Platos', 25],
    ['Bowl Saludable', 'Arroz integral, pollo, vegetales, aderezo', 11.9, 'Platos', 10],
    ['Leche', 'Leche entera fresca', 2.5, 'Bebidas', 60],
    ['Jugo Natural', 'Jugo natural sin azúcar', 4.0, 'Bebidas', 40],
  ];
  const insertProducto = db.prepare('INSERT INTO productos (nombre, descripcion, precio, categoria, disponible) VALUES (?, ?, ?, ?, 1)');
  for (const [nombre, descripcion, precio, categoria, stock] of productos) {
    const info = insertProducto.run(nombre, descripcion, precio, categoria);
    db.prepare('INSERT INTO inventario (producto_id, stock, unidad, minimo_stock) VALUES (?, ?, ?, ?)')
      .run(Number(info.lastInsertRowid), stock, categoria === 'Bebidas' ? 'ml' : 'unidad', 5);
  }
  for (let i = 1; i <= 10; i++) {
    db.prepare('INSERT OR IGNORE INTO mesas (numero) VALUES (?)').run(i);
  }
}

seedIfNeeded();

export default db;
