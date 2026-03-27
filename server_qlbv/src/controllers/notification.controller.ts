import { Response } from 'express';
import prisma from '../prismaClient';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { notifyUser, broadcast } from '../server';

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const notifications = await prisma.notification.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return successResponse(res, notifications);
  } catch (e) { return errorResponse(res, e); }
};

export const markRead = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    return successResponse(res, { ok: true });
  } catch (e) { return errorResponse(res, e); }
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await prisma.notification.updateMany({
      where: { OR: [{ userId }, { userId: null }], isRead: false },
      data: { isRead: true },
    });
    return successResponse(res, { ok: true });
  } catch (e) { return errorResponse(res, e); }
};

// Internal helper — call from other controllers to push a notification
export async function pushNotification(opts: {
  userId?: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  const n = await prisma.notification.create({
    data: {
      userId: opts.userId,
      title: opts.title,
      message: opts.message,
      type: opts.type || 'INFO',
      link: opts.link,
    },
  });

  const payload = { id: n.id, title: n.title, message: n.message, type: n.type, createdAt: n.createdAt, link: n.link };

  if (opts.userId) {
    notifyUser(opts.userId, 'notification', payload);
  } else {
    broadcast('notification', payload);
  }

  return n;
}
