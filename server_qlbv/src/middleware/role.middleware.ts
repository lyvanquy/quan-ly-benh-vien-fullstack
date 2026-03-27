import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { forbidden } from '../utils/response';

export const authorize = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return forbidden(res);
    next();
  };
