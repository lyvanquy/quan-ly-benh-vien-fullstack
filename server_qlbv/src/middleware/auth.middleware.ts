import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { unauthorized } from '../utils/response';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return unauthorized(res);

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token) as { id: string; role: string; email: string };
    req.user = decoded;
    next();
  } catch {
    return unauthorized(res, 'Token invalid or expired');
  }
};
