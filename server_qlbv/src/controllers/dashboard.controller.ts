import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, serverError } from '../utils/response';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || 'today';
    const now = new Date();
    let start: Date;
    if (range === 'week') {
      start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0);
    } else if (range === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      start = new Date(now); start.setHours(0, 0, 0, 0);
    }
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const p = prisma as never as {
      encounter: { count: (a?: unknown) => Promise<number> };
      bed: { count: (a?: unknown) => Promise<number> };
    };

    const [
      totalPatients,
      todayAppointments,
      todayRevenue,
      activeDoctors,
      pendingAppointments,
      pendingLabOrders,
      lowStockCount,
      activeEncounters,
      occupiedBeds,
      totalBeds,
      todaySurgeries,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count({ where: { appointmentDate: { gte: today, lt: tomorrow } } }),
      prisma.bill.aggregate({
        where: { createdAt: { gte: start, lt: tomorrow }, paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.doctor.count(),
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.labOrder.count({ where: { status: 'PENDING' } }),
      prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) as count FROM "Medicine" WHERE stock <= "minStock"`.then(r => Number(r[0]?.count ?? 0)),
      p.encounter.count({ where: { status: { notIn: ['DISCHARGED', 'CANCELLED', 'TRANSFERRED'] } } } as never),
      p.bed.count({ where: { status: 'OCCUPIED' } } as never),
      p.bed.count(),
      prisma.surgery.count({ where: { scheduledStart: { gte: today, lt: tomorrow } } }),
    ]);

    // Monthly appointments (last 6 months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = await prisma.appointment.count({ where: { appointmentDate: { gte: start, lt: end } } });
      months.push({ month: start.toLocaleString('vi-VN', { month: 'short', year: 'numeric' }), count });
    }

    // Monthly revenue (last 6 months)
    const revenueMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const agg = await prisma.bill.aggregate({
        where: { createdAt: { gte: start, lt: end }, paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      });
      revenueMonths.push({ month: start.toLocaleString('vi-VN', { month: 'short', year: 'numeric' }), revenue: agg._sum.totalAmount || 0 });
    }

    return ok(res, {
      totalPatients,
      todayAppointments,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      activeDoctors,
      pendingAppointments,
      pendingLabOrders,
      lowStockCount,
      activeEncounters,
      occupiedBeds,
      totalBeds,
      todaySurgeries,
      bedOccupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      appointmentChart: months,
      revenueChart: revenueMonths,
    });
  } catch {
    return serverError(res);
  }
};
