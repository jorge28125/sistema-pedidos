import { authUser } from '../utils.js';

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
