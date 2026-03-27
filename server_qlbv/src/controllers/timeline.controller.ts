import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { successResponse, errorResponse } from '../utils/response';

interface TimelineEvent {
  entity: string;
  id: string;
  label: string;
  sub?: string;
  date: Date;
  status?: string;
}

export async function getPatientTimeline(req: Request, res: Response) {
  try {
    const { patientId } = req.params;
    const events: TimelineEvent[] = [];

    const [appointments, encounters, labOrders, bills, surgeries, referrals] = await Promise.all([
      prisma.appointment.findMany({
        where: { patientId },
        select: { id: true, appointmentDate: true, status: true, doctor: { select: { user: { select: { name: true } } } } },
        orderBy: { appointmentDate: 'desc' },
        take: 20,
      }),
      prisma.encounter.findMany({
        where: { patientId },
        select: { id: true, createdAt: true, status: true, type: true, encounterCode: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.labOrder.findMany({
        where: { patientId },
        select: { id: true, createdAt: true, status: true, items: { select: { test: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.bill.findMany({
        where: { patientId },
        select: { id: true, createdAt: true, paymentStatus: true, finalAmount: true, billCode: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.surgery.findMany({
        where: { patientId },
        select: { id: true, scheduledStart: true, status: true, procedureName: true },
        orderBy: { scheduledStart: 'desc' },
        take: 10,
      }),
      prisma.referral.findMany({
        where: { patientId },
        select: { id: true, createdAt: true, status: true, reason: true, toDepartment: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    appointments.forEach(a => events.push({
      entity: 'appointment', id: a.id,
      label: `Lich kham - BS. ${a.doctor.user.name}`,
      date: a.appointmentDate, status: a.status,
    }));

    encounters.forEach(e => events.push({
      entity: 'encounter', id: e.id,
      label: `Dot dieu tri - ${e.type}`,
      sub: e.encounterCode,
      date: e.createdAt, status: e.status,
    }));

    labOrders.forEach(o => events.push({
      entity: 'lab_order', id: o.id,
      label: `Xet nghiem (${o.items.length} chi tieu)`,
      date: o.createdAt, status: o.status,
    }));

    bills.forEach(b => events.push({
      entity: 'bill', id: b.id,
      label: `Hoa don ${b.billCode}`,
      sub: `${b.finalAmount.toLocaleString()}d`,
      date: b.createdAt, status: b.paymentStatus,
    }));

    surgeries.forEach(s => events.push({
      entity: 'surgery', id: s.id,
      label: `Phau thuat: ${s.procedureName}`,
      date: s.scheduledStart, status: s.status,
    }));

    referrals.forEach(r => events.push({
      entity: 'referral', id: r.id,
      label: `Chuyen vien: ${r.toDepartment || r.reason}`,
      date: r.createdAt, status: r.status,
    }));

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return successResponse(res, events);
  } catch (e) {
    return errorResponse(res, e);
  }
}
