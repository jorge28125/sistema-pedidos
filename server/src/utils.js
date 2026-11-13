import crypto from 'node:crypto';
import { get } from './db.js';

const TOKEN_TTL = 1000 * 60 * 60 * 8; // 8 horas
const tokens = new Map();

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(test, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  tokens.set(token, { userId, exp: Date.now() + TOKEN_TTL });
  return token;
}

export function authUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const data = tokens.get(token);
  if (!data || data.exp < Date.now()) {
    tokens.delete(token);
    return null;
  }
  const user = get(
    'SELECT id, nombre, email, rol FROM users WHERE id = ? AND activo = 1',
    [data.userId]
  );
  return user || null;
}

export function requireAuth(roles) {
  return (req, res, next) => {
    const user = authUser(req);
    if (!user) return res.status(401).json({ error: 'No autenticado' });
    if (roles && !roles.includes(user.rol)) {
      return res.status(403).json({ error: 'Sin permisos para esta acción' });
    }
    req.user = user;
    next();
  };
}

export const requireAdmin = () => requireAuth(['admin']);
export const requireAdminOrCocina = () => requireAuth(['admin', 'cocina']);

export function generateOrderCode() {
  // Código numérico de pedido
  return String(crypto.randomInt(100000000000, 900000000000));
}
