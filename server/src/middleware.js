import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jinshouzhi-dev-secret-change-in-production';

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
}

export function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ code: 'UNAUTHORIZED' });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.userId = payload.id;
      req.userRole = payload.role;
      if (requiredRole && payload.role !== requiredRole && payload.role !== 'admin') {
        return res.status(403).json({ code: 'FORBIDDEN' });
      }
      next();
    } catch {
      return res.status(401).json({ code: 'UNAUTHORIZED' });
    }
  };
}

export { JWT_SECRET };
