import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = (p: string) => bcrypt.hashSync(p, 10);

// ─── 1. USERS & DOCTORS ──────────────────────────────────────────────────────
async function seedUsers() {
  const staffUsers = [
    { email: 'admin@hms.com',          name: 'Admin He Thong',       role: 'ADMIN',          pw: 'Admin@123' },
    { email: 'lyvanquy2020@gmail.com', name: 'Ly Van Quy',           role: 'ADMIN',          pw: 'Admin@123' },
    { email: 'nurse@hms.com',  name: 'Y ta Nguyen Thi Mai',  role: 'NURSE',          pw: 'Nurse@123' },
    { email: 'recep@hms.com',  name: 'Le tan Tran Van Hoa',  role: 'RECEPTIONIST',   pw: 'Recep@123' },
    { email: 'pharma@hms.com', name: 'DS. Le Thi Cam',       role: 'PHARMACIST',     pw: 'Pharma@123' },
    { email: 'lab@hms.com',    name: 'KTV Pham Van Tuan',    role: 'LAB_TECHNICIAN', pw: 'Lab@123' },
    { email: 'acct@hms.com',   name: 'KT Hoang Thi Thu',     role: 'ACCOUNTANT',     pw: 'Acct@123' },
  ];
  for (const u of staffUsers) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: { name: u.name, email: u.email, password: hash(u.pw), role: u.role as never } });
  }

  const doctorData = [
    { email: 'bs.nguyen@hms.com', name: 'BS. Nguyen Van An',    specialty: 'Noi khoa',     exp: 12, room: 'P.101', bio: 'Chuyen gia noi tong quat, 12 nam kinh nghiem tai Benh vien Cho Ray' },
    { email: 'bs.tran@hms.com',   name: 'BS. Tran Thi Bich',    specialty: 'Tim mach',     exp: 8,  room: 'P.102', bio: 'Tien si Tim mach, tu nghiep Dai hoc Y Ha Noi, chuyen sau suy tim' },
    { email: 'bs.le@hms.com',     name: 'BS. Le Minh Duc',      specialty: 'Ngoai khoa',   exp: 15, room: 'P.201', bio: 'Pho giao su Ngoai khoa, 15 nam phau thuat tieu hoa' },
    { email: 'bs.pham@hms.com',   name: 'BS. Pham Thi Lan',     specialty: 'Nhi khoa',     exp: 6,  room: 'P.301', bio: 'Bac si Nhi khoa, chuyen khoa II, kinh nghiem dieu tri tre so sinh' },
    { email: 'bs.hoang@hms.com',  name: 'BS. Hoang Van Kiet',   specialty: 'Cap cuu',      exp: 10, room: 'P.001', bio: 'Truong khoa Cap cuu, chuyen gia hoi suc tich cuc' },
    { email: 'bs.vo@hms.com',     name: 'BS. Vo Thi Huong',     specialty: 'Da lieu',      exp: 7,  room: 'P.401', bio: 'Bac si Da lieu, chuyen dieu tri benh da lieu man tinh' },
    { email: 'bs.dang@hms.com',   name: 'BS. Dang Quoc Bao',    specialty: 'Than kinh',    exp: 11, room: 'P.501', bio: 'Tien si Than kinh hoc, chuyen sau dot quy nao' },
    { email: 'bs.bui@hms.com',    name: 'BS. Bui Thi Ngoc',     specialty: 'San phu khoa', exp: 9,  room: 'P.601', bio: 'Chuyen gia San phu khoa, hon 2000 ca sinh thanh cong' },
  ];

  const doctors: { id: string }[] = [];
  for (const d of doctorData) {
    const u = await prisma.user.upsert({ where: { email: d.email }, update: {}, create: { name: d.name, email: d.email, password: hash('Doctor@123'), role: 'DOCTOR' as never } });
    const doc = await prisma.doctor.upsert({ where: { userId: u.id }, update: {}, create: { userId: u.id, specialty: d.specialty, experienceYears: d.exp, roomNumber: d.room, bio: d.bio } });
    doctors.push(doc);
  }
  console.log('✓ Users & Doctors seeded');
  return doctors;
}

// ─── 2. STAFF (30 nhân viên thực tế) ─────────────────────────────────────────
async function seedStaff() {
  const count = await prisma.staff.count();
  if (count >= 10) { console.log('✓ Staff already seeded'); return; }

  const staffData = [
    { email: 'nurse@hms.com',  dept: 'Khoa Noi tong hop',  pos: 'Dieu duong truong',    salary: 12000000 },
    { email: 'recep@hms.com',  dept: 'Phong tiep nhan',     pos: 'Le tan vien',          salary: 9000000 },
    { email: 'pharma@hms.com', dept: 'Khoa Duoc',           pos: 'Duoc si lam sang',     salary: 14000000 },
    { email: 'lab@hms.com',    dept: 'Khoa Xet nghiem',     pos: 'Ky thuat vien xet nghiem', salary: 11000000 },
    { email: 'acct@hms.com',   dept: 'Phong Ke toan',       pos: 'Ke toan vien',         salary: 10000000 },
  ];

  const extraStaffEmails = [
    { email: 'nurse2@hms.com', name: 'Y ta Le Thi Hoa',      role: 'NURSE',        dept: 'Khoa Tim mach',    pos: 'Dieu duong vien',   salary: 10500000 },
    { email: 'nurse3@hms.com', name: 'Y ta Pham Van Binh',   role: 'NURSE',        dept: 'Khoa ICU',         pos: 'Dieu duong ICU',    salary: 13000000 },
    { email: 'nurse4@hms.com', name: 'Y ta Vo Thi Xuan',     role: 'NURSE',        dept: 'Khoa Nhi',         pos: 'Dieu duong Nhi',    salary: 10000000 },
    { email: 'recep2@hms.com', name: 'Le tan Nguyen Van Tai', role: 'RECEPTIONIST', dept: 'Phong tiep nhan',  pos: 'Le tan vien',       salary: 8500000 },
    { email: 'lab2@hms.com',   name: 'KTV Dang Thi Lan',     role: 'LAB_TECHNICIAN',dept: 'Khoa Xet nghiem', pos: 'KTV xet nghiem',    salary: 11500000 },
  ];

  for (const s of extraStaffEmails) {
    await prisma.user.upsert({ where: { email: s.email }, update: {}, create: { name: s.name, email: s.email, password: hash('Staff@123'), role: s.role as never } });
  }

  const allStaff = [
    ...staffData.map(s => ({ ...s, joinDate: new Date('2020-01-15') })),
    ...extraStaffEmails.map(s => ({ email: s.email, dept: s.dept, pos: s.pos, salary: s.salary, joinDate: new Date('2021-06-01') })),
  ];

  for (const s of allStaff) {
    const user = await prisma.user.findUnique({ where: { email: s.email } });
    if (!user) continue;
    const existing = await prisma.staff.findUnique({ where: { userId: user.id } });
    if (existing) continue;
    const staff = await prisma.staff.create({ data: { userId: user.id, department: s.dept, position: s.pos, joinDate: s.joinDate, salary: s.salary } });
    // Tạo 3 ca làm việc cho mỗi nhân viên
    for (let i = 0; i < 3; i++) {
      const d = new Date(); d.setDate(d.getDate() - i * 7);
      await prisma.shift.create({ data: { staffId: staff.id, date: d, startTime: '07:00', endTime: '15:00', note: `Ca sang tuan ${i + 1}` } });
    }
  }
  console.log('✓ Staff & Shifts seeded');
}

// ─── 3. PATIENTS (30 bệnh nhân thực tế) ──────────────────────────────────────
async function seedPatients() {
  const patients = [
    { name: 'Nguyen Thi Hoa',    dob: '1985-03-12', gender: 'FEMALE', phone: '0901234567', blood: 'A+',  address: '12 Nguyen Hue, Q1, TP.HCM',          allergies: 'Penicillin',    chronic: 'Tang huyet ap' },
    { name: 'Tran Van Minh',     dob: '1972-07-25', gender: 'MALE',   phone: '0912345678', blood: 'O+',  address: '45 Le Loi, Q3, TP.HCM',              allergies: null,            chronic: 'Tieu duong type 2' },
    { name: 'Le Thi Thu',        dob: '1990-11-08', gender: 'FEMALE', phone: '0923456789', blood: 'B+',  address: '78 Tran Hung Dao, Q5, TP.HCM',       allergies: 'Aspirin',       chronic: null },
    { name: 'Pham Van Hung',     dob: '1965-05-30', gender: 'MALE',   phone: '0934567890', blood: 'AB+', address: '23 Vo Van Tan, Q3, TP.HCM',          allergies: null,            chronic: 'Benh tim mach vanh' },
    { name: 'Hoang Thi Lan',     dob: '1998-09-14', gender: 'FEMALE', phone: '0945678901', blood: 'A-',  address: '56 Dien Bien Phu, Binh Thanh',       allergies: 'Sulfa',         chronic: null },
    { name: 'Vo Minh Tuan',      dob: '1980-02-18', gender: 'MALE',   phone: '0956789012', blood: 'O-',  address: '89 CMT8, Q10, TP.HCM',               allergies: null,            chronic: 'Viem khop dang thap' },
    { name: 'Dang Thi Bich',     dob: '1955-12-03', gender: 'FEMALE', phone: '0967890123', blood: 'B-',  address: '34 Ly Thuong Kiet, Q10, TP.HCM',    allergies: 'Codeine',       chronic: 'Suy than man' },
    { name: 'Bui Van Long',      dob: '1988-06-22', gender: 'MALE',   phone: '0978901234', blood: 'A+',  address: '67 Nguyen Dinh Chieu, Q3, TP.HCM',  allergies: null,            chronic: null },
    { name: 'Do Thi Phuong',     dob: '1975-04-17', gender: 'FEMALE', phone: '0989012345', blood: 'O+',  address: '12 Hoang Dieu, Q4, TP.HCM',         allergies: 'NSAID',         chronic: 'Hen suyen' },
    { name: 'Nguyen Van Duc',    dob: '1960-08-09', gender: 'MALE',   phone: '0990123456', blood: 'AB-', address: '45 Nguyen Trai, Q5, TP.HCM',        allergies: null,            chronic: 'COPD, Tang huyet ap' },
    { name: 'Tran Thi Nga',      dob: '1993-01-27', gender: 'FEMALE', phone: '0901357924', blood: 'B+',  address: '78 Pham Ngu Lao, Q1, TP.HCM',       allergies: null,            chronic: null },
    { name: 'Le Van Thanh',      dob: '1970-10-15', gender: 'MALE',   phone: '0912468035', blood: 'A+',  address: '23 Bui Vien, Q1, TP.HCM',           allergies: 'Latex',         chronic: 'Tieu duong type 2' },
    { name: 'Pham Thi Mai',      dob: '1982-07-04', gender: 'FEMALE', phone: '0923579146', blood: 'O+',  address: '56 Nguyen Van Cu, Q5, TP.HCM',      allergies: null,            chronic: null },
    { name: 'Hoang Van Nam',     dob: '1945-03-21', gender: 'MALE',   phone: '0934680257', blood: 'B+',  address: '89 Tran Phu, Q5, TP.HCM',           allergies: 'Morphine',      chronic: 'Suy tim, Tang huyet ap' },
    { name: 'Vo Thi Hien',       dob: '2001-11-30', gender: 'FEMALE', phone: '0945791368', blood: 'A-',  address: '34 Nguyen Huu Tho, Q7, TP.HCM',    allergies: null,            chronic: null },
    { name: 'Dang Van Phuc',     dob: '1978-05-16', gender: 'MALE',   phone: '0956802479', blood: 'O+',  address: '67 Nguyen Luong Bang, Q7, TP.HCM',  allergies: 'Ibuprofen',     chronic: 'Viem loet da day' },
    { name: 'Bui Thi Thuy',      dob: '1995-09-08', gender: 'FEMALE', phone: '0967913580', blood: 'AB+', address: '12 Phan Van Tri, Binh Thanh',       allergies: null,            chronic: null },
    { name: 'Do Van Khanh',      dob: '1968-02-14', gender: 'MALE',   phone: '0978024691', blood: 'B-',  address: '45 Xo Viet Nghe Tinh, Binh Thanh',  allergies: null,            chronic: 'Xo gan, Tieu duong' },
    { name: 'Nguyen Thi Yen',    dob: '1987-06-25', gender: 'FEMALE', phone: '0989135702', blood: 'A+',  address: '78 Dien Bien Phu, Q3, TP.HCM',      allergies: 'Tetracycline',  chronic: null },
    { name: 'Tran Van Binh',     dob: '1952-12-11', gender: 'MALE',   phone: '0990246813', blood: 'O-',  address: '23 Nguyen Oanh, Go Vap',             allergies: null,            chronic: 'Benh Parkinson' },
    { name: 'Le Thi Xuan',       dob: '1999-04-03', gender: 'FEMALE', phone: '0901358024', blood: 'B+',  address: '56 Quang Trung, Go Vap',             allergies: null,            chronic: null },
    { name: 'Pham Van Cuong',    dob: '1973-08-19', gender: 'MALE',   phone: '0912469135', blood: 'A+',  address: '89 Le Van Viet, Q9, TP.HCM',        allergies: 'Cephalosporin', chronic: 'Tang huyet ap' },
    { name: 'Hoang Thi Dung',    dob: '1991-01-07', gender: 'FEMALE', phone: '0923570246', blood: 'O+',  address: '34 Nguyen Xien, Q9, TP.HCM',        allergies: null,            chronic: null },
    { name: 'Vo Van Tai',        dob: '1963-07-28', gender: 'MALE',   phone: '0934681357', blood: 'AB+', address: '67 Pham Van Dong, Thu Duc',          allergies: null,            chronic: 'Suy than, Tang huyet ap' },
    { name: 'Dang Thi Loan',     dob: '1984-03-15', gender: 'FEMALE', phone: '0945792468', blood: 'A-',  address: '12 Vo Thi Sau, Q3, TP.HCM',         allergies: 'Penicillin',    chronic: null },
    { name: 'Bui Van Hieu',      dob: '1977-10-22', gender: 'MALE',   phone: '0956803579', blood: 'B+',  address: '45 Tran Quoc Toan, Q3, TP.HCM',    allergies: null,            chronic: 'Viem gan B man tinh' },
    { name: 'Do Thi Hanh',       dob: '2003-06-10', gender: 'FEMALE', phone: '0967914680', blood: 'O+',  address: '78 Nguyen Thi Minh Khai, Q1',       allergies: null,            chronic: null },
    { name: 'Nguyen Van Phong',  dob: '1958-11-05', gender: 'MALE',   phone: '0978025791', blood: 'A+',  address: '23 Le Duan, Q1, TP.HCM',            allergies: 'Warfarin',      chronic: 'Rung nhi, Suy tim' },
    { name: 'Tran Thi Cam',      dob: '1996-08-17', gender: 'FEMALE', phone: '0989136802', blood: 'B-',  address: '56 Hai Ba Trung, Q1, TP.HCM',       allergies: null,            chronic: null },
    { name: 'Le Minh Khoa',      dob: '1969-04-29', gender: 'MALE',   phone: '0990247913', blood: 'O+',  address: '89 Nguyen Binh Khiem, Q1, TP.HCM',  allergies: 'Contrast dye',  chronic: 'Ung thu dai trang giai doan II' },
  ];

  const created: { id: string }[] = [];
  for (const pt of patients) {
    const existing = await prisma.patient.findFirst({ where: { phone: pt.phone } });
    if (existing) { created.push(existing); continue; }
    const rec = await prisma.patient.create({ data: {
      name: pt.name, dob: new Date(pt.dob), gender: pt.gender as never,
      phone: pt.phone, bloodType: pt.blood, address: pt.address,
      allergies: pt.allergies ?? undefined, chronicDiseases: pt.chronic ?? undefined,
    }});
    created.push(rec);
  }
  console.log(`✓ ${created.length} Patients seeded`);
  return created;
}

// ─── 4. MEDICINES (30 thuốc thực tế) ─────────────────────────────────────────
async function seedMedicines() {
  const meds = [
    { name: 'Amoxicillin 500mg',        generic: 'Amoxicillin',          cat: 'Khang sinh',          price: 3500,   stock: 500,  min: 50,  unit: 'vien', mfr: 'Mekophar' },
    { name: 'Metformin 850mg',           generic: 'Metformin HCl',        cat: 'Tieu duong',          price: 2800,   stock: 800,  min: 80,  unit: 'vien', mfr: 'DHG Pharma' },
    { name: 'Amlodipine 5mg',            generic: 'Amlodipine besylate',  cat: 'Tim mach',            price: 4200,   stock: 600,  min: 60,  unit: 'vien', mfr: 'Pymepharco' },
    { name: 'Atorvastatin 20mg',         generic: 'Atorvastatin',         cat: 'Mo mau',              price: 8500,   stock: 400,  min: 40,  unit: 'vien', mfr: 'Pfizer' },
    { name: 'Omeprazole 20mg',           generic: 'Omeprazole',           cat: 'Tieu hoa',            price: 3200,   stock: 700,  min: 70,  unit: 'vien', mfr: 'Stada' },
    { name: 'Paracetamol 500mg',         generic: 'Paracetamol',          cat: 'Giam dau ha sot',     price: 1200,   stock: 2000, min: 200, unit: 'vien', mfr: 'OPV' },
    { name: 'Losartan 50mg',             generic: 'Losartan potassium',   cat: 'Tim mach',            price: 5600,   stock: 450,  min: 45,  unit: 'vien', mfr: 'Merck' },
    { name: 'Salbutamol 4mg',            generic: 'Salbutamol sulfate',   cat: 'Ho hap',              price: 2100,   stock: 300,  min: 30,  unit: 'vien', mfr: 'Glaxo' },
    { name: 'Ciprofloxacin 500mg',       generic: 'Ciprofloxacin HCl',   cat: 'Khang sinh',          price: 6800,   stock: 350,  min: 35,  unit: 'vien', mfr: 'Bayer' },
    { name: 'Insulin Glargine 100IU/ml', generic: 'Insulin glargine',     cat: 'Tieu duong',          price: 285000, stock: 80,   min: 10,  unit: 'lo',   mfr: 'Sanofi' },
    { name: 'Furosemide 40mg',           generic: 'Furosemide',           cat: 'Loi tieu',            price: 1800,   stock: 500,  min: 50,  unit: 'vien', mfr: 'DHG Pharma' },
    { name: 'Warfarin 5mg',              generic: 'Warfarin sodium',      cat: 'Chong dong mau',      price: 4500,   stock: 200,  min: 20,  unit: 'vien', mfr: 'Orion' },
    { name: 'Prednisolone 5mg',          generic: 'Prednisolone',         cat: 'Corticosteroid',      price: 2600,   stock: 400,  min: 40,  unit: 'vien', mfr: 'Roussel' },
    { name: 'Azithromycin 500mg',        generic: 'Azithromycin',         cat: 'Khang sinh',          price: 12000,  stock: 250,  min: 25,  unit: 'vien', mfr: 'Pfizer' },
    { name: 'Metronidazole 250mg',       generic: 'Metronidazole',        cat: 'Khang sinh',          price: 1500,   stock: 600,  min: 60,  unit: 'vien', mfr: 'Mekophar' },
    { name: 'Lisinopril 10mg',           generic: 'Lisinopril',           cat: 'Tim mach',            price: 5200,   stock: 380,  min: 38,  unit: 'vien', mfr: 'Merck' },
    { name: 'Clopidogrel 75mg',          generic: 'Clopidogrel bisulfate',cat: 'Tim mach',            price: 9800,   stock: 300,  min: 30,  unit: 'vien', mfr: 'Sanofi' },
    { name: 'Pantoprazole 40mg',         generic: 'Pantoprazole sodium',  cat: 'Tieu hoa',            price: 7500,   stock: 420,  min: 42,  unit: 'vien', mfr: 'Nycomed' },
    { name: 'Cetirizine 10mg',           generic: 'Cetirizine HCl',       cat: 'Di ung',              price: 2200,   stock: 550,  min: 55,  unit: 'vien', mfr: 'UCB' },
    { name: 'Tramadol 50mg',             generic: 'Tramadol HCl',         cat: 'Giam dau',            price: 8200,   stock: 150,  min: 15,  unit: 'vien', mfr: 'Grunenthal' },
    { name: 'Dexamethasone 0.5mg',       generic: 'Dexamethasone',        cat: 'Corticosteroid',      price: 1900,   stock: 480,  min: 48,  unit: 'vien', mfr: 'Roussel' },
    { name: 'Clarithromycin 500mg',      generic: 'Clarithromycin',       cat: 'Khang sinh',          price: 15000,  stock: 200,  min: 20,  unit: 'vien', mfr: 'Abbott' },
    { name: 'Spironolactone 25mg',       generic: 'Spironolactone',       cat: 'Loi tieu',            price: 3800,   stock: 320,  min: 32,  unit: 'vien', mfr: 'Pfizer' },
    { name: 'Gabapentin 300mg',          generic: 'Gabapentin',           cat: 'Than kinh',           price: 11000,  stock: 180,  min: 18,  unit: 'vien', mfr: 'Pfizer' },
    { name: 'Esomeprazole 40mg',         generic: 'Esomeprazole Mg',      cat: 'Tieu hoa',            price: 9500,   stock: 360,  min: 36,  unit: 'vien', mfr: 'AstraZeneca' },
    { name: 'Bisoprolol 5mg',            generic: 'Bisoprolol fumarate',  cat: 'Tim mach',            price: 6200,   stock: 420,  min: 42,  unit: 'vien', mfr: 'Merck' },
    { name: 'Levofloxacin 500mg',        generic: 'Levofloxacin',         cat: 'Khang sinh',          price: 18000,  stock: 220,  min: 22,  unit: 'vien', mfr: 'Sanofi' },
    { name: 'Vitamin D3 1000IU',         generic: 'Cholecalciferol',      cat: 'Vitamin',             price: 4800,   stock: 900,  min: 90,  unit: 'vien', mfr: 'DHG Pharma' },
    { name: 'Calcium Carbonate 500mg',   generic: 'Calcium carbonate',    cat: 'Khoang chat',         price: 2400,   stock: 750,  min: 75,  unit: 'vien', mfr: 'OPV' },
    { name: 'Ibuprofen 400mg',           generic: 'Ibuprofen',            cat: 'Giam dau chong viem', price: 2900,   stock: 680,  min: 68,  unit: 'vien', mfr: 'Stada' },
  ];

  const created: { id: string }[] = [];
  for (const m of meds) {
    const existing = await prisma.medicine.findFirst({ where: { name: m.name } });
    if (existing) { created.push(existing); continue; }
    const rec = await prisma.medicine.create({ data: { name: m.name, genericName: m.generic, category: m.cat, price: m.price, stock: m.stock, minStock: m.min, unit: m.unit, manufacturer: m.mfr } });
    created.push(rec);
  }
  console.log(`✓ ${created.length} Medicines seeded`);
  return created;
}

// ─── 5. LAB TESTS ─────────────────────────────────────────────────────────────
async function seedLabTests() {
  const tests = [
    { code: 'CBC',   name: 'Cong thuc mau toan bo',       cat: 'Huyet hoc',          price: 85000,  unit: '',       range: 'Xem chi tiet' },
    { code: 'GLU',   name: 'Duong huyet luc doi',          cat: 'Sinh hoa',           price: 35000,  unit: 'mmol/L', range: '3.9 - 6.1' },
    { code: 'HBA1C', name: 'HbA1c',                       cat: 'Sinh hoa',           price: 120000, unit: '%',      range: '< 5.7' },
    { code: 'CHOL',  name: 'Cholesterol toan phan',        cat: 'Sinh hoa',           price: 45000,  unit: 'mmol/L', range: '< 5.2' },
    { code: 'TRIG',  name: 'Triglyceride',                 cat: 'Sinh hoa',           price: 45000,  unit: 'mmol/L', range: '< 1.7' },
    { code: 'HDL',   name: 'HDL Cholesterol',              cat: 'Sinh hoa',           price: 55000,  unit: 'mmol/L', range: '> 1.0' },
    { code: 'LDL',   name: 'LDL Cholesterol',              cat: 'Sinh hoa',           price: 55000,  unit: 'mmol/L', range: '< 2.6' },
    { code: 'CREA',  name: 'Creatinine mau',               cat: 'Sinh hoa',           price: 40000,  unit: 'umol/L', range: '62 - 115' },
    { code: 'UREA',  name: 'Ure mau',                      cat: 'Sinh hoa',           price: 35000,  unit: 'mmol/L', range: '2.5 - 7.5' },
    { code: 'ALT',   name: 'ALT (SGPT)',                   cat: 'Sinh hoa',           price: 40000,  unit: 'U/L',    range: '< 40' },
    { code: 'AST',   name: 'AST (SGOT)',                   cat: 'Sinh hoa',           price: 40000,  unit: 'U/L',    range: '< 40' },
    { code: 'TSH',   name: 'TSH (Tuyen giap)',             cat: 'Noi tiet',           price: 150000, unit: 'mIU/L',  range: '0.4 - 4.0' },
    { code: 'URIN',  name: 'Tong phan tich nuoc tieu',     cat: 'Nuoc tieu',          price: 55000,  unit: '',       range: 'Xem chi tiet' },
    { code: 'XRAY',  name: 'X-quang nguc thang',           cat: 'Chan doan hinh anh', price: 120000, unit: '',       range: 'Binh thuong' },
    { code: 'ECG',   name: 'Dien tam do (ECG)',            cat: 'Tim mach',           price: 85000,  unit: '',       range: 'Nhip xoang binh thuong' },
  ];
  for (const t of tests) {
    await prisma.labTest.upsert({ where: { code: t.code }, update: {}, create: { code: t.code, name: t.name, category: t.cat, price: t.price, unit: t.unit, normalRange: t.range } });
  }
  console.log('✓ Lab Tests seeded');
}

// ─── 6. CAMPUS / BUILDING / FLOOR / WARD / ROOM / BED ────────────────────────
async function seedLocation() {
  const campus = await prisma.campus.upsert({ where: { code: 'BV-MAIN' }, update: {}, create: {
    code: 'BV-MAIN', name: 'Benh vien Da khoa Trung tam', address: '215 Hong Bang, Q5, TP.HCM', phone: '028-38554137',
  }});

  const building = await prisma.building.upsert({ where: { id: 'bld-a' }, update: {}, create: { id: 'bld-a', campusId: campus.id, name: 'Toa nha A - Noi tru' } });

  const floors = await Promise.all([1, 2, 3].map(n =>
    prisma.floor.upsert({ where: { id: `floor-${n}` }, update: {}, create: { id: `floor-${n}`, buildingId: building.id, number: n, label: `Tang ${n}` } })
  ));

  const wardData = [
    { id: 'ward-noi', floorIdx: 0, name: 'Khoa Noi tong hop',  code: 'NOI', type: 'GENERAL' },
    { id: 'ward-tim', floorIdx: 0, name: 'Khoa Tim mach',       code: 'TIM', type: 'GENERAL' },
    { id: 'ward-ngo', floorIdx: 1, name: 'Khoa Ngoai tong hop', code: 'NGO', type: 'GENERAL' },
    { id: 'ward-icu', floorIdx: 1, name: 'Khoa ICU',            code: 'ICU', type: 'ICU' },
    { id: 'ward-nhi', floorIdx: 2, name: 'Khoa Nhi',            code: 'NHI', type: 'GENERAL' },
    { id: 'ward-cap', floorIdx: 2, name: 'Khoa Cap cuu',        code: 'CAP', type: 'EMERGENCY' },
  ];

  const wards: { id: string }[] = [];
  for (const w of wardData) {
    const ward = await prisma.ward.upsert({ where: { id: w.id }, update: {}, create: { id: w.id, floorId: floors[w.floorIdx].id, name: w.name, code: w.code, type: w.type } });
    wards.push(ward);
  }

  const beds: { id: string }[] = [];
  for (const ward of wards) {
    for (let r = 1; r <= 2; r++) {
      const roomId = `room-${ward.id}-${r}`;
      const room = await prisma.room.upsert({ where: { id: roomId }, update: {}, create: { id: roomId, wardId: ward.id, name: `Phong ${r}`, type: 'PATIENT' } });
      for (let b = 1; b <= 4; b++) {
        const bedCode = `B${b}`;
        const status = (r === 1 && b <= 2) ? 'OCCUPIED' : 'AVAILABLE';
        const existing = await prisma.bed.findUnique({ where: { roomId_code: { roomId: room.id, code: bedCode } } });
        if (!existing) {
          const bed = await prisma.bed.create({ data: { roomId: room.id, code: bedCode, status: status as never } });
          beds.push(bed);
        } else { beds.push(existing); }
      }
    }
  }

  const orRoomId = 'room-or-1';
  const orRoom = await prisma.room.upsert({ where: { id: orRoomId }, update: {}, create: { id: orRoomId, wardId: wards[2].id, name: 'Phong mo 1', type: 'OPERATING' } });
  const or = await prisma.operatingRoom.upsert({ where: { roomId: orRoom.id }, update: {}, create: { roomId: orRoom.id, name: 'Phong mo chinh 1', isActive: true } });

  console.log(`✓ Location seeded (${beds.length} beds)`);
  return { beds, wards, or };
}

// ─── 7. DEPARTMENTS ───────────────────────────────────────────────────────────
async function seedDepartments() {
  const depts = [
    { code: 'NOI',  name: 'Khoa Noi tong hop' },
    { code: 'TIM',  name: 'Khoa Tim mach' },
    { code: 'NGO',  name: 'Khoa Ngoai tong hop' },
    { code: 'NHI',  name: 'Khoa Nhi' },
    { code: 'CAP',  name: 'Khoa Cap cuu' },
    { code: 'DA',   name: 'Khoa Da lieu' },
    { code: 'THAN', name: 'Khoa Than kinh' },
    { code: 'SAN',  name: 'Khoa San phu khoa' },
  ];
  const created: { id: string }[] = [];
  for (const d of depts) {
    const rec = await prisma.department.upsert({ where: { code: d.code }, update: {}, create: { code: d.code, name: d.name } });
    created.push(rec);
  }
  console.log('✓ Departments seeded');
  return created;
}

// ─── 8. DOCTOR SCHEDULES + WARD/DEPT ASSIGNMENTS ─────────────────────────────
async function seedDoctorAssignments(doctors: {id:string}[], wards: {id:string}[], departments: {id:string}[]) {
  const schedCount = await prisma.doctorSchedule.count();
  if (schedCount >= 10) { console.log('✓ Doctor assignments already seeded'); return; }

  // Lịch làm việc: mỗi bác sĩ 3 ngày/tuần
  const schedules = [
    [1, 3, 5], [1, 2, 4], [2, 3, 5], [1, 4, 6], [0, 2, 4],
    [1, 3, 5], [2, 4, 6], [1, 3, 5],
  ];
  for (let i = 0; i < doctors.length; i++) {
    for (const day of schedules[i % schedules.length]) {
      await prisma.doctorSchedule.create({ data: { doctorId: doctors[i].id, dayOfWeek: day, startTime: '07:30', endTime: '11:30', isActive: true } });
    }
  }

  // Gán bác sĩ vào khoa
  const deptAssign = [
    { dIdx: 0, drs: [0, 1] },  // Noi: BS Nguyen, BS Tran
    { dIdx: 1, drs: [1, 2] },  // Tim: BS Tran, BS Le
    { dIdx: 2, drs: [2, 3] },  // Ngoai: BS Le, BS Pham
    { dIdx: 3, drs: [3, 4] },  // Nhi: BS Pham, BS Hoang
    { dIdx: 4, drs: [4, 5] },  // Cap cuu: BS Hoang, BS Vo
    { dIdx: 5, drs: [5] },     // Da lieu: BS Vo
    { dIdx: 6, drs: [6] },     // Than kinh: BS Dang
    { dIdx: 7, drs: [7] },     // San: BS Bui
  ];
  for (const a of deptAssign) {
    for (const drIdx of a.drs) {
      const existing = await prisma.departmentDoctor.findFirst({ where: { departmentId: departments[a.dIdx].id, doctorId: doctors[drIdx].id } });
      if (!existing) {
        await prisma.departmentDoctor.create({ data: { departmentId: departments[a.dIdx].id, doctorId: doctors[drIdx].id, isPrimary: a.drs[0] === drIdx } });
      }
    }
  }

  // Gán bác sĩ vào ward
  for (let i = 0; i < Math.min(doctors.length, wards.length); i++) {
    const existing = await prisma.wardDoctor.findFirst({ where: { wardId: wards[i].id, doctorId: doctors[i].id } });
    if (!existing) {
      await prisma.wardDoctor.create({ data: { wardId: wards[i].id, doctorId: doctors[i].id } });
    }
  }
  console.log('✓ Doctor schedules & assignments seeded');
}

// ─── 9. APPOINTMENTS (30 lịch khám) ──────────────────────────────────────────
async function seedAppointments(patients: {id:string}[], doctors: {id:string}[]) {
  const count = await prisma.appointment.count();
  if (count >= 30) { console.log('✓ Appointments already seeded'); return; }

  const statuses = ['COMPLETED','COMPLETED','COMPLETED','CONFIRMED','PENDING','CANCELLED','CHECKED_IN','IN_PROGRESS'];
  const notes = [
    'Kham dinh ky tang huyet ap', 'Tai kham sau dieu tri', 'Kham lan dau tieu duong',
    'Kiem tra ket qua xet nghiem', 'Tu van dieu tri', 'Kham suc khoe tong quat',
    'Theo doi sau phau thuat', 'Kham cap cuu', 'Kham nhi dinh ky', 'Kham tim mach',
  ];
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const daysOffset = Math.floor(i / 3) - 5;
    const apptDate = new Date(now);
    apptDate.setDate(apptDate.getDate() + daysOffset);
    apptDate.setHours(8 + (i % 8), (i % 4) * 15, 0, 0);
    await prisma.appointment.create({ data: {
      patientId: patients[i % patients.length].id,
      doctorId:  doctors[i % doctors.length].id,
      appointmentDate: apptDate,
      status: statuses[i % statuses.length] as never,
      note: notes[i % notes.length],
      queueNumber: i + 1,
    }});
  }
  console.log('✓ 30 Appointments seeded');
}

// ─── 10. MEDICAL RECORDS + PRESCRIPTIONS ─────────────────────────────────────
async function seedMedicalRecords(patients: {id:string}[], doctors: {id:string}[], medicines: {id:string}[]) {
  const count = await prisma.medicalRecord.count();
  if (count >= 30) { console.log('✓ Medical records already seeded'); return; }

  const diagnoses = [
    { diag: 'Tang huyet ap nguyen phat do II',      treat: 'Amlodipine 5mg 1v/ngay, giam muoi, tap the duc' },
    { diag: 'Tieu duong type 2 chua kiem soat',     treat: 'Metformin 850mg 2v/ngay, che do an kieng' },
    { diag: 'Viem phoi cong dong',                  treat: 'Amoxicillin 500mg 3v/ngay x 7 ngay, nghi ngoi' },
    { diag: 'Viem loet da day ta trang',             treat: 'Omeprazole 20mg 2v/ngay, Metronidazole 250mg 3v/ngay' },
    { diag: 'Suy tim do EF giam',                   treat: 'Furosemide 40mg, Bisoprolol 5mg, Spironolactone 25mg' },
    { diag: 'Viem khop dang thap',                  treat: 'Prednisolone 5mg, Methotrexate, vat ly tri lieu' },
    { diag: 'Hen suyen trung binh',                 treat: 'Salbutamol MDI khi can, Budesonide hit 2 lan/ngay' },
    { diag: 'Nhiem khuan duong tiet nieu',           treat: 'Ciprofloxacin 500mg 2v/ngay x 5 ngay, uong nhieu nuoc' },
    { diag: 'Roi loan mo mau',                      treat: 'Atorvastatin 20mg 1v/toi, che do an it mo' },
    { diag: 'Viem gan B man tinh',                  treat: 'Tenofovir 300mg 1v/ngay, theo doi men gan 3 thang/lan' },
    { diag: 'Dot quy nao thieu mau cuc bo',         treat: 'Aspirin 100mg, Clopidogrel 75mg, phuc hoi chuc nang' },
    { diag: 'Suy than man giai doan 3',             treat: 'Giam protein, kiem soat huyet ap, theo doi creatinine' },
    { diag: 'Viem ruot thua cap',                   treat: 'Phau thuat cat ruot thua noi soi, khang sinh du phong' },
    { diag: 'Ung thu dai trang giai doan II',       treat: 'Phau thuat cat doan dai trang, hoa tri FOLFOX' },
    { diag: 'Viem phoi benh vien do Klebsiella',    treat: 'Levofloxacin 500mg IV, ho tro ho hap' },
    { diag: 'Nhoi mau co tim cap',                  treat: 'Aspirin, Clopidogrel, Heparin, can thiep mach vanh' },
    { diag: 'Xo gan do ruou giai doan Child B',     treat: 'Ngung ruou, Spironolactone, Propranolol, theo doi bien chung' },
    { diag: 'Benh Parkinson giai doan 2',           treat: 'Levodopa/Carbidopa, vat ly tri lieu, tap the duc' },
    { diag: 'Viem da co dia',                       treat: 'Kem duong am, Hydrocortisone 1%, tranh di nguyen' },
    { diag: 'Thoat vi dia dem L4-L5',               treat: 'Giam dau, vat ly tri lieu, co the can phau thuat' },
    { diag: 'Viem amidan man tinh tai phat',        treat: 'Khang sinh, co the can cat amidan' },
    { diag: 'Soi than 8mm niệu quan phai',          treat: 'Tan soi ngoai co the, uong nhieu nuoc' },
    { diag: 'Viem tuy cap do soi mat',              treat: 'Nhip an, truyen dich, giam dau, ERCP lay soi' },
    { diag: 'Nhiem trung huyet do tu cau vang',     treat: 'Vancomycin IV, cay mau theo doi, ho tro tich cuc' },
    { diag: 'Gout cap khop co chan phai',           treat: 'Colchicine, Indomethacin, giam uric acid' },
    { diag: 'Viem phoi do COVID-19 trung binh',     treat: 'Remdesivir, Dexamethasone, oxy lieu phap' },
    { diag: 'Suy gian tinh mach chi duoi',          treat: 'Tat tinh mach, Daflon, tranh dung lau' },
    { diag: 'Viem khop goi thoai hoa do II',        treat: 'Glucosamine, Paracetamol, vat ly tri lieu' },
    { diag: 'Roi loan lo au lan toa',               treat: 'Sertraline 50mg, lieu phap nhan thuc hanh vi' },
    { diag: 'Viem gan C man tinh',                  treat: 'Sofosbuvir/Ledipasvir 12 tuan, theo doi SVR' },
  ];

  for (let i = 0; i < 30; i++) {
    const d = diagnoses[i];
    const rec = await prisma.medicalRecord.create({ data: {
      patientId: patients[i % patients.length].id,
      doctorId:  doctors[i % doctors.length].id,
      diagnosis: d.diag, treatment: d.treat,
      chiefComplaint: 'Benh nhan den kham vi ' + d.diag.toLowerCase(),
      note: 'Tai kham sau 4 tuan',
    }});
    await prisma.prescription.create({ data: {
      recordId: rec.id, medicineId: medicines[i % medicines.length].id,
      dosage: '1 vien', duration: '7 ngay', instruction: 'Uong sau an', quantity: 7,
    }});
    if (i % 3 === 0) {
      await prisma.prescription.create({ data: {
        recordId: rec.id, medicineId: medicines[(i + 5) % medicines.length].id,
        dosage: '2 vien', duration: '5 ngay', instruction: 'Uong sang toi', quantity: 10,
      }});
    }
  }
  console.log('✓ 30 Medical Records + Prescriptions seeded');
}

// ─── 11. BILLS (30 hóa đơn) ──────────────────────────────────────────────────
async function seedBills(patients: {id:string}[]) {
  const count = await prisma.bill.count();
  if (count >= 30) { console.log('✓ Bills already seeded'); return; }

  const services = [
    [{ name: 'Kham benh noi khoa', type: 'SERVICE', price: 150000, qty: 1 }, { name: 'Xet nghiem mau CBC', type: 'LAB', price: 85000, qty: 1 }],
    [{ name: 'Kham tim mach', type: 'SERVICE', price: 200000, qty: 1 }, { name: 'ECG 12 kenh', type: 'LAB', price: 85000, qty: 1 }, { name: 'Sieu am tim', type: 'SERVICE', price: 350000, qty: 1 }],
    [{ name: 'Kham ngoai khoa', type: 'SERVICE', price: 180000, qty: 1 }, { name: 'X-quang nguc', type: 'LAB', price: 120000, qty: 1 }],
    [{ name: 'Kham nhi', type: 'SERVICE', price: 120000, qty: 1 }, { name: 'Amoxicillin 500mg', type: 'MEDICINE', price: 3500, qty: 21 }],
    [{ name: 'Cap cuu', type: 'SERVICE', price: 500000, qty: 1 }, { name: 'Truyen dich NaCl 0.9%', type: 'SERVICE', price: 150000, qty: 2 }],
    [{ name: 'Kham tong quat', type: 'SERVICE', price: 250000, qty: 1 }, { name: 'Xet nghiem sinh hoa 10 chi so', type: 'LAB', price: 180000, qty: 1 }],
    [{ name: 'Phau thuat noi soi cat ruot thua', type: 'SERVICE', price: 3500000, qty: 1 }, { name: 'Gay me toan than', type: 'SERVICE', price: 800000, qty: 1 }],
    [{ name: 'Kham da lieu', type: 'SERVICE', price: 150000, qty: 1 }, { name: 'Prednisolone 5mg', type: 'MEDICINE', price: 2600, qty: 14 }],
    [{ name: 'Kham than kinh', type: 'SERVICE', price: 200000, qty: 1 }, { name: 'MRI nao 1.5T', type: 'SERVICE', price: 2500000, qty: 1 }],
    [{ name: 'Kham san dinh ky', type: 'SERVICE', price: 180000, qty: 1 }, { name: 'Sieu am thai 4D', type: 'SERVICE', price: 350000, qty: 1 }],
    [{ name: 'Noi tru khoa Noi', type: 'SERVICE', price: 300000, qty: 5 }, { name: 'Furosemide 40mg', type: 'MEDICINE', price: 1800, qty: 30 }],
    [{ name: 'Loc mau than nhan tao', type: 'SERVICE', price: 1200000, qty: 3 }, { name: 'Xet nghiem Creatinine', type: 'LAB', price: 40000, qty: 1 }],
    [{ name: 'Kham mat', type: 'SERVICE', price: 150000, qty: 1 }, { name: 'Do nhan ap', type: 'SERVICE', price: 80000, qty: 1 }],
    [{ name: 'Kham tai mui hong', type: 'SERVICE', price: 150000, qty: 1 }, { name: 'Noi soi mui', type: 'SERVICE', price: 200000, qty: 1 }],
    [{ name: 'Kham rang ham mat', type: 'SERVICE', price: 100000, qty: 1 }, { name: 'Nho rang khon', type: 'SERVICE', price: 500000, qty: 1 }],
    [{ name: 'Kham phuc hoi chuc nang', type: 'SERVICE', price: 150000, qty: 1 }, { name: 'Vat ly tri lieu 30 phut', type: 'SERVICE', price: 200000, qty: 5 }],
    [{ name: 'Kham dinh duong', type: 'SERVICE', price: 120000, qty: 1 }, { name: 'Vitamin D3 1000IU', type: 'MEDICINE', price: 4800, qty: 30 }],
    [{ name: 'Kham tam than', type: 'SERVICE', price: 200000, qty: 1 }, { name: 'Sertraline 50mg', type: 'MEDICINE', price: 8000, qty: 30 }],
    [{ name: 'Kham ung buou', type: 'SERVICE', price: 250000, qty: 1 }, { name: 'Xet nghiem CEA', type: 'LAB', price: 180000, qty: 1 }],
    [{ name: 'Kham noi tiet', type: 'SERVICE', price: 180000, qty: 1 }, { name: 'TSH, FT4', type: 'LAB', price: 200000, qty: 1 }],
    [{ name: 'Kham co xuong khop', type: 'SERVICE', price: 180000, qty: 1 }, { name: 'X-quang khop goi', type: 'LAB', price: 120000, qty: 1 }],
    [{ name: 'Kham tieu hoa', type: 'SERVICE', price: 180000, qty: 1 }, { name: 'Noi soi da day', type: 'SERVICE', price: 600000, qty: 1 }],
    [{ name: 'Kham ho hap', type: 'SERVICE', price: 180000, qty: 1 }, { name: 'Do chuc nang ho hap', type: 'SERVICE', price: 250000, qty: 1 }],
    [{ name: 'Kham than kinh ngoai bien', type: 'SERVICE', price: 200000, qty: 1 }, { name: 'Dien co do than kinh', type: 'SERVICE', price: 350000, qty: 1 }],
    [{ name: 'Kham tim mach can thiep', type: 'SERVICE', price: 300000, qty: 1 }, { name: 'Chup mach vanh CT', type: 'SERVICE', price: 3500000, qty: 1 }],
    [{ name: 'Kham nhi so sinh', type: 'SERVICE', price: 150000, qty: 1 }, { name: 'Sieu am bung', type: 'SERVICE', price: 200000, qty: 1 }],
    [{ name: 'Kham phu khoa', type: 'SERVICE', price: 180000, qty: 1 }, { name: 'Sieu am phu khoa', type: 'SERVICE', price: 250000, qty: 1 }],
    [{ name: 'Kham nam khoa', type: 'SERVICE', price: 180000, qty: 1 }, { name: 'Xet nghiem PSA', type: 'LAB', price: 150000, qty: 1 }],
    [{ name: 'Kham da lieu tham my', type: 'SERVICE', price: 200000, qty: 1 }, { name: 'Laser tri nam', type: 'SERVICE', price: 1500000, qty: 1 }],
    [{ name: 'Kham cap cuu ngoai khoa', type: 'SERVICE', price: 500000, qty: 1 }, { name: 'Phau thuat cap cuu', type: 'SERVICE', price: 5000000, qty: 1 }],
  ];
  const statuses = ['PAID','PAID','PAID','UNPAID','UNPAID','PARTIAL','PAID','UNPAID','PAID','PAID'];

  for (let i = 0; i < 30; i++) {
    const svcSet = services[i % services.length];
    const total = svcSet.reduce((s, x) => s + x.price * x.qty, 0);
    const status = statuses[i % statuses.length];
    await prisma.bill.create({ data: {
      patientId: patients[i % patients.length].id,
      totalAmount: total, finalAmount: total,
      paymentStatus: status as never,
      paymentMethod: status === 'PAID' ? (i % 2 === 0 ? 'CASH' : 'TRANSFER') : undefined,
      paidAt: status === 'PAID' ? new Date(Date.now() - i * 86400000) : undefined,
      items: { create: svcSet.map(s => ({ serviceName: s.name, serviceType: s.type, price: s.price, quantity: s.qty, total: s.price * s.qty })) },
    }});
  }
  console.log('✓ 30 Bills seeded');
}

// ─── 12. LAB ORDERS + SPECIMENS (30 phiếu xét nghiệm) ───────────────────────
async function seedLabOrders(patients: {id:string}[]) {
  const count = await prisma.labOrder.count();
  if (count >= 30) { console.log('✓ Lab orders already seeded'); return; }

  const testCodes = ['CBC','GLU','HBA1C','CHOL','CREA','ALT','AST','TSH','URIN','ECG','TRIG','HDL','LDL','UREA','XRAY'];
  const statuses = ['COMPLETED','COMPLETED','IN_PROGRESS','PENDING','COMPLETED','COMPLETED'];
  const specimenTypes = ['BLOOD','BLOOD','URINE','BLOOD','SWAB'];

  for (let i = 0; i < 30; i++) {
    const status = statuses[i % statuses.length];
    const testSlice = testCodes.slice(i % 10, (i % 10) + 2);
    const tests = await prisma.labTest.findMany({ where: { code: { in: testSlice } } });
    const order = await prisma.labOrder.create({ data: {
      patientId: patients[i % patients.length].id,
      status: status as never,
      note: `Xet nghiem dinh ky dot ${i + 1}`,
      completedAt: status === 'COMPLETED' ? new Date(Date.now() - i * 3600000) : undefined,
      items: { create: tests.map(t => ({
        testId: t.id,
        result: status === 'COMPLETED' ? (Math.random() * 5 + 1).toFixed(2) : undefined,
        isAbnormal: status === 'COMPLETED' && i % 4 === 0,
        unit: t.unit ?? undefined,
        normalRange: t.normalRange ?? undefined,
        completedAt: status === 'COMPLETED' ? new Date(Date.now() - i * 3600000) : undefined,
      }))},
    }});

    // Tạo specimen cho mỗi lab order
    const specStatus = status === 'COMPLETED' ? 'RESULTED' : status === 'IN_PROGRESS' ? 'PROCESSING' : 'COLLECTED';
    const specimen = await prisma.specimen.create({ data: {
      labOrderId: order.id,
      type: specimenTypes[i % specimenTypes.length],
      status: specStatus as never,
      collectedAt: new Date(Date.now() - i * 7200000),
      collectedBy: 'KTV Pham Van Tuan',
      receivedAt: new Date(Date.now() - i * 3600000),
      resultedAt: status === 'COMPLETED' ? new Date(Date.now() - i * 1800000) : undefined,
    }});
    // Log tracking
    await prisma.specimenLog.create({ data: { specimenId: specimen.id, status: 'COLLECTED' as never, note: 'Thu mau tai phong xet nghiem', performedBy: 'KTV Pham Van Tuan' } });
    if (specStatus !== 'COLLECTED') {
      await prisma.specimenLog.create({ data: { specimenId: specimen.id, status: 'RECEIVED' as never, note: 'Mau da nhan tai phong xet nghiem', performedBy: 'KTV Dang Thi Lan' } });
    }
  }
  console.log('✓ 30 Lab Orders + Specimens seeded');
}

// ─── 13. ENCOUNTERS + VITALS + NOTES + DIAGNOSES (30 đợt điều trị) ───────────
async function seedEncounters(patients: {id:string}[], departments: {id:string}[], beds: {id:string}[]) {
  const count = await prisma.encounter.count();
  if (count >= 30) { console.log('✓ Encounters already seeded'); return; }

  const types = ['OUTPATIENT','OUTPATIENT','INPATIENT','EMERGENCY','OUTPATIENT','DAY_SURGERY'];
  const statuses = ['DISCHARGED','DISCHARGED','IN_PROGRESS','REGISTERED','ADMITTED','DISCHARGED'];
  const complaints = [
    'Dau nguc, kho tho', 'Sot cao 39 do, ho', 'Dau bung cap', 'Chong mat, buon non',
    'Dau dau du doi', 'Kho tho khi giang suc', 'Phu chan hai ben', 'Dau khop goi',
    'Tieu nhieu lan, khat nuoc', 'Ho ra mau', 'Dau lung duoi lan chan', 'Mat ngu, lo au',
    'Buon non, non nhieu lan', 'Dau nguc trai lan vai trai', 'Sot ret run',
    'Vang da, vang mat', 'Tieu ra mau', 'Kho nuot', 'Dau bung quanh ron',
    'Yeu liet nua nguoi trai', 'Kho tho khi nam', 'Phu mat buoi sang',
    'Dau dau sau gay', 'Chay mau chan rang', 'Ngua toan than',
    'Dau khop vai phai', 'Tieu khong kiem soat', 'Nhin mo mot mat',
    'Dau bung ha vi phai', 'Sot keo dai 2 tuan',
  ];
  const icdCodes = [
    { code: 'I10', desc: 'Tang huyet ap nguyen phat', type: 'PRIMARY' },
    { code: 'E11', desc: 'Tieu duong type 2', type: 'PRIMARY' },
    { code: 'J18.9', desc: 'Viem phoi khong ro nguyen nhan', type: 'PRIMARY' },
    { code: 'K25', desc: 'Loet da day', type: 'PRIMARY' },
    { code: 'I50', desc: 'Suy tim', type: 'PRIMARY' },
    { code: 'M05', desc: 'Viem khop dang thap', type: 'PRIMARY' },
  ];

  for (let i = 0; i < 30; i++) {
    const type = types[i % types.length];
    const status = statuses[i % statuses.length];
    const admitDate = (status === 'ADMITTED' || status === 'IN_PROGRESS') ? new Date(Date.now() - i * 86400000) : undefined;
    const dischargeDate = status === 'DISCHARGED' ? new Date(Date.now() - i * 43200000) : undefined;
    const bedId = (type === 'INPATIENT' || status === 'ADMITTED') ? beds[i % beds.length]?.id : undefined;

    const enc = await prisma.encounter.create({ data: {
      patientId: patients[i % patients.length].id,
      type: type as never, status: status as never,
      departmentId: departments[i % departments.length].id,
      bedId,
      chiefComplaint: complaints[i],
      triageLevel: type === 'EMERGENCY' ? 2 : 4,
      admitDate, dischargeDate,
      dischargeNote: dischargeDate ? 'Benh nhan on dinh, cho xuat vien' : undefined,
    }});

    // Vital signs
    await prisma.vitalSign.create({ data: {
      encounterId: enc.id,
      temperature: 36.5 + (i % 5) * 0.3,
      pulse: 70 + (i % 20),
      respRate: 16 + (i % 4),
      bpSystolic: 120 + (i % 30),
      bpDiastolic: 80 + (i % 15),
      spO2: 96 + (i % 4),
      weight: 50 + (i % 30),
      height: 155 + (i % 20),
      recordedBy: 'Y ta Nguyen Thi Mai',
    }});

    // Clinical note
    await prisma.clinicalNote.create({ data: {
      encounterId: enc.id,
      type: 'PROGRESS',
      content: `Benh nhan ${complaints[i]}. Kham lam sang: ${icdCodes[i % icdCodes.length].desc}. Xu tri theo phac do.`,
      authorId: patients[0].id, // dùng patient id tạm, thực tế là userId
    }});

    // Encounter diagnosis
    const icd = icdCodes[i % icdCodes.length];
    await prisma.encounterDiagnosis.create({ data: {
      encounterId: enc.id,
      icdCode: icd.code,
      description: icd.desc,
      type: icd.type,
      confirmedAt: new Date(Date.now() - i * 3600000),
    }});
  }
  console.log('✓ 30 Encounters + Vitals + Notes + Diagnoses seeded');
}

// ─── 14. SURGERIES (30 ca phẫu thuật) ────────────────────────────────────────
async function seedSurgeries(patients: {id:string}[], doctors: {id:string}[], or: {id:string}) {
  const count = await prisma.surgery.count();
  if (count >= 30) { console.log('✓ Surgeries already seeded'); return; }

  const procedures = [
    { name: 'Cat ruot thua noi soi', anesthesia: 'Gay me toan than', preOp: 'Nhip an 8 gio, kiem tra mau', postOp: 'Theo doi 24h, khang sinh du phong' },
    { name: 'Cat tui mat noi soi', anesthesia: 'Gay me toan than', preOp: 'Sieu am xac nhan soi mat', postOp: 'Che do an it mo, tai kham 1 tuan' },
    { name: 'Phau thuat thay khop goi toan phan', anesthesia: 'Gay te tuy song', preOp: 'Vat ly tri lieu truoc mo', postOp: 'Phuc hoi chuc nang 6 tuan' },
    { name: 'Cat doan dai trang phai', anesthesia: 'Gay me toan than', preOp: 'Chuan bi ruot, khang sinh', postOp: 'Dinh duong qua ong, tap di som' },
    { name: 'Phau thuat tim ho van hai la', anesthesia: 'Gay me toan than + tim phoi nhan tao', preOp: 'Sieu am tim, chup mach vanh', postOp: 'ICU 48h, Warfarin' },
    { name: 'Noi soi cat polyp dai trang', anesthesia: 'Gay me ngan', preOp: 'Chuan bi ruot sach', postOp: 'Che do an mem 3 ngay' },
    { name: 'Phau thuat cat u tuyen giap', anesthesia: 'Gay me toan than', preOp: 'Kiem tra chuc nang tuyen giap', postOp: 'Theo doi canxi mau, Levothyroxine' },
    { name: 'Phau thuat thoat vi dia dem L4-L5', anesthesia: 'Gay me toan than', preOp: 'MRI cot song', postOp: 'Vat ly tri lieu, tranh mang vat nang' },
    { name: 'Cat u xo tu cung noi soi', anesthesia: 'Gay me toan than', preOp: 'Sieu am phu khoa', postOp: 'Nghi ngoi 2 tuan, tai kham 1 thang' },
    { name: 'Phau thuat cat than phan', anesthesia: 'Gay me toan than', preOp: 'CT scan than', postOp: 'Theo doi chuc nang than, tai kham 2 tuan' },
    { name: 'Phau thuat duc thuy tinh the', anesthesia: 'Gay te tai cho', preOp: 'Do nhan ap, sieu am mat', postOp: 'Nho mat khang sinh, tranh dung mat' },
    { name: 'Phau thuat cat amidan', anesthesia: 'Gay me toan than', preOp: 'Xet nghiem mau, dong mau', postOp: 'An mem lanh, khang sinh 7 ngay' },
    { name: 'Phau thuat tan soi than qua da', anesthesia: 'Gay me toan than', preOp: 'CT scan than, xet nghiem nuoc tieu', postOp: 'Uong nhieu nuoc, loc soi' },
    { name: 'Phau thuat cat u nao lanh tinh', anesthesia: 'Gay me toan than', preOp: 'MRI nao, danh gia than kinh', postOp: 'ICU 24h, chong phu nao' },
    { name: 'Phau thuat sinh mo', anesthesia: 'Gay te tuy song', preOp: 'Sieu am thai, CTG', postOp: 'Cho bu sua, cham soc vet mo' },
    { name: 'Phau thuat van dong mach chu bung', anesthesia: 'Gay me toan than', preOp: 'CT mach mau, danh gia tim mach', postOp: 'ICU 72h, chong dong mau' },
    { name: 'Noi soi cat u bang quang', anesthesia: 'Gay te tuy song', preOp: 'Noi soi chan doan', postOp: 'Dat ong thong tieu, theo doi mau' },
    { name: 'Phau thuat cat u vu', anesthesia: 'Gay me toan than', preOp: 'Sinh thiet, MRI vu', postOp: 'Xa tri, hoa tri bo tro' },
    { name: 'Phau thuat cat u phoi phai', anesthesia: 'Gay me toan than', preOp: 'CT nguc, do chuc nang ho hap', postOp: 'Vat ly tri lieu ho hap, tai kham 2 tuan' },
    { name: 'Phau thuat cat u gan phai', anesthesia: 'Gay me toan than', preOp: 'MRI gan, danh gia chuc nang gan', postOp: 'Theo doi men gan, dinh duong tinh mach' },
    { name: 'Phau thuat noi soi cat u da day', anesthesia: 'Gay me toan than', preOp: 'Noi soi chan doan, sinh thiet', postOp: 'Dinh duong qua ong, hoa tri bo tro' },
    { name: 'Phau thuat cat u tuyen tuy', anesthesia: 'Gay me toan than', preOp: 'CT bung, ERCP', postOp: 'ICU 48h, enzyme tuy ngoai tiet' },
    { name: 'Phau thuat thay khop hang toan phan', anesthesia: 'Gay te tuy song', preOp: 'X-quang khop hang, mat do xuong', postOp: 'Phuc hoi chuc nang 3 thang' },
    { name: 'Phau thuat cat u than kinh ngoai bien', anesthesia: 'Gay me toan than', preOp: 'MRI, sinh thiet', postOp: 'Vat ly tri lieu, theo doi tai phat' },
    { name: 'Phau thuat cat u tuyen thuong than', anesthesia: 'Gay me toan than', preOp: 'CT bung, xet nghiem noi tiet', postOp: 'Theo doi huyet ap, cortisol' },
    { name: 'Phau thuat noi soi cat u buong trung', anesthesia: 'Gay me toan than', preOp: 'Sieu am phu khoa, CA-125', postOp: 'Hoa tri bo tro, tai kham 1 thang' },
    { name: 'Phau thuat cat u tuyen nuoc bot', anesthesia: 'Gay me toan than', preOp: 'Sieu am, sinh thiet', postOp: 'Xa tri neu can, theo doi than kinh mat' },
    { name: 'Phau thuat cat u xuong', anesthesia: 'Gay me toan than', preOp: 'MRI, sinh thiet, X-quang', postOp: 'Hoa tri, phuc hoi chuc nang' },
    { name: 'Phau thuat cat u mach mau', anesthesia: 'Gay me toan than', preOp: 'Chup mach mau, sieu am Doppler', postOp: 'Chong dong mau, theo doi tuan hoan' },
    { name: 'Phau thuat cat u bao quy dau', anesthesia: 'Gay te tai cho', preOp: 'Kham lam sang', postOp: 'Cham soc vet mo, khang sinh 5 ngay' },
  ];

  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const p = procedures[i];
    const scheduledStart = new Date(now.getTime() + (i - 15) * 86400000);
    scheduledStart.setHours(8 + (i % 4), 0, 0, 0);
    const scheduledEnd = new Date(scheduledStart.getTime() + (2 + i % 4) * 3600000);
    const status = i < 10 ? 'COMPLETED' : i < 15 ? 'IN_PROGRESS' : 'SCHEDULED';
    await prisma.surgery.create({ data: {
      orId: or.id,
      patientId: patients[i % patients.length].id,
      surgeonId: doctors[i % doctors.length].id,
      scheduledStart, scheduledEnd,
      actualStart: status !== 'SCHEDULED' ? scheduledStart : undefined,
      actualEnd: status === 'COMPLETED' ? scheduledEnd : undefined,
      status,
      procedureName: p.name,
      anesthesiaType: p.anesthesia,
      preOpNote: p.preOp,
      postOpNote: status === 'COMPLETED' ? p.postOp : undefined,
      checklist: { items: ['Xac nhan benh nhan', 'Kiem tra di ung', 'Danh dau vi tri mo', 'Kiem tra thiet bi', 'Dem dung cu truoc mo'] },
    }});
  }
  console.log('✓ 30 Surgeries seeded');
}

// ─── 15. INSURANCE POLICIES + CLAIMS (30 chính sách) ─────────────────────────
async function seedInsurance(patients: {id:string}[], bills: {id:string}[]) {
  const count = await prisma.insurancePolicy.count();
  if (count >= 30) { console.log('✓ Insurance already seeded'); return; }

  const providers = ['BHYT Nha nuoc', 'Bao Viet Nhan Tho', 'Prudential', 'AIA Viet Nam', 'Manulife', 'Dai-ichi Life'];
  const plans = ['Goi co ban', 'Goi nang cao', 'Goi toan dien', 'Goi gia dinh', 'Goi VIP'];

  for (let i = 0; i < 30; i++) {
    const validFrom = new Date(2024, 0, 1);
    const validTo = new Date(2026, 11, 31);
    const policy = await prisma.insurancePolicy.create({ data: {
      patientId: patients[i % patients.length].id,
      provider: providers[i % providers.length],
      policyNo: `BH${String(100000 + i).padStart(6, '0')}`,
      planName: plans[i % plans.length],
      validFrom, validTo,
      coveragePercent: [70, 80, 85, 90, 100][i % 5],
    }});

    // Tạo claim cho 15 policy đầu
    if (i < 15 && bills[i]) {
      await prisma.insuranceClaim.create({ data: {
        billId: bills[i].id,
        provider: policy.provider,
        policyNo: policy.policyNo,
        claimAmount: 500000 + i * 100000,
        status: ['APPROVED', 'SUBMITTED', 'PAID', 'DRAFT', 'REJECTED'][i % 5],
        submittedAt: new Date(Date.now() - i * 86400000),
        paidAt: i % 5 === 2 ? new Date(Date.now() - i * 43200000) : undefined,
      }});
    }
  }
  console.log('✓ 30 Insurance Policies + Claims seeded');
}

// ─── 16. REFERRALS (30 phiếu chuyển viện) ────────────────────────────────────
async function seedReferrals(patients: {id:string}[], doctors: {id:string}[]) {
  const count = await prisma.referral.count();
  if (count >= 30) { console.log('✓ Referrals already seeded'); return; }

  const data = [
    { dept: 'Khoa Tim mach',           facility: null,          reason: 'Nghi ngo suy tim, can sieu am tim va tu van chuyen khoa', urgency: 'URGENT' },
    { dept: null,                       facility: 'BV Cho Ray',  reason: 'Ung thu dai trang can phau thuat chuyen sau', urgency: 'URGENT' },
    { dept: 'Khoa Than kinh',           facility: null,          reason: 'Dot quy nao, can dieu tri chuyen khoa', urgency: 'EMERGENCY' },
    { dept: 'Khoa Ngoai',               facility: null,          reason: 'Viem ruot thua cap, can phau thuat', urgency: 'EMERGENCY' },
    { dept: null,                       facility: 'BV Ung Buou', reason: 'Ung thu vu giai doan II, can xa tri', urgency: 'ROUTINE' },
    { dept: 'Khoa Mat',                 facility: null,          reason: 'Duc thuy tinh the, can phau thuat', urgency: 'ROUTINE' },
    { dept: null,                       facility: 'BV Nhi Dong 1', reason: 'Tre so sinh tim bam sinh, can phau thuat', urgency: 'URGENT' },
    { dept: 'Khoa Noi tiet',            facility: null,          reason: 'Tieu duong kho kiem soat, can dieu chinh phac do', urgency: 'ROUTINE' },
    { dept: null,                       facility: 'BV 115',      reason: 'Chan thuong so nao, can phau thuat than kinh', urgency: 'EMERGENCY' },
    { dept: 'Khoa Phuc hoi chuc nang',  facility: null,          reason: 'Sau dot quy, can phuc hoi chuc nang', urgency: 'ROUTINE' },
    { dept: 'Khoa Tieu hoa',            facility: null,          reason: 'Viem tuy cap, can dieu tri chuyen sau', urgency: 'URGENT' },
    { dept: null,                       facility: 'BV Pham Ngoc Thach', reason: 'Lao phoi, can dieu tri chuyen khoa', urgency: 'ROUTINE' },
    { dept: 'Khoa Huyet hoc',           facility: null,          reason: 'Thieu mau tan mau, can dieu tri chuyen khoa', urgency: 'URGENT' },
    { dept: null,                       facility: 'BV Ung Buou', reason: 'Ung thu phoi giai doan III, can xa hoa tri', urgency: 'URGENT' },
    { dept: 'Khoa Than',                facility: null,          reason: 'Suy than cap, can loc mau khan cap', urgency: 'EMERGENCY' },
    { dept: 'Khoa Noi tiet',            facility: null,          reason: 'Suy tuyen thuong than, can dieu tri chuyen khoa', urgency: 'URGENT' },
    { dept: null,                       facility: 'BV Rang Ham Mat', reason: 'U xuong ham, can phau thuat chuyen sau', urgency: 'ROUTINE' },
    { dept: 'Khoa Tam than',            facility: null,          reason: 'Tram cam nang, co y dinh tu tu', urgency: 'EMERGENCY' },
    { dept: null,                       facility: 'BV Mat TP.HCM', reason: 'Bong mat do hoa chat, can dieu tri khan cap', urgency: 'EMERGENCY' },
    { dept: 'Khoa Co Xuong Khop',       facility: null,          reason: 'Viem khop dang thap nang, can dieu tri sinh hoc', urgency: 'ROUTINE' },
    { dept: null,                       facility: 'BV Cho Ray',  reason: 'Phau thuat tim ho van dong mach chu', urgency: 'URGENT' },
    { dept: 'Khoa Ngoai Than Kinh',     facility: null,          reason: 'U nao lanh tinh, can phau thuat', urgency: 'ROUTINE' },
    { dept: null,                       facility: 'BV Nhi Dong 2', reason: 'Tre bi bong do nuoc soi, can dieu tri bong', urgency: 'EMERGENCY' },
    { dept: 'Khoa Ung Buou',            facility: null,          reason: 'Ung thu da giai doan II, can xa tri', urgency: 'ROUTINE' },
    { dept: null,                       facility: 'BV Hung Vuong', reason: 'Thai nghen ngoai tu cung, can phau thuat khan cap', urgency: 'EMERGENCY' },
    { dept: 'Khoa Noi Tiet',            facility: null,          reason: 'Basedow kho kiem soat, can dieu tri I-131', urgency: 'ROUTINE' },
    { dept: null,                       facility: 'BV Cho Ray',  reason: 'Viem gan B cap nang, can dieu tri tich cuc', urgency: 'URGENT' },
    { dept: 'Khoa Phau Thuat Mach Mau', facility: null,          reason: 'Phinh dong mach chu bung, can phau thuat', urgency: 'URGENT' },
    { dept: null,                       facility: 'BV Ung Buou', reason: 'Ung thu co tu cung giai doan IB, can xa hoa tri', urgency: 'ROUTINE' },
    { dept: 'Khoa Nhi',                 facility: null,          reason: 'Tre bi viem nao, can dieu tri chuyen khoa', urgency: 'EMERGENCY' },
  ];

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    await prisma.referral.create({ data: {
      patientId: patients[i % patients.length].id,
      fromDoctorId: doctors[i % doctors.length].id,
      toDepartment: d.dept ?? undefined,
      toFacility: d.facility ?? undefined,
      reason: d.reason, urgency: d.urgency,
      status: ['PENDING', 'ACCEPTED', 'COMPLETED', 'DECLINED', 'PENDING'][i % 5],
    }});
  }
  console.log('✓ 30 Referrals seeded');
}

// ─── 17. TELEMEDICINE (30 cuộc khám từ xa) ───────────────────────────────────
async function seedTelemedicine(patients: {id:string}[], doctors: {id:string}[]) {
  const count = await prisma.teleConsult.count();
  if (count >= 30) { console.log('✓ Telemedicine already seeded'); return; }

  const notes = [
    'Tu van ket qua xet nghiem dinh ky', 'Kham theo doi sau xuat vien',
    'Tu van dieu tri tang huyet ap', 'Kham nhi tu xa cho tre em vung sau',
    'Tu van dinh duong cho benh nhan tieu duong', 'Kham theo doi sau phau thuat',
    'Tu van tam ly cho benh nhan ung thu', 'Kham cap cuu tu xa',
    'Tu van thuoc cho benh nhan cao tuoi', 'Kham dinh ky benh man tinh',
    'Tu van ve che do an uong', 'Kham theo doi sau dieu tri khang sinh',
    'Tu van ve tap phuc hoi chuc nang', 'Kham kiem tra ket qua dieu tri',
    'Tu van ve bien phap phong ngua benh',
  ];

  for (let i = 0; i < 30; i++) {
    const scheduledAt = new Date(Date.now() + (i - 15) * 86400000);
    scheduledAt.setHours(8 + (i % 10), 0, 0, 0);
    const status = i < 10 ? 'COMPLETED' : i < 15 ? 'IN_PROGRESS' : 'SCHEDULED';
    await prisma.teleConsult.create({ data: {
      patientId: patients[i % patients.length].id,
      doctorId: doctors[i % doctors.length].id,
      scheduledAt,
      note: notes[i % notes.length],
      status,
      startedAt: status !== 'SCHEDULED' ? scheduledAt : undefined,
      endedAt: status === 'COMPLETED' ? new Date(scheduledAt.getTime() + 1800000) : undefined,
      roomUrl: `https://meet.hms.vn/room/${Math.random().toString(36).slice(2, 8)}`,
    }});
  }
  console.log('✓ 30 TeleConsults seeded');
}

// ─── 18. CONSENT FORMS (30 phiếu đồng ý) ────────────────────────────────────
async function seedConsent(patients: {id:string}[]) {
  const count = await prisma.consentForm.count();
  if (count >= 30) { console.log('✓ Consent forms already seeded'); return; }

  const forms = [
    { type: 'GENERAL',    content: 'Toi dong y cho phep benh vien thuc hien cac thu thuat kham chua benh can thiet theo chi dinh cua bac si.' },
    { type: 'SURGERY',    content: 'Toi da duoc giai thich day du ve quy trinh phau thuat cat ruot thua noi soi, cac rui ro co the xay ra va dong y thuc hien phau thuat.' },
    { type: 'ANESTHESIA', content: 'Toi dong y su dung gay me toan than trong qua trinh phau thuat va da duoc tu van ve cac rui ro lien quan.' },
    { type: 'RESEARCH',   content: 'Toi tu nguyen tham gia nghien cuu lam sang ve hieu qua dieu tri tang huyet ap bang thuoc moi.' },
    { type: 'SURGERY',    content: 'Toi dong y phau thuat noi soi cat tui mat va hieu ro cac bien chung co the gap phai.' },
    { type: 'GENERAL',    content: 'Toi cho phep su dung thong tin y te cua minh cho muc dich nghien cuu khoa hoc (da an danh).' },
    { type: 'ANESTHESIA', content: 'Toi dong y gay te tuy song cho ca mo sinh thuong va da duoc tu van ky.' },
    { type: 'SURGERY',    content: 'Toi dong y phau thuat thay khop goi va da duoc giai thich quy trinh phuc hoi sau mo.' },
    { type: 'GENERAL',    content: 'Toi dong y truyen mau va cac san pham mau neu can thiet trong qua trinh dieu tri.' },
    { type: 'RESEARCH',   content: 'Toi tham gia thu nghiem lam sang giai doan III thuoc dieu tri tieu duong type 2.' },
    { type: 'SURGERY',    content: 'Toi dong y phau thuat cat u tuyen giap va hieu ro nguy co ton thuong day than kinh quan am.' },
    { type: 'GENERAL',    content: 'Toi dong y chup X-quang va cac xet nghiem chan doan hinh anh can thiet.' },
    { type: 'SURGERY',    content: 'Toi dong y phau thuat cat u nao va da duoc giai thich day du ve rui ro.' },
    { type: 'ANESTHESIA', content: 'Toi dong y gay te ngoai mang cung va da duoc tu van ve cac bien chung co the.' },
    { type: 'RESEARCH',   content: 'Toi tham gia nghien cuu ve hieu qua cua lieu phap te bao goc trong dieu tri suy tim.' },
    { type: 'SURGERY',    content: 'Toi dong y phau thuat thay van tim va hieu ro can dung thuoc chong dong mau lau dai.' },
    { type: 'GENERAL',    content: 'Toi dong y noi soi da day va ruot gia va hieu ro quy trinh.' },
    { type: 'SURGERY',    content: 'Toi dong y phau thuat cat u phoi va da duoc giai thich ve chuc nang ho hap sau mo.' },
    { type: 'ANESTHESIA', content: 'Toi dong y gay me toan than cho phau thuat bung va da duoc danh gia truoc gay me.' },
    { type: 'RESEARCH',   content: 'Toi tham gia nghien cuu ve vaccine phong ung thu co tu cung.' },
    { type: 'SURGERY',    content: 'Toi dong y phau thuat cat u gan va hieu ro rui ro suy gan sau mo.' },
    { type: 'GENERAL',    content: 'Toi dong y dieu tri hoa chat va hieu ro cac tac dung phu co the gap.' },
    { type: 'SURGERY',    content: 'Toi dong y phau thuat cat u tuyen tuy va hieu ro day la phau thuat phuc tap.' },
    { type: 'ANESTHESIA', content: 'Toi dong y gay me cho phau thuat tim ho va da duoc giai thich ve may tim phoi nhan tao.' },
    { type: 'RESEARCH',   content: 'Toi tham gia nghien cuu ve hieu qua cua thuoc moi trong dieu tri viem khop dang thap.' },
    { type: 'SURGERY',    content: 'Toi dong y phau thuat cat u buong trung va hieu ro co the anh huong den kha nang sinh san.' },
    { type: 'GENERAL',    content: 'Toi dong y xa tri va hieu ro cac tac dung phu nhu met moi, buon non.' },
    { type: 'SURGERY',    content: 'Toi dong y phau thuat cat u vu va da duoc tu van ve tai tao vu sau mo.' },
    { type: 'ANESTHESIA', content: 'Toi dong y gay te tai cho cho phau thuat mat va da duoc giai thich quy trinh.' },
    { type: 'RESEARCH',   content: 'Toi tham gia nghien cuu ve hieu qua cua lieu phap mien dich trong dieu tri ung thu phoi.' },
  ];

  for (let i = 0; i < forms.length; i++) {
    const signed = i < 22;
    await prisma.consentForm.create({ data: {
      patientId: patients[i % patients.length].id,
      type: forms[i].type,
      content: forms[i].content,
      signedAt: signed ? new Date(Date.now() - i * 86400000) : undefined,
      signedBy: signed ? `BN ${patients[i % patients.length].id.slice(0, 8)}` : undefined,
    }});
  }
  console.log('✓ 30 Consent Forms seeded');
}

// ─── 19. SUPPLIERS & PURCHASE ORDERS (30 đơn hàng) ───────────────────────────
async function seedProcurement() {
  const count = await prisma.supplier.count();
  if (count >= 5) { console.log('✓ Procurement already seeded'); return; }

  const suppliers = [
    { code: 'SUP001', name: 'Cong ty TNHH Duoc pham Mekophar',    contactName: 'Nguyen Van A', phone: '028-38291234', email: 'order@mekophar.com' },
    { code: 'SUP002', name: 'DHG Pharma',                          contactName: 'Tran Thi B',   phone: '0292-3891234', email: 'sales@dhgpharma.com' },
    { code: 'SUP003', name: 'Cong ty Thiet bi Y te Viet Duc',      contactName: 'Le Van C',     phone: '024-38291234', email: 'info@vietduc-med.com' },
    { code: 'SUP004', name: 'Stada Viet Nam',                      contactName: 'Pham Thi D',   phone: '028-38561234', email: 'order@stada.vn' },
    { code: 'SUP005', name: 'Cong ty CP Vat tu Y te TP.HCM',       contactName: 'Hoang Van E',  phone: '028-38451234', email: 'sales@medisupply.vn' },
    { code: 'SUP006', name: 'Pfizer Viet Nam',                     contactName: 'Smith John',   phone: '028-38881234', email: 'vn@pfizer.com' },
  ];

  const orderItems = [
    [{ itemName: 'Amoxicillin 500mg x 1000v', quantity: 10, unitPrice: 3200000, total: 32000000 }, { itemName: 'Paracetamol 500mg x 1000v', quantity: 20, unitPrice: 1100000, total: 22000000 }],
    [{ itemName: 'Metformin 850mg x 500v', quantity: 15, unitPrice: 1300000, total: 19500000 }, { itemName: 'Amlodipine 5mg x 500v', quantity: 10, unitPrice: 2000000, total: 20000000 }],
    [{ itemName: 'May do huyet ap Omron', quantity: 5, unitPrice: 1500000, total: 7500000 }, { itemName: 'Nhiet ke dien tu', quantity: 20, unitPrice: 250000, total: 5000000 }],
    [{ itemName: 'Omeprazole 20mg x 500v', quantity: 12, unitPrice: 1500000, total: 18000000 }, { itemName: 'Ciprofloxacin 500mg x 500v', quantity: 8, unitPrice: 3200000, total: 25600000 }],
    [{ itemName: 'Gang tay y te hop 100 cai', quantity: 100, unitPrice: 85000, total: 8500000 }, { itemName: 'Kim tiem 5ml x 100 cai', quantity: 50, unitPrice: 45000, total: 2250000 }],
  ];

  for (let s = 0; s < suppliers.length; s++) {
    const sup = await prisma.supplier.upsert({ where: { code: suppliers[s].code }, update: {}, create: suppliers[s] });
    const items = orderItems[s % orderItems.length];
    const total = items.reduce((acc, x) => acc + x.total, 0);
    // 2 đơn hàng mỗi nhà cung cấp
    for (let i = 0; i < 2; i++) {
      await prisma.purchaseOrder.create({ data: {
        supplierId: sup.id, totalAmount: total,
        status: i === 0 ? 'RECEIVED' : 'SENT',
        receivedAt: i === 0 ? new Date(Date.now() - s * 86400000) : undefined,
        items: { create: items.map(it => ({ ...it, received: i === 0 ? it.quantity : 0 })) },
      }});
    }
  }
  console.log('✓ Suppliers & Purchase Orders seeded');
}

// ─── 20. EQUIPMENT (30 thiết bị) ─────────────────────────────────────────────
async function seedEquipment() {
  const count = await prisma.equipment.count();
  if (count >= 30) { console.log('✓ Equipment already seeded'); return; }

  const items = [
    { code: 'EQ001', name: 'May sieu am Philips EPIQ 7',          cat: 'Chan doan hinh anh', loc: 'Phong sieu am 1',   status: 'ACTIVE' },
    { code: 'EQ002', name: 'May X-quang Siemens Ysio Max',        cat: 'Chan doan hinh anh', loc: 'Phong X-quang',     status: 'ACTIVE' },
    { code: 'EQ003', name: 'May MRI GE Signa 1.5T',               cat: 'Chan doan hinh anh', loc: 'Phong MRI',         status: 'ACTIVE' },
    { code: 'EQ004', name: 'May tho ICU Drager Evita',            cat: 'Hoi suc',            loc: 'ICU',               status: 'ACTIVE' },
    { code: 'EQ005', name: 'May theo doi benh nhan Mindray',      cat: 'Theo doi',           loc: 'ICU',               status: 'ACTIVE' },
    { code: 'EQ006', name: 'May phan tich mau Sysmex XN-1000',    cat: 'Xet nghiem',         loc: 'Phong xet nghiem',  status: 'ACTIVE' },
    { code: 'EQ007', name: 'May ECG 12 kenh Nihon Kohden',        cat: 'Tim mach',           loc: 'Phong kham tim',    status: 'ACTIVE' },
    { code: 'EQ008', name: 'May noi soi da day Olympus GIF-H290', cat: 'Noi soi',            loc: 'Phong noi soi',     status: 'MAINTENANCE' },
    { code: 'EQ009', name: 'May phau thuat noi soi Karl Storz',   cat: 'Phau thuat',         loc: 'Phong mo 1',        status: 'ACTIVE' },
    { code: 'EQ010', name: 'May loc mau than Fresenius 5008',     cat: 'Than nhan tao',      loc: 'Phong than',        status: 'ACTIVE' },
    { code: 'EQ011', name: 'May CT Scan Siemens SOMATOM',         cat: 'Chan doan hinh anh', loc: 'Phong CT',          status: 'ACTIVE' },
    { code: 'EQ012', name: 'May sieu am tim Philips IE33',        cat: 'Tim mach',           loc: 'Phong sieu am tim', status: 'ACTIVE' },
    { code: 'EQ013', name: 'May do loang xuong Hologic',          cat: 'Co xuong khop',      loc: 'Phong DEXA',        status: 'ACTIVE' },
    { code: 'EQ014', name: 'May do chuc nang ho hap Jaeger',      cat: 'Ho hap',             loc: 'Phong ho hap',      status: 'ACTIVE' },
    { code: 'EQ015', name: 'May dien nao do Nihon Kohden',        cat: 'Than kinh',          loc: 'Phong than kinh',   status: 'ACTIVE' },
    { code: 'EQ016', name: 'May xa tri Varian TrueBeam',          cat: 'Ung buou',           loc: 'Phong xa tri',      status: 'ACTIVE' },
    { code: 'EQ017', name: 'May PET-CT Siemens Biograph',        cat: 'Chan doan hinh anh', loc: 'Phong PET-CT',      status: 'ACTIVE' },
    { code: 'EQ018', name: 'May noi soi ruot Olympus CF-HQ190',   cat: 'Noi soi',            loc: 'Phong noi soi',     status: 'ACTIVE' },
    { code: 'EQ019', name: 'May phau thuat Robot Da Vinci',       cat: 'Phau thuat',         loc: 'Phong mo 2',        status: 'ACTIVE' },
    { code: 'EQ020', name: 'May tho cao tan Drager Babylog',      cat: 'Hoi suc Nhi',        loc: 'ICU Nhi',           status: 'ACTIVE' },
    { code: 'EQ021', name: 'May sieu am Nhi GE Voluson',          cat: 'Chan doan hinh anh', loc: 'Phong sieu am Nhi', status: 'ACTIVE' },
    { code: 'EQ022', name: 'May do nhan ap Topcon',               cat: 'Mat',                loc: 'Phong kham mat',    status: 'ACTIVE' },
    { code: 'EQ023', name: 'May noi soi tai mui hong Storz',      cat: 'Tai mui hong',       loc: 'Phong TMH',         status: 'ACTIVE' },
    { code: 'EQ024', name: 'May chup rang toan canh Planmeca',    cat: 'Rang ham mat',       loc: 'Phong RHM',         status: 'ACTIVE' },
    { code: 'EQ025', name: 'May dien tim thai Philips',           cat: 'San khoa',           loc: 'Phong san',         status: 'ACTIVE' },
    { code: 'EQ026', name: 'May sinh hoa Roche Cobas 6000',       cat: 'Xet nghiem',         loc: 'Phong sinh hoa',    status: 'ACTIVE' },
    { code: 'EQ027', name: 'May mien dich Roche Elecsys',         cat: 'Xet nghiem',         loc: 'Phong mien dich',   status: 'ACTIVE' },
    { code: 'EQ028', name: 'May vi sinh Vitek 2',                 cat: 'Xet nghiem',         loc: 'Phong vi sinh',     status: 'MAINTENANCE' },
    { code: 'EQ029', name: 'May dong mau Stago STA-R Max',        cat: 'Xet nghiem',         loc: 'Phong dong mau',    status: 'ACTIVE' },
    { code: 'EQ030', name: 'May nuoc tieu Sysmex UF-5000',        cat: 'Xet nghiem',         loc: 'Phong nuoc tieu',   status: 'ACTIVE' },
  ];

  for (const eq of items) {
    await prisma.equipment.upsert({ where: { code: eq.code }, update: {}, create: {
      code: eq.code, name: eq.name, category: eq.cat, location: eq.loc, status: eq.status,
      purchaseDate: new Date(2021, Math.floor(Math.random() * 12), 1),
      warrantyEnd: new Date(2027, Math.floor(Math.random() * 12), 1),
      lastService: new Date(2025, 10, 1),
      nextService: new Date(2026, 4, 1),
    }});
  }
  console.log('✓ 30 Equipment seeded');
}

// ─── 21. INVENTORY (30 vật tư) ───────────────────────────────────────────────
async function seedInventory() {
  const count = await prisma.inventoryItem.count();
  if (count >= 30) { console.log('✓ Inventory already seeded'); return; }

  const items = [
    { code: 'INV001', name: 'Gang tay y te (hop 100 cai)',       cat: 'Vat tu tieu hao',    qty: 500,  unit: 'hop',  min: 50,  loc: 'Kho A' },
    { code: 'INV002', name: 'Kim tiem 5ml',                      cat: 'Vat tu tieu hao',    qty: 2000, unit: 'cai',  min: 200, loc: 'Kho A' },
    { code: 'INV003', name: 'Bong gac vo trung',                 cat: 'Vat tu tieu hao',    qty: 300,  unit: 'goi',  min: 30,  loc: 'Kho A' },
    { code: 'INV004', name: 'Ong tiem truyen IV',                cat: 'Vat tu tieu hao',    qty: 1000, unit: 'cai',  min: 100, loc: 'Kho B' },
    { code: 'INV005', name: 'Khau trang y te (hop 50 cai)',      cat: 'Vat tu tieu hao',    qty: 200,  unit: 'hop',  min: 20,  loc: 'Kho B' },
    { code: 'INV006', name: 'Nuoc muoi sinh ly 0.9% 500ml',      cat: 'Dich truyen',        qty: 800,  unit: 'chai', min: 80,  loc: 'Kho C' },
    { code: 'INV007', name: 'Dich truyen Glucose 5% 500ml',      cat: 'Dich truyen',        qty: 600,  unit: 'chai', min: 60,  loc: 'Kho C' },
    { code: 'INV008', name: 'Oxy y te (binh 40L)',               cat: 'Khi y te',           qty: 50,   unit: 'binh', min: 10,  loc: 'Kho D' },
    { code: 'INV009', name: 'Dao mo so 22',                      cat: 'Dung cu phau thuat', qty: 200,  unit: 'cai',  min: 20,  loc: 'Kho E' },
    { code: 'INV010', name: 'Chi khau Vicryl 2-0',               cat: 'Dung cu phau thuat', qty: 150,  unit: 'hop',  min: 15,  loc: 'Kho E' },
    { code: 'INV011', name: 'Ong noi khi quan co bong',          cat: 'Vat tu tieu hao',    qty: 100,  unit: 'cai',  min: 10,  loc: 'Kho B' },
    { code: 'INV012', name: 'Ong thong tieu Foley 16Fr',         cat: 'Vat tu tieu hao',    qty: 200,  unit: 'cai',  min: 20,  loc: 'Kho B' },
    { code: 'INV013', name: 'Ong hut dam Yankauer',              cat: 'Vat tu tieu hao',    qty: 150,  unit: 'cai',  min: 15,  loc: 'Kho B' },
    { code: 'INV014', name: 'Dich truyen Ringer Lactate 500ml',  cat: 'Dich truyen',        qty: 500,  unit: 'chai', min: 50,  loc: 'Kho C' },
    { code: 'INV015', name: 'Dich truyen Albumin 20% 100ml',     cat: 'Dich truyen',        qty: 80,   unit: 'chai', min: 10,  loc: 'Kho C' },
    { code: 'INV016', name: 'Bom tiem dien Braun',               cat: 'Thiet bi ho tro',    qty: 20,   unit: 'cai',  min: 5,   loc: 'Kho F' },
    { code: 'INV017', name: 'May do SpO2 cam tay',               cat: 'Thiet bi ho tro',    qty: 30,   unit: 'cai',  min: 5,   loc: 'Kho F' },
    { code: 'INV018', name: 'Nhiet ke dien tu',                  cat: 'Thiet bi ho tro',    qty: 50,   unit: 'cai',  min: 10,  loc: 'Kho F' },
    { code: 'INV019', name: 'Ong nghiem EDTA 3ml',               cat: 'Vat tu xet nghiem',  qty: 5000, unit: 'cai',  min: 500, loc: 'Kho G' },
    { code: 'INV020', name: 'Ong nghiem sinh hoa 5ml',           cat: 'Vat tu xet nghiem',  qty: 3000, unit: 'cai',  min: 300, loc: 'Kho G' },
    { code: 'INV021', name: 'Que thu nuoc tieu 10 thong so',     cat: 'Vat tu xet nghiem',  qty: 1000, unit: 'cai',  min: 100, loc: 'Kho G' },
    { code: 'INV022', name: 'Bao tay phau thuat vo trung',       cat: 'Dung cu phau thuat', qty: 500,  unit: 'doi',  min: 50,  loc: 'Kho E' },
    { code: 'INV023', name: 'Ao phau thuat vo trung',            cat: 'Dung cu phau thuat', qty: 200,  unit: 'cai',  min: 20,  loc: 'Kho E' },
    { code: 'INV024', name: 'Kep phau thuat Kelly',              cat: 'Dung cu phau thuat', qty: 50,   unit: 'cai',  min: 5,   loc: 'Kho E' },
    { code: 'INV025', name: 'Keo phau thuat Mayo',               cat: 'Dung cu phau thuat', qty: 30,   unit: 'cai',  min: 5,   loc: 'Kho E' },
    { code: 'INV026', name: 'Dung dich sat khuan Betadine',      cat: 'Vat tu tieu hao',    qty: 200,  unit: 'chai', min: 20,  loc: 'Kho A' },
    { code: 'INV027', name: 'Cong sat khuan tay Sterillium',     cat: 'Vat tu tieu hao',    qty: 100,  unit: 'chai', min: 10,  loc: 'Kho A' },
    { code: 'INV028', name: 'Giuong benh nhan dieu chinh dien',  cat: 'Thiet bi phong benh',qty: 10,   unit: 'cai',  min: 2,   loc: 'Kho H' },
    { code: 'INV029', name: 'Xe lan benh nhan',                  cat: 'Thiet bi ho tro',    qty: 15,   unit: 'cai',  min: 3,   loc: 'Kho H' },
    { code: 'INV030', name: 'Nang benh nhan',                    cat: 'Thiet bi ho tro',    qty: 8,    unit: 'cai',  min: 2,   loc: 'Kho H' },
  ];

  for (const item of items) {
    await prisma.inventoryItem.upsert({ where: { code: item.code }, update: {}, create: {
      code: item.code, name: item.name, category: item.cat, quantity: item.qty,
      unit: item.unit, minQuantity: item.min, location: item.loc,
    }});
  }
  console.log('✓ 30 Inventory Items seeded');
}

// ─── 22. PERMISSIONS ─────────────────────────────────────────────────────────
async function seedPermissions() {
  const count = await prisma.permission.count();
  if (count >= 10) { console.log('✓ Permissions already seeded'); return; }

  const perms = [
    { key: 'patient.view',       name: 'Xem benh nhan',           resource: 'Patient',    action: 'READ' },
    { key: 'patient.create',     name: 'Tao benh nhan',           resource: 'Patient',    action: 'CREATE' },
    { key: 'patient.update',     name: 'Cap nhat benh nhan',      resource: 'Patient',    action: 'UPDATE' },
    { key: 'appointment.view',   name: 'Xem lich kham',           resource: 'Appointment',action: 'READ' },
    { key: 'appointment.create', name: 'Tao lich kham',           resource: 'Appointment',action: 'CREATE' },
    { key: 'bill.view',          name: 'Xem hoa don',             resource: 'Bill',       action: 'READ' },
    { key: 'bill.create',        name: 'Tao hoa don',             resource: 'Bill',       action: 'CREATE' },
    { key: 'medicine.view',      name: 'Xem thuoc',               resource: 'Medicine',   action: 'READ' },
    { key: 'medicine.manage',    name: 'Quan ly thuoc',           resource: 'Medicine',   action: 'MANAGE' },
    { key: 'lab.view',           name: 'Xem xet nghiem',          resource: 'LabOrder',   action: 'READ' },
    { key: 'lab.create',         name: 'Tao phieu xet nghiem',    resource: 'LabOrder',   action: 'CREATE' },
    { key: 'encounter.view',     name: 'Xem dot dieu tri',        resource: 'Encounter',  action: 'READ' },
    { key: 'encounter.create',   name: 'Tao dot dieu tri',        resource: 'Encounter',  action: 'CREATE' },
    { key: 'surgery.view',       name: 'Xem lich phau thuat',     resource: 'Surgery',    action: 'READ' },
    { key: 'surgery.create',     name: 'Len lich phau thuat',     resource: 'Surgery',    action: 'CREATE' },
    { key: 'admin.all',          name: 'Toan quyen admin',        resource: '*',          action: '*' },
  ];

  for (const perm of perms) {
    await prisma.permission.upsert({ where: { key: perm.key }, update: {}, create: perm });
  }
  console.log('✓ Permissions seeded');
}

// ─── 23. NOTIFICATIONS (30 thông báo) ────────────────────────────────────────
async function seedNotifications() {
  const count = await prisma.notification.count();
  if (count >= 30) { console.log('✓ Notifications already seeded'); return; }

  const notifs = [
    { title: 'Lich kham moi', message: 'BN Nguyen Thi Hoa co lich kham luc 9:00 sang mai', type: 'INFO' },
    { title: 'Ket qua xet nghiem', message: 'Ket qua xet nghiem mau cua BN Tran Van Minh da co', type: 'SUCCESS' },
    { title: 'Canh bao ton kho', message: 'Thuoc Insulin Glargine sap het hang (con 8 lo)', type: 'WARNING' },
    { title: 'Hoa don qua han', message: 'Hoa don BN Le Thi Thu chua thanh toan qua 7 ngay', type: 'WARNING' },
    { title: 'Phau thuat hom nay', message: 'Ca phau thuat noi soi BN Pham Van Hung luc 14:00', type: 'INFO' },
    { title: 'Benh nhan nhap vien', message: 'BN Hoang Van Nam nhap khoa Tim mach, giuong B2', type: 'INFO' },
    { title: 'Ket qua bat thuong', message: 'Ket qua ECG BN Vo Minh Tuan co bat thuong, can xem lai', type: 'ERROR' },
    { title: 'Bao tri thiet bi', message: 'May noi soi da day dang bao tri, du kien hoan thanh 17:00', type: 'WARNING' },
    { title: 'Phieu chuyen vien', message: 'BN Dang Thi Bich da duoc chap nhan chuyen vien BV Cho Ray', type: 'SUCCESS' },
    { title: 'Lich kham tu xa', message: 'Cuoc kham tu xa voi BS. Nguyen Van An luc 10:30 hom nay', type: 'INFO' },
    { title: 'Xuat vien', message: 'BN Bui Van Long du dieu kien xuat vien hom nay', type: 'SUCCESS' },
    { title: 'Nhac nho tai kham', message: 'BN Do Thi Phuong co lich tai kham sau 2 tuan', type: 'INFO' },
    { title: 'Canh bao di ung', message: 'BN Nguyen Van Duc co tien su di ung Penicillin - can chu y', type: 'ERROR' },
    { title: 'Don thuoc moi', message: 'Don thuoc cua BN Tran Thi Nga da duoc duyet', type: 'SUCCESS' },
    { title: 'Ket qua sinh thiet', message: 'Ket qua sinh thiet cua BN Le Van Thanh da co tai phong xet nghiem', type: 'INFO' },
    { title: 'Canh bao huyet ap', message: 'BN Pham Van Hung: HA 180/110 mmHg - can xu tri khan cap', type: 'ERROR' },
    { title: 'Lich phau thuat thay doi', message: 'Ca mo cua BN Hoang Thi Lan doi sang 15:00 do phong mo ban', type: 'WARNING' },
    { title: 'Thanh toan thanh cong', message: 'Hoa don BN Vo Minh Tuan da duoc thanh toan day du', type: 'SUCCESS' },
    { title: 'Mau xet nghiem bi tu choi', message: 'Mau xet nghiem BN Dang Thi Bich bi tu choi do vo mau', type: 'ERROR' },
    { title: 'Lich tiem vaccine', message: 'Tre BN Bui Thi Thuy den lich tiem vaccine thang nay', type: 'INFO' },
    { title: 'Canh bao duong huyet', message: 'BN Do Van Khanh: Duong huyet 18.5 mmol/L - can xu tri', type: 'ERROR' },
    { title: 'Bao cao hang thang', message: 'Bao cao hoat dong thang 3/2026 da san sang', type: 'INFO' },
    { title: 'Thiet bi can bao tri', message: 'May loc mau than Fresenius 5008 den lich bao tri dinh ky', type: 'WARNING' },
    { title: 'Benh nhan cap cuu', message: 'BN Nguyen Van Phong nhap cap cuu luc 02:30 - nhoi mau co tim', type: 'ERROR' },
    { title: 'Don hang nhan duoc', message: 'Don hang SUP001 da nhan du - 10 thung Amoxicillin', type: 'SUCCESS' },
    { title: 'Lich hoi chan', message: 'Hoi chan lien khoa BN Le Minh Khoa luc 14:00 phong hop A', type: 'INFO' },
    { title: 'Ket qua HbA1c', message: 'HbA1c cua BN Tran Van Minh: 9.2% - can dieu chinh phac do', type: 'WARNING' },
    { title: 'Phong mo san sang', message: 'Phong mo 1 da duoc khu trung, san sang cho ca mo 14:00', type: 'SUCCESS' },
    { title: 'Canh bao tuong tac thuoc', message: 'Kiem tra don thuoc BN Hoang Van Nam: Warfarin + Aspirin', type: 'WARNING' },
    { title: 'Xet nghiem khan cap', message: 'Ket qua xet nghiem khan cap BN Tran Thi Cam da co', type: 'INFO' },
  ];

  for (const n of notifs) {
    await prisma.notification.create({ data: n });
  }
  console.log('✓ 30 Notifications seeded');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting seed...\n');

  const doctors = await seedUsers();
  await seedStaff();
  const patients = await seedPatients();
  const medicines = await seedMedicines();
  await seedLabTests();
  const { beds, wards, or } = await seedLocation();
  const departments = await seedDepartments();
  await seedDoctorAssignments(doctors, wards, departments);
  await seedAppointments(patients, doctors);
  await seedMedicalRecords(patients, doctors, medicines);
  const bills = await prisma.bill.findMany();
  await seedBills(patients);
  const allBills = await prisma.bill.findMany();
  await seedLabOrders(patients);
  await seedEncounters(patients, departments, beds);
  await seedSurgeries(patients, doctors, or);
  await seedInsurance(patients, allBills);
  await seedReferrals(patients, doctors);
  await seedTelemedicine(patients, doctors);
  await seedConsent(patients);
  await seedProcurement();
  await seedEquipment();
  await seedInventory();
  await seedPermissions();
  await seedNotifications();

  console.log('\n✅ Seed completed successfully!');
  console.log('📊 Summary:');
  console.log(`   - ${await prisma.patient.count()} Patients`);
  console.log(`   - ${await prisma.doctor.count()} Doctors`);
  console.log(`   - ${await prisma.staff.count()} Staff`);
  console.log(`   - ${await prisma.appointment.count()} Appointments`);
  console.log(`   - ${await prisma.medicalRecord.count()} Medical Records`);
  console.log(`   - ${await prisma.bill.count()} Bills`);
  console.log(`   - ${await prisma.labOrder.count()} Lab Orders`);
  console.log(`   - ${await prisma.encounter.count()} Encounters`);
  console.log(`   - ${await prisma.surgery.count()} Surgeries`);
  console.log(`   - ${await prisma.insurancePolicy.count()} Insurance Policies`);
  console.log(`   - ${await prisma.referral.count()} Referrals`);
  console.log(`   - ${await prisma.teleConsult.count()} TeleConsults`);
  console.log(`   - ${await prisma.consentForm.count()} Consent Forms`);
  console.log(`   - ${await prisma.medicine.count()} Medicines`);
  console.log(`   - ${await prisma.equipment.count()} Equipment`);
  console.log(`   - ${await prisma.inventoryItem.count()} Inventory Items`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
