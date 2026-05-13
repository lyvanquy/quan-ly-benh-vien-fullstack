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
      todayAppointmentList,
      pendingLabList,
      lowStockRows,
      fallbackDoctorList,
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
      prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) as count FROM "Medicine" WHERE stock <= "minStock"`.then((r: Array<{ count: bigint }>) => Number(r[0]?.count ?? 0)),
      p.encounter.count({ where: { status: { notIn: ['DISCHARGED', 'CANCELLED', 'TRANSFERRED'] } } } as never),
      p.bed.count({ where: { status: 'OCCUPIED' } } as never),
      p.bed.count(),
      prisma.surgery.count({ where: { scheduledStart: { gte: today, lt: tomorrow } } }),
      prisma.appointment.findMany({
        where: { appointmentDate: { gte: today, lt: tomorrow } },
        orderBy: { appointmentDate: 'asc' },
        take: 8,
        select: {
          id: true,
          appointmentDate: true,
          status: true,
          patient: { select: { name: true } },
          doctor: { select: { user: { select: { name: true } } } },
        },
      }),
      prisma.labOrder.findMany({
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'asc' },
        take: 8,
        select: {
          id: true,
          status: true,
          patient: { select: { name: true } },
          items: { take: 1, select: { test: { select: { name: true } } } },
        },
      }),
      prisma.$queryRaw<Array<{ id: string; name: string; stock: number; minStock: number }>>`
        SELECT id, name, stock, "minStock"
        FROM "Medicine"
        WHERE stock <= "minStock"
        ORDER BY stock ASC
        LIMIT 8
      `,
      prisma.doctor.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          specialty: true,
          user: { select: { name: true } },
        },
      }),
    ]);

    const doctorLoadRows = await prisma.appointment.groupBy({
      by: ['doctorId'],
      where: {
        appointmentDate: { gte: today, lt: tomorrow },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      _count: { _all: true },
    });

    const doctorLoadIds = doctorLoadRows.map((r) => r.doctorId);
    const loadedDoctors = doctorLoadIds.length > 0
      ? await prisma.doctor.findMany({
          where: { id: { in: doctorLoadIds } },
          select: {
            id: true,
            specialty: true,
            user: { select: { name: true } },
          },
        })
      : [];

    const doctorById = new Map(loadedDoctors.map((d) => [d.id, d]));
    const activeDoctorList = doctorLoadRows
      .map((row) => {
        const doctor = doctorById.get(row.doctorId);
        if (!doctor) return null;
        return {
          id: doctor.id,
          name: `BS. ${doctor.user.name}`,
          specialty: doctor.specialty,
          todayCases: row._count._all,
          maxCases: 16,
        };
      })
      .filter((d): d is { id: string; name: string; specialty: string; todayCases: number; maxCases: number } => d !== null)
      .sort((a, b) => b.todayCases - a.todayCases)
      .slice(0, 8);

    // Monthly appointments (last 6 months)
    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = await prisma.appointment.count({ where: { appointmentDate: { gte: start, lt: end } } });
      months.push({ month: start.toLocaleString('vi-VN', { month: 'short', year: 'numeric' }), count });
    }

    // Monthly revenue (last 6 months)
    const revenueMonths: { month: string; revenue: number }[] = [];
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
      todayAppointmentList: todayAppointmentList.map((a) => ({
        id: a.id,
        patientName: a.patient.name,
        time: new Date(a.appointmentDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        status: a.status,
        doctor: `BS. ${a.doctor.user.name}`,
      })),
      pendingLabList: pendingLabList.map((l) => ({
        id: l.id,
        testName: l.items[0]?.test?.name ?? 'Xét nghiệm',
        patientName: l.patient.name,
        priority: l.status === 'PENDING' ? 'NORMAL' : 'PROCESSING',
        status: l.status,
      })),
      lowStockList: lowStockRows.map((m) => ({
        id: m.id,
        name: m.name,
        stock: m.stock,
        minStock: m.minStock,
      })),
      activeDoctorList: activeDoctorList.length > 0
        ? activeDoctorList
        : fallbackDoctorList.map((d) => ({
            id: d.id,
            name: `BS. ${d.user.name}`,
            specialty: d.specialty,
            todayCases: 0,
            maxCases: 16,
          })),
    });
  } catch {
    return serverError(res);
  }
};
