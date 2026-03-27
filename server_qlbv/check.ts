import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const [appt, surg, or_, doc] = await Promise.all([
    p.appointment.count(),
    p.surgery.count(),
    p.operatingRoom.count(),
    p.doctor.count(),
  ]);
  console.log({ appointments: appt, surgeries: surg, operatingRooms: or_, doctors: doc });
  // Show first surgery if any
  if (surg > 0) {
    const s = await p.surgery.findFirst({ include: { patient: true, surgeon: { include: { user: true } }, or: true } });
    console.log('Sample surgery:', JSON.stringify(s, null, 2));
  } else {
    // Check why no surgeries - check OR
    const ors = await p.operatingRoom.findMany();
    console.log('Operating rooms:', ors);
  }
}
main().catch(console.error).finally(() => p.$disconnect());
