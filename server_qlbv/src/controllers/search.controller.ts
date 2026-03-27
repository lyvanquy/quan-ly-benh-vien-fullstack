import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { successResponse, errorResponse } from '../utils/response';

// Entity search config: which prisma model + which fields to search
const SEARCH_CONFIG: Record<string, { model: string; fields: string[]; labelField: string; subField?: string }> = {
  patient:     { model: 'patient',     fields: ['name', 'phone'],         labelField: 'name',          subField: 'patientCode' },
  doctor:      { model: 'doctor',      fields: [],                        labelField: 'specialty',     subField: undefined },
  appointment: { model: 'appointment', fields: [],                        labelField: 'id',            subField: undefined },
  medicine:    { model: 'medicine',    fields: ['name', 'genericName'],   labelField: 'name',          subField: 'code' },
  bill:        { model: 'bill',        fields: ['billCode'],              labelField: 'billCode',      subField: undefined },
  surgery:     { model: 'surgery',     fields: ['procedureName'],         labelField: 'procedureName', subField: undefined },
};

export async function globalSearch(req: Request, res: Response) {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) return successResponse(res, []);

    const results: { entity: string; id: string; label: string; sub?: string }[] = [];

    // Patient search
    const patients = await prisma.patient.findMany({
      where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }, { patientCode: { contains: q, mode: 'insensitive' } }] },
      take: 5,
      select: { id: true, name: true, patientCode: true, phone: true },
    });
    patients.forEach(p => results.push({ entity: 'patient', id: p.id, label: p.name, sub: p.phone || p.patientCode || undefined }));

    // Doctor search (via user name)
    const doctors = await prisma.doctor.findMany({
      where: { user: { name: { contains: q, mode: 'insensitive' } } },
      take: 5,
      include: { user: { select: { name: true } } },
    });
    doctors.forEach(d => results.push({ entity: 'doctor', id: d.id, label: `BS. ${d.user.name}`, sub: d.specialty }));

    // Medicine search
    const medicines = await prisma.medicine.findMany({
      where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { genericName: { contains: q, mode: 'insensitive' } }] },
      take: 5,
      select: { id: true, name: true, code: true },
    });
    medicines.forEach(m => results.push({ entity: 'medicine', id: m.id, label: m.name, sub: m.code || undefined }));

    // Bill search
    const bills = await prisma.bill.findMany({
      where: { billCode: { contains: q, mode: 'insensitive' } },
      take: 3,
      select: { id: true, billCode: true, finalAmount: true },
    });
    bills.forEach(b => results.push({ entity: 'bill', id: b.id, label: b.billCode, sub: `${b.finalAmount.toLocaleString()}d` }));

    // Surgery search
    const surgeries = await prisma.surgery.findMany({
      where: { procedureName: { contains: q, mode: 'insensitive' } },
      take: 3,
      select: { id: true, procedureName: true, status: true },
    });
    surgeries.forEach(s => results.push({ entity: 'surgery', id: s.id, label: s.procedureName, sub: s.status }));

    return successResponse(res, results);
  } catch (e) {
    return errorResponse(res, e);
  }
}
