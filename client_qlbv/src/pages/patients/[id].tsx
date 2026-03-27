import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import Layout from '@/components/Layout';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { ArrowLeft, User, Phone, MapPin, Droplets, Heart, FlaskConical, Receipt, Stethoscope, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700', CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700',
  CHECKED_IN: 'bg-purple-100 text-purple-700', IN_PROGRESS: 'bg-teal-100 text-teal-700',
  REGISTERED: 'bg-gray-100 text-gray-600', ADMITTED: 'bg-indigo-100 text-indigo-700',
  DISCHARGED: 'bg-green-100 text-green-700', UNPAID: 'bg-red-100 text-red-700',
  PAID: 'bg-green-100 text-green-700', PARTIAL: 'bg-yellow-100 text-yellow-700',
};

const TABS = ['Tong quan', 'Dot dieu tri', 'Xet nghiem', 'Hoa don', 'Lich su kham'] as const;
type Tab = typeof TABS[number];

export default function PatientDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [tab, setTab] = useState<Tab>('Tong quan');

  const { data: patient, isLoading } = useQuery(
    ['patient', id],
    () => api.get(`/patients/${id}`).then(r => r.data.data),
    { enabled: !!id }
  );

  const { data: encountersData } = useQuery(
    ['patient-encounters', id],
    () => api.get('/encounters', { params: { patientId: id, limit: 20 } }).then(r => r.data.data),
    { enabled: !!id && tab === 'Dot dieu tri' }
  );

  const { data: labData } = useQuery(
    ['patient-labs', id],
    () => api.get('/lab/orders', { params: { patientId: id, limit: 20 } }).then(r => r.data.data),
    { enabled: !!id && tab === 'Xet nghiem' }
  );

  const { data: billsData } = useQuery(
    ['patient-bills', id],
    () => api.get('/bills', { params: { patientId: id } }).then(r => r.data.data),
    { enabled: !!id && tab === 'Hoa don' }
  );

  if (isLoading) return <Layout><div className="flex items-center justify-center h-64 text-gray-400">Dang tai...</div></Layout>;
  if (!patient) return <Layout><div className="text-center py-20 text-gray-400">Khong tim thay benh nhan</div></Layout>;

  const encounters = encountersData?.encounters || [];
  const labOrders = labData?.orders || [];
  const bills = billsData?.bills || billsData || [];

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/patients" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {patient.name?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
              <p className="text-gray-500 text-sm">Ma BN: {patient.patientCode?.slice(-8) || patient.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>
        {patient.allergies && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle size={14} /> Di ung: {patient.allergies}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Tong quan */}
      {tab === 'Tong quan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><User size={16} /> Thong tin ca nhan</h3>
            <div className="space-y-3 text-sm">
              <Row label="Gioi tinh" value={patient.gender === 'MALE' ? 'Nam' : patient.gender === 'FEMALE' ? 'Nu' : 'Khac'} />
              <Row label="Ngay sinh" value={format(new Date(patient.dob), 'dd/MM/yyyy')} />
              <Row label="So dien thoai" value={patient.phone} icon={<Phone size={13} />} />
              {patient.address && <Row label="Dia chi" value={patient.address} icon={<MapPin size={13} />} />}
              {patient.bloodType && <Row label="Nhom mau" value={patient.bloodType} icon={<Droplets size={13} />} />}
              {patient.email && <Row label="Email" value={patient.email} />}
              {patient.insuranceId && <Row label="So BHYT" value={patient.insuranceId} />}
              {patient.emergencyContact && <Row label="Lien he khan cap" value={patient.emergencyContact} />}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Heart size={16} /> Thong tin y te</h3>
            <div className="space-y-3 text-sm">
              {patient.allergies && <Row label="Di ung" value={patient.allergies} className="text-red-600" />}
              {patient.chronicDiseases && <Row label="Benh man tinh" value={patient.chronicDiseases} />}
              {!patient.allergies && !patient.chronicDiseases && <p className="text-gray-400">Chua co thong tin</p>}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Thong ke nhanh</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Lich kham', value: patient.appointments?.length ?? 0, color: 'text-blue-600' },
                { label: 'Ho so BA', value: patient.medicalRecords?.length ?? 0, color: 'text-green-600' },
                { label: 'Dot dieu tri', value: patient.encounters?.length ?? 0, color: 'text-purple-600' },
                { label: 'Hoa don', value: patient.bills?.length ?? 0, color: 'text-yellow-600' },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent appointments */}
          <div className="card lg:col-span-3">
            <h3 className="font-semibold mb-4">Lich su kham gan day</h3>
            {!patient.appointments?.length ? (
              <p className="text-gray-400 text-sm">Chua co lich kham</p>
            ) : (
              <div className="space-y-2">
                {patient.appointments.slice(0, 5).map((a: Record<string, unknown>) => (
                  <div key={a.id as string} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium">{format(new Date(a.appointmentDate as string), 'dd/MM/yyyy HH:mm')}</p>
                      <p className="text-gray-500">BS. {(a.doctor as Record<string, Record<string, string>>)?.user?.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[a.status as string] || 'bg-gray-100 text-gray-600'}`}>{a.status as string}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Dot dieu tri */}
      {tab === 'Dot dieu tri' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Ma dot', 'Loai', 'Trang thai', 'Khoa', 'Ngay vao', 'Ngay ra'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {encounters.map((e: Record<string, unknown>) => (
                <tr key={e.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{(e.encounterCode as string)?.slice(-8)}</td>
                  <td className="px-4 py-3">{e.type as string}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[e.status as string] || 'bg-gray-100 text-gray-600'}`}>{e.status as string}</span></td>
                  <td className="px-4 py-3 text-gray-600">{(e.department as Record<string, string>)?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{e.admitDate ? format(new Date(e.admitDate as string), 'dd/MM/yyyy') : '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{e.dischargeDate ? format(new Date(e.dischargeDate as string), 'dd/MM/yyyy') : '-'}</td>
                </tr>
              ))}
              {!encounters.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400"><Stethoscope size={28} className="mx-auto mb-2 opacity-30" />Chua co dot dieu tri</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Xet nghiem */}
      {tab === 'Xet nghiem' && (
        <div className="space-y-4">
          {!labOrders.length ? (
            <div className="card flex flex-col items-center py-12 text-gray-400"><FlaskConical size={32} className="mb-2 opacity-30" />Chua co xet nghiem</div>
          ) : labOrders.map((order: Record<string, unknown>) => (
            <div key={order.id as string} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-sm">{format(new Date(order.createdAt as string), 'dd/MM/yyyy HH:mm')}</p>
                  {order.note && <p className="text-xs text-gray-500">{order.note as string}</p>}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[order.status as string] || 'bg-gray-100 text-gray-600'}`}>{order.status as string}</span>
              </div>
              <div className="space-y-2">
                {(order.items as Record<string, unknown>[])?.map((item) => (
                  <div key={item.id as string} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                    <span>{(item.test as Record<string, string>)?.name}</span>
                    <div className="flex items-center gap-3">
                      {item.result ? (
                        <span className={`font-medium ${item.isAbnormal ? 'text-red-600' : 'text-green-600'}`}>
                          {item.result as string} {item.unit as string}
                          {item.isAbnormal && ' ⚠'}
                        </span>
                      ) : <span className="text-gray-400">Cho ket qua</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Hoa don */}
      {tab === 'Hoa don' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Ma HD', 'Tong tien', 'Giam gia', 'Thanh toan', 'Trang thai', 'Ngay tao'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(bills as Record<string, unknown>[]).map((b) => (
                <tr key={b.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{(b.billCode as string)?.slice(-8)}</td>
                  <td className="px-4 py-3 font-medium">{(b.totalAmount as number).toLocaleString('vi-VN')}d</td>
                  <td className="px-4 py-3 text-gray-500">{(b.discount as number) > 0 ? `${(b.discount as number).toLocaleString('vi-VN')}d` : '-'}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{(b.finalAmount as number).toLocaleString('vi-VN')}d</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[b.paymentStatus as string] || 'bg-gray-100 text-gray-600'}`}>{b.paymentStatus as string}</span></td>
                  <td className="px-4 py-3 text-gray-500">{format(new Date(b.createdAt as string), 'dd/MM/yyyy')}</td>
                </tr>
              ))}
              {!(bills as unknown[]).length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400"><Receipt size={28} className="mx-auto mb-2 opacity-30" />Chua co hoa don</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Lich su kham */}
      {tab === 'Lich su kham' && (
        <div className="space-y-3">
          {!patient.medicalRecords?.length ? (
            <div className="card flex flex-col items-center py-12 text-gray-400">Chua co ho so benh an</div>
          ) : patient.medicalRecords.map((r: Record<string, unknown>) => (
            <div key={r.id as string} className="card">
              <div className="flex justify-between mb-3">
                <span className="font-medium text-sm">{format(new Date(r.createdAt as string), 'dd/MM/yyyy')}</span>
                <span className="text-gray-500 text-sm">BS. {(r.doctor as Record<string, Record<string, string>>)?.user?.name}</span>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Chan doan:</span> <span className="font-medium">{r.diagnosis as string}</span></p>
                {r.treatment && <p><span className="text-gray-500">Dieu tri:</span> {String(r.treatment)}</p>}
                {r.note && <p><span className="text-gray-500">Ghi chu:</span> {String(r.note)}</p>}
              </div>
              {(r.prescriptions as unknown[])?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Don thuoc:</p>
                  <div className="flex flex-wrap gap-2">
                    {(r.prescriptions as Record<string, unknown>[]).map((p) => (
                      <span key={p.id as string} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        {(p.medicine as Record<string, string>)?.name} — {p.dosage as string}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

function Row({ label, value, icon, className = '' }: { label: string; value: string; icon?: React.ReactNode; className?: string }) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="text-gray-400 mt-0.5">{icon}</span>}
      <span className="text-gray-400 min-w-[100px]">{label}:</span>
      <span className={`font-medium ${className}`}>{value}</span>
    </div>
  );
}
