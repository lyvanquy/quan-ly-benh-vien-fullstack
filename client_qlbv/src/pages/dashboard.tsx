import { useState, useRef } from 'react';
import { useQuery } from 'react-query';
import Layout from '@/components/Layout';
import api from '@/lib/axios';
import Link from 'next/link';
import {
  Users, CalendarDays, DollarSign, UserRound, Clock,
  BedDouble, Activity, FlaskConical, Package, Scissors,
  Stethoscope, ArrowRight, TrendingUp, TrendingDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Range = 'today' | 'week' | 'month';
interface Stats { totalPatients: number; todayAppointments: number; todayRevenue: number; activeDoctors: number; pendingAppointments: number; pendingLabOrders: number; lowStockCount: number; activeEncounters: number; occupiedBeds: number; totalBeds: number; bedOccupancyRate: number; todaySurgeries?: number; appointmentChart: { month: string; count: number }[]; revenueChart: { month: string; revenue: number }[]; todayAppointmentList?: { id: string; patientName: string; time: string; status: string; doctor: string }[]; pendingLabList?: { id: string; testName: string; patientName: string; priority: string; status: string }[]; lowStockList?: { id: string; name: string; stock: number; minStock: number }[]; activeDoctorList?: { id: string; name: string; specialty: string; todayCases: number; maxCases: number }[]; }

// ─── Stat Cards ───────────────────────────────────────────────────────────────
const ACCENT: Record<string, string> = {
  blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500',
  violet: 'bg-violet-500', rose: 'bg-rose-500', teal: 'bg-teal-500',
  indigo: 'bg-indigo-500', orange: 'bg-orange-500', pink: 'bg-pink-500', red: 'bg-red-500',
};
const ICON_BG: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600',
  rose: 'bg-rose-50 text-rose-600', teal: 'bg-teal-50 text-teal-600',
  indigo: 'bg-indigo-50 text-indigo-600', orange: 'bg-orange-50 text-orange-600',
  pink: 'bg-pink-50 text-pink-600', red: 'bg-red-50 text-red-600',
};

function StatCard({ title, value, sub, icon: Icon, color, trend }: { title: string; value: string | number; sub?: string; icon: React.ElementType; color: string; trend?: { pct: number; label: string } }) {
  const up = (trend?.pct ?? 0) >= 0;
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
      <div className={`h-1 w-full ${ACCENT[color]}`} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-gray-500 leading-tight">{title}</p>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${ICON_BG[color]}`}>
            <Icon size={15} />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{value}</p>
        {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-[11px] font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {up ? '+' : ''}{trend.pct}% {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────
function BarChartSVG({ data }: { data: { month: string; count: number }[] }) {
  const [tip, setTip] = useState<{ x: number; y: number; label: string; val: number } | null>(null);
  if (!data.length) return <div className="h-44 flex items-center justify-center text-gray-300 text-xs">Chua co du lieu</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 300; const H = 160; const pad = { l: 28, r: 8, t: 8, b: 24 };
  const bw = (W - pad.l - pad.r) / data.length;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = pad.t + (H - pad.t - pad.b) * t;
          return <line key={t} x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#f1f5f9" strokeWidth={1} />;
        })}
        {data.map((d, i) => {
          const bh = ((d.count / max) * (H - pad.t - pad.b)) || 2;
          const x = pad.l + i * bw + bw * 0.15;
          const y = H - pad.b - bh;
          const bwInner = bw * 0.7;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bwInner} height={bh} rx={4} ry={4} fill="#0ea5e9" opacity={0.85}
                className="cursor-pointer hover:opacity-100 transition-opacity"
                onMouseEnter={e => { const r = (e.target as SVGRectElement).getBoundingClientRect(); setTip({ x: r.left + r.width / 2, y: r.top - 8, label: d.month, val: d.count }); }}
                onMouseLeave={() => setTip(null)} />
              <text x={x + bwInner / 2} y={H - pad.b + 12} textAnchor="middle" fontSize={8} fill="#94a3b8">{d.month.split(' ')[0]}</text>
            </g>
          );
        })}
      </svg>
      {tip && (
        <div className="fixed z-50 pointer-events-none bg-white border border-gray-100 rounded-xl shadow-lg px-2.5 py-1.5 text-xs" style={{ left: tip.x, top: tip.y, transform: 'translate(-50%,-100%)' }}>
          <p className="text-gray-400 text-[10px]">{tip.label}</p>
          <p className="font-bold text-gray-900">{tip.val} ca</p>
        </div>
      )}
    </div>
  );
}

// ─── SVG Area Chart ───────────────────────────────────────────────────────────
function AreaChartSVG({ data }: { data: { month: string; revenue: number }[] }) {
  const [tip, setTip] = useState<{ x: number; y: number; label: string; val: number } | null>(null);
  if (!data.length) return <div className="h-44 flex items-center justify-center text-gray-300 text-xs">Chua co du lieu</div>;
  const max = Math.max(...data.map(d => d.revenue), 1);
  const W = 300; const H = 160; const pad = { l: 36, r: 8, t: 8, b: 24 };
  const iw = W - pad.l - pad.r; const ih = H - pad.t - pad.b;
  const pts = data.map((d, i) => ({ x: pad.l + (i / (data.length - 1 || 1)) * iw, y: pad.t + ih - (d.revenue / max) * ih }));

  // Cubic bezier smooth path
  const pathD = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return acc + ` C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
  }, '');
  const areaD = pathD + ` L${pts[pts.length - 1].x},${H - pad.b} L${pts[0].x},${H - pad.b} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = pad.t + ih * t;
          return <line key={t} x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#f1f5f9" strokeWidth={1} />;
        })}
        <path d={areaD} fill="url(#areaGrad)" />
        <path d={pathD} fill="none" stroke="#0ea5e9" strokeWidth={2} strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#0ea5e9" stroke="white" strokeWidth={1.5} className="cursor-pointer"
            onMouseEnter={e => { const r = (e.target as SVGCircleElement).getBoundingClientRect(); setTip({ x: r.left + r.width / 2, y: r.top - 8, label: data[i].month, val: data[i].revenue }); }}
            onMouseLeave={() => setTip(null)} />
        ))}
        {data.map((d, i) => (
          <text key={i} x={pts[i].x} y={H - pad.b + 12} textAnchor="middle" fontSize={8} fill="#94a3b8">{d.month.split(' ')[0]}</text>
        ))}
      </svg>
      {tip && (
        <div className="fixed z-50 pointer-events-none bg-white border border-gray-100 rounded-xl shadow-lg px-2.5 py-1.5 text-xs" style={{ left: tip.x, top: tip.y, transform: 'translate(-50%,-100%)' }}>
          <p className="text-gray-400 text-[10px]">{tip.label}</p>
          <p className="font-bold text-gray-900">{(tip.val / 1_000_000).toFixed(1)}M đ</p>
        </div>
      )}
    </div>
  );
}

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────
function DonutChart({ occupied, total }: { occupied: number; total: number }) {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const r = 44; const cx = 60; const cy = 60;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28 shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={14} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0ea5e9" strokeWidth={14}
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={16} fontWeight={700} fill="#0f172a">{pct}%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="#94a3b8">cong suat</text>
    </svg>
  );
}

// ─── Appointment Status Badge ─────────────────────────────────────────────────
const APPT_STATUS: Record<string, { label: string; cls: string }> = {
  COMPLETED:  { label: 'Hoan thanh', cls: 'bg-emerald-100 text-emerald-700' },
  IN_PROGRESS:{ label: 'Dang kham',  cls: 'bg-blue-100 text-blue-700' },
  CONFIRMED:  { label: 'Da xac nhan',cls: 'bg-indigo-100 text-indigo-700' },
  CHECKED_IN: { label: 'Da check-in',cls: 'bg-purple-100 text-purple-700' },
  PENDING:    { label: 'Cho',        cls: 'bg-yellow-100 text-yellow-700' },
  CANCELLED:  { label: 'Huy',        cls: 'bg-red-100 text-red-700' },
  NO_SHOW:    { label: 'Vang mat',   cls: 'bg-gray-100 text-gray-500' },
};
const LAB_PRIORITY: Record<string, { label: string; cls: string }> = {
  URGENT:   { label: 'Khan',      cls: 'bg-red-100 text-red-700' },
  PRIORITY: { label: 'Uu tien',   cls: 'bg-yellow-100 text-yellow-700' },
  NORMAL:   { label: 'Binh thuong', cls: 'bg-green-100 text-green-700' },
  PROCESSING:{ label: 'Dang xu ly', cls: 'bg-gray-100 text-gray-500' },
};

// ─── Quick Actions ────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Them benh nhan', prompt: 'Them benh nhan moi vao he thong', icon: Users,        color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',    href: '/patients' },
  { label: 'Dat lich kham',  prompt: 'Dat lich kham moi cho benh nhan', icon: CalendarDays, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100', href: '/appointments' },
  { label: 'Tao phieu XN',   prompt: 'Tao phieu xet nghiem moi',        icon: FlaskConical, color: 'bg-orange-50 text-orange-600 hover:bg-orange-100', href: '/lab' },
  { label: 'Len lich PT',    prompt: 'Len lich phau thuat moi',          icon: Scissors,     color: 'bg-violet-50 text-violet-600 hover:bg-violet-100', href: '/surgery' },
  { label: 'Dot dieu tri',   prompt: 'Tao dot dieu tri moi cho benh nhan', icon: Stethoscope, color: 'bg-teal-50 text-teal-600 hover:bg-teal-100', href: '/encounters' },
  { label: 'Thanh toan',     prompt: 'Tao hoa don thanh toan moi',       icon: DollarSign,   color: 'bg-amber-50 text-amber-600 hover:bg-amber-100', href: '/billing' },
];

const RANGE_LABELS: Record<Range, string> = { today: 'Hom nay', week: 'Tuan nay', month: 'Thang nay' };

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [range, setRange] = useState<Range>('today');
  const { data, isLoading } = useQuery(['dashboard', range], () =>
    api.get('/dashboard/stats', { params: { range } }).then(r => r.data.data)
  );
  const s: Stats = data || {} as Stats;

  const STAT_CARDS = [
    { title: 'Tong benh nhan',    value: s.totalPatients ?? 0,                                                    icon: Users,        color: 'blue',    trend: { pct: 8.2,  label: 'vs hom qua' } },
    { title: 'Ca kham hom nay',   value: s.todayAppointments ?? 0,                                                icon: CalendarDays, color: 'emerald', trend: { pct: 5.1,  label: 'vs hom qua' } },
    { title: 'Doanh thu',         value: `${((s.todayRevenue ?? 0) / 1_000_000).toFixed(1)}M`,                    icon: DollarSign,   color: 'amber',   trend: { pct: 12.4, label: 'vs hom qua' } },
    { title: 'Bac si hoat dong',  value: s.activeDoctors ?? 0,                                                    icon: UserRound,    color: 'violet',  trend: { pct: 0,    label: 'khong doi' } },
    { title: 'Cho xac nhan',      value: s.pendingAppointments ?? 0,                                              icon: Clock,        color: 'rose',    trend: { pct: -3.2, label: 'vs hom qua' } },
    { title: 'Dang dieu tri',     value: s.activeEncounters ?? 0,                                                 icon: Activity,     color: 'teal',    trend: { pct: 2.1,  label: 'vs hom qua' } },
    { title: 'Giuong dang dung',  value: `${s.occupiedBeds ?? 0}/${s.totalBeds ?? 0}`,                            icon: BedDouble,    color: 'indigo',  sub: `${s.bedOccupancyRate ?? 0}% cong suat` },
    { title: 'XN cho ket qua',    value: s.pendingLabOrders ?? 0,                                                 icon: FlaskConical, color: 'orange',  trend: { pct: -1.5, label: 'vs hom qua' } },
    { title: 'Thuoc sap het',     value: s.lowStockCount ?? 0,                                                    icon: Package,      color: 'pink',    sub: 'Duoi muc toi thieu' },
    { title: 'Phau thuat hom nay',value: s.todaySurgeries ?? 0,                                                   icon: Scissors,     color: 'red',     trend: { pct: 1.0,  label: 'vs hom qua' } },
  ];

  // Mock detail data (replace with real API when available)
  const apptList = s.todayAppointmentList || [
    { id: '1', patientName: 'Nguyen Van A', time: '08:00', status: 'COMPLETED', doctor: 'BS. Tran B' },
    { id: '2', patientName: 'Le Thi C',     time: '08:30', status: 'IN_PROGRESS', doctor: 'BS. Nguyen D' },
    { id: '3', patientName: 'Pham Van E',   time: '09:00', status: 'CHECKED_IN', doctor: 'BS. Tran B' },
    { id: '4', patientName: 'Hoang Thi F',  time: '09:30', status: 'PENDING', doctor: 'BS. Le G' },
    { id: '5', patientName: 'Vu Van H',     time: '10:00', status: 'NO_SHOW', doctor: 'BS. Nguyen D' },
  ];
  const labList = s.pendingLabList || [
    { id: '1', testName: 'Cong thuc mau',   patientName: 'Nguyen Van A', priority: 'URGENT',    status: 'PENDING' },
    { id: '2', testName: 'Sinh hoa mau',    patientName: 'Le Thi C',     priority: 'PRIORITY',  status: 'PROCESSING' },
    { id: '3', testName: 'Nuoc tieu toan phan', patientName: 'Pham Van E', priority: 'NORMAL', status: 'PENDING' },
    { id: '4', testName: 'X-quang nguc',    patientName: 'Hoang Thi F',  priority: 'URGENT',    status: 'PENDING' },
  ];
  const stockList = s.lowStockList || [
    { id: '1', name: 'Paracetamol 500mg', stock: 45,  minStock: 200 },
    { id: '2', name: 'Amoxicillin 500mg', stock: 12,  minStock: 100 },
    { id: '3', name: 'Bong y te',         stock: 80,  minStock: 150 },
    { id: '4', name: 'Kim tiem 5ml',      stock: 200, minStock: 300 },
  ];
  const doctorList = s.activeDoctorList || [
    { id: '1', name: 'BS. Tran Van B',   specialty: 'Noi tong quat', todayCases: 12, maxCases: 15 },
    { id: '2', name: 'BS. Nguyen Thi D', specialty: 'Tim mach',      todayCases: 8,  maxCases: 12 },
    { id: '3', name: 'BS. Le Van G',     specialty: 'Nhi khoa',      todayCases: 14, maxCases: 15 },
    { id: '4', name: 'BS. Pham Thi H',   specialty: 'Phau thuat',    todayCases: 5,  maxCases: 8  },
  ];

  return (
    <Layout>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tong quan he thong — {RANGE_LABELS[range]}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-card">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            He thong hoat dong
          </div>
          <select value={range} onChange={e => setRange(e.target.value as Range)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white shadow-card text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option value="today">Hom nay</option>
            <option value="week">Tuan nay</option>
            <option value="month">Thang nay</option>
          </select>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {QUICK_ACTIONS.map(({ label, icon: Icon, color, href }) => (
          <Link key={href} href={href}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border border-transparent transition-all duration-150 ${color} group`}>
            <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Icon size={17} />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      {/* ── Stat Cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 border border-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {STAT_CARDS.map(card => <StatCard key={card.title} {...card} />)}
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-semibold text-gray-900 text-sm">Lich kham theo thang</h3><p className="text-xs text-gray-400 mt-0.5">6 thang gan nhat</p></div>
            <Link href="/appointments" className="text-xs text-primary-500 hover:underline flex items-center gap-1">Xem them <ArrowRight size={12} /></Link>
          </div>
          <BarChartSVG data={s.appointmentChart || []} />
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-semibold text-gray-900 text-sm">Doanh thu theo thang</h3><p className="text-xs text-gray-400 mt-0.5">Xu huong 6 thang</p></div>
            <Link href="/billing" className="text-xs text-primary-500 hover:underline flex items-center gap-1">Xem them <ArrowRight size={12} /></Link>
          </div>
          <AreaChartSVG data={s.revenueChart || []} />
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-semibold text-gray-900 text-sm">Tinh trang giuong</h3><p className="text-xs text-gray-400 mt-0.5">Hien tai</p></div>
            <Link href="/beds" className="text-xs text-primary-500 hover:underline flex items-center gap-1">Ban do <ArrowRight size={12} /></Link>
          </div>
          <div className="flex items-center gap-4">
            <DonutChart occupied={s.occupiedBeds ?? 0} total={s.totalBeds ?? 0} />
            <div className="space-y-2.5 flex-1">
              {[
                { label: 'Trong', value: (s.totalBeds ?? 0) - (s.occupiedBeds ?? 0), color: 'bg-emerald-400' },
                { label: 'Co BN', value: s.occupiedBeds ?? 0, color: 'bg-blue-400' },
                { label: 'Tong',  value: s.totalBeds ?? 0,    color: 'bg-slate-300' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.color}`} />
                  <span className="text-xs text-gray-500 flex-1">{r.label}</span>
                  <span className="text-xs font-bold text-gray-900">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail Panels ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">

        {/* Lich kham hom nay */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-semibold text-gray-900 text-sm">Lich kham hom nay</h3><p className="text-xs text-gray-400 mt-0.5">{apptList.length} lich</p></div>
            <Link href="/appointments" className="text-xs text-primary-500 hover:underline flex items-center gap-1">Xem tat ca <ArrowRight size={12} /></Link>
          </div>
          <div className="space-y-2">
            {apptList.map(a => {
              const st = APPT_STATUS[a.status] || { label: a.status, cls: 'bg-gray-100 text-gray-500' };
              return (
                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">{a.time}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.patientName}</p>
                    <p className="text-xs text-gray-400 truncate">{a.doctor}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${st.cls}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Xet nghiem cho ket qua */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-semibold text-gray-900 text-sm">Xet nghiem cho ket qua</h3><p className="text-xs text-gray-400 mt-0.5">{labList.length} phieu</p></div>
            <Link href="/lab" className="text-xs text-primary-500 hover:underline flex items-center gap-1">Xem tat ca <ArrowRight size={12} /></Link>
          </div>
          <div className="space-y-2">
            {labList.map(l => {
              const pr = LAB_PRIORITY[l.priority] || { label: l.priority, cls: 'bg-gray-100 text-gray-500' };
              return (
                <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <FlaskConical size={14} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{l.testName}</p>
                    <p className="text-xs text-gray-400 truncate">{l.patientName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${pr.cls}`}>{pr.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Ton kho thuoc */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-semibold text-gray-900 text-sm">Ton kho sap het</h3><p className="text-xs text-gray-400 mt-0.5">{stockList.length} mat hang</p></div>
            <Link href="/medicines" className="text-xs text-primary-500 hover:underline flex items-center gap-1">Quan ly <ArrowRight size={12} /></Link>
          </div>
          <div className="space-y-3">
            {stockList.map(item => {
              const pct = item.minStock > 0 ? Math.round((item.stock / item.minStock) * 100) : 100;
              const barColor = pct < 30 ? 'bg-red-400' : pct < 60 ? 'bg-yellow-400' : 'bg-emerald-400';
              const textColor = pct < 30 ? 'text-red-600' : pct < 60 ? 'text-yellow-600' : 'text-emerald-600';
              return (
                <div key={item.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-gray-800 truncate flex-1">{item.name}</p>
                    <p className={`text-xs font-bold ml-2 shrink-0 ${textColor}`}>{item.stock}/{item.minStock}</p>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hoat dong bac si */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-semibold text-gray-900 text-sm">Hoat dong bac si</h3><p className="text-xs text-gray-400 mt-0.5">Hom nay</p></div>
            <Link href="/doctors" className="text-xs text-primary-500 hover:underline flex items-center gap-1">Xem tat ca <ArrowRight size={12} /></Link>
          </div>
          <div className="space-y-3">
            {doctorList.map(doc => {
              const load = doc.maxCases > 0 ? doc.todayCases / doc.maxCases : 0;
              const avatarColor = load >= 0.88 ? 'bg-red-100 text-red-700' : load >= 0.75 ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700';
              const barColor = load >= 0.88 ? 'bg-red-400' : load >= 0.75 ? 'bg-yellow-400' : 'bg-emerald-400';
              return (
                <div key={doc.id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor}`}>
                    {doc.name.split(' ').pop()?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400 ml-2 shrink-0">{doc.todayCases}/{doc.maxCases} ca</p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(load * 100, 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{doc.specialty}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
