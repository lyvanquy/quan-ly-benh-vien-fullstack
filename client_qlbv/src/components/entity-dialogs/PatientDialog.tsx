import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { User, Phone, MapPin, Droplets, Heart, CalendarDays, FlaskConical, Receipt, Stethoscope, Plus, Edit2, Save, X, Clock } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';
import PatientTimeline from '@/components/PatientTimeline';
import { DialogFrame } from '@/store/entityDialogStore';

interface Props { frame: DialogFrame; onClose: () => void; }

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700', CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700',
  UNPAID: 'bg-red-100 text-red-700', PAID: 'bg-green-100 text-green-700',
};

const TABS = ['Tong quan', 'Lich su', 'Lich kham', 'Dot dieu tri', 'Xet nghiem', 'Hoa don'] as const;
type Tab = typeof TABS[number];

export default function PatientDialog({ frame, onClose }: Props) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('Tong quan');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  const { data: patient, isLoading } = useQuery(
    ['patient-dlg', frame.id],
    () => api.get(`/patients/${frame.id}`).then(r => r.data.data),
    { enabled: !!frame.id }
  );

  const { data: apptData } = useQuery(
    ['patient-dlg-appts', frame.id],
    () => api.get('/appointments', { params: { patientId: frame.id, limit: 20 } }).then(r => r.data.data),
    { enabled: !!frame.id && tab === 'Lich kham' }
  );

  const { data: encounterData } = useQuery(
    ['patient-dlg-enc', frame.id],
    () => api.get('/encounters', { params: { patientId: frame.id, limit: 20 } }).then(r => r.data.data),
    { enabled: !!frame.id && tab === 'Dot dieu tri' }
  );

  const { data: labData } = useQuery(
    ['patient-dlg-lab', frame.id],
    () => api.get('/lab/orders', { params: { patientId: frame.id, limit: 20 } }).then(r => r.data.data),
    { enabled: !!frame.id && tab === 'Xet nghiem' }
  );

  const { data: billData } = useQuery(
    ['patient-dlg-bills', frame.id],
    () => api.get('/bills', { params: { patientId: frame.id } }).then(r => r.data.data),
    { enabled: !!frame.id && tab === 'Hoa don' }
  );

  const updateMut = useMutation(
    (data: Record<string, string>) => api.put(`/patients/${frame.id}`, data),
    { onSuccess: () => { qc.invalidateQueries(['patient-dlg', frame.id]); qc.invalidateQueries('patients'); setEditing(false); } }
  );

  if (isLoading) return <div className="flex items-center justify-center h-48 text-gray-400">Dang tai...</div>;
  if (!patient) return <div className="text-center py-12 text-gray-400">Khong tim thay benh nhan</div>;

  const startEdit = () => {
    setEditForm({ name: patient.name, phone: patient.phone, address: patient.address || '', allergies: patient.allergies || '', chronicDiseases: patient.chronicDiseases || '' });
    setEditing(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
          {patient.name?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input className="input text-lg font-bold mb-1" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
          ) : (
            <h2 className="text-xl font-bold text-gray-900">{patient.name}</h2>
          )}
          <p className="text-xs text-gray-400 font-mono">#{patient.patientCode?.slice(-8) || patient.id.slice(0, 8).toUpperCase()}</p>
          {patient.allergies && !editing && (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full border border-red-200">
              Di ung: {patient.allergies}
            </span>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {editing ? (
            <>
              <button onClick={() => updateMut.mutate(editForm)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs hover:bg-primary/90">
                <Save size={12} /> Luu
              </button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200">
                <X size={12} /> Huy
              </button>
            </>
          ) : (
            <button onClick={startEdit} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200">
              <Edit2 size={12} /> Sua
            </button>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-5">
        <EntityDialogLink entity="appointment" mode="create" ctx={{ patientId: frame.id, patientName: patient.name }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 no-underline">
          <CalendarDays size={12} /> Dat lich kham
        </EntityDialogLink>
        <EntityDialogLink entity="encounter" mode="create" ctx={{ patientId: frame.id }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 no-underline">
          <Stethoscope size={12} /> Tao dot dieu tri
        </EntityDialogLink>
        <EntityDialogLink entity="lab_order" mode="create" ctx={{ patientId: frame.id }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-100 no-underline">
          <FlaskConical size={12} /> Chi dinh XN
        </EntityDialogLink>
        <EntityDialogLink entity="bill" mode="create" ctx={{ patientId: frame.id }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-100 no-underline">
          <Receipt size={12} /> Tao hoa don
        </EntityDialogLink>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Tong quan */}
      {tab === 'Tong quan' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5"><User size={12} /> Ca nhan</h4>
              <div className="space-y-2 text-sm">
                <Row label="Gioi tinh" value={patient.gender === 'MALE' ? 'Nam' : patient.gender === 'FEMALE' ? 'Nu' : 'Khac'} />
                <Row label="Ngay sinh" value={format(new Date(patient.dob), 'dd/MM/yyyy')} />
                {editing ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-20">SDT:</span>
                    <input className="input text-xs py-1" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                ) : (
                  <Row label="SDT" value={patient.phone} icon={<Phone size={11} />} />
                )}
                {editing ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-20">Dia chi:</span>
                    <input className="input text-xs py-1" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                ) : patient.address ? (
                  <Row label="Dia chi" value={patient.address} icon={<MapPin size={11} />} />
                ) : null}
                {patient.bloodType && <Row label="Nhom mau" value={patient.bloodType} icon={<Droplets size={11} />} />}
                {patient.insuranceId && <Row label="BHYT" value={patient.insuranceId} />}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5"><Heart size={12} /> Y te</h4>
              <div className="space-y-2 text-sm">
                {editing ? (
                  <>
                    <div>
                      <span className="text-gray-400 text-xs">Di ung:</span>
                      <input className="input text-xs py-1 mt-1" value={editForm.allergies} onChange={e => setEditForm(f => ({ ...f, allergies: e.target.value }))} />
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Benh man tinh:</span>
                      <input className="input text-xs py-1 mt-1" value={editForm.chronicDiseases} onChange={e => setEditForm(f => ({ ...f, chronicDiseases: e.target.value }))} />
                    </div>
                  </>
                ) : (
                  <>
                    {patient.allergies && <Row label="Di ung" value={patient.allergies} className="text-red-600" />}
                    {patient.chronicDiseases && <Row label="Man tinh" value={patient.chronicDiseases} />}
                    {!patient.allergies && !patient.chronicDiseases && <p className="text-gray-400 text-xs">Chua co thong tin</p>}
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Lich kham', value: patient.appointments?.length ?? 0, color: 'text-blue-600', tab: 'Lich kham' as Tab },
              { label: 'Dot dieu tri', value: patient.encounters?.length ?? 0, color: 'text-purple-600', tab: 'Dot dieu tri' as Tab },
              { label: 'Xet nghiem', value: patient.labOrders?.length ?? 0, color: 'text-teal-600', tab: 'Xet nghiem' as Tab },
              { label: 'Hoa don', value: patient.bills?.length ?? 0, color: 'text-yellow-600', tab: 'Hoa don' as Tab },
            ].map(s => (              <button key={s.label} onClick={() => setTab(s.tab)}
                className="bg-gray-50 rounded-xl p-3 text-center hover:bg-gray-100 transition-colors">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Lich kham */}
      {tab === 'Lich kham' && (
        <div className="space-y-2">
          <div className="flex justify-end mb-2">
            <EntityDialogLink entity="appointment" mode="create" ctx={{ patientId: frame.id }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium no-underline hover:bg-primary/90">
              <Plus size={12} /> Dat lich moi
            </EntityDialogLink>
          </div>
          {(apptData?.appointments || []).map((a: Record<string, unknown>) => (
            <EntityDialogLink key={a.id as string} entity="appointment" id={a.id as string}
              className="block p-3 bg-gray-50 rounded-xl hover:bg-gray-100 no-underline">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{format(new Date(a.appointmentDate as string), 'dd/MM/yyyy HH:mm')}</p>
                  <p className="text-xs text-gray-500">BS. {((a.doctor as Record<string, Record<string, string>>)?.user?.name)}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[a.status as string] || 'bg-gray-100 text-gray-600'}`}>{a.status as string}</span>
              </div>
            </EntityDialogLink>
          ))}
          {!apptData?.appointments?.length && <p className="text-center py-8 text-gray-400 text-sm">Chua co lich kham</p>}
        </div>
      )}

      {/* Tab: Dot dieu tri */}
      {tab === 'Dot dieu tri' && (
        <div className="space-y-2">
          {(encounterData?.encounters || []).map((e: Record<string, unknown>) => (
            <EntityDialogLink key={e.id as string} entity="encounter" id={e.id as string}
              className="block p-3 bg-gray-50 rounded-xl hover:bg-gray-100 no-underline">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-gray-400">{(e.encounterCode as string)?.slice(-8)}</p>
                  <p className="text-sm font-medium text-gray-900">{e.type as string}</p>
                  <p className="text-xs text-gray-500">{(e.department as Record<string, string>)?.name || 'Chua phan khoa'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[e.status as string] || 'bg-gray-100 text-gray-600'}`}>{e.status as string}</span>
              </div>
            </EntityDialogLink>
          ))}
          {!encounterData?.encounters?.length && <p className="text-center py-8 text-gray-400 text-sm">Chua co dot dieu tri</p>}
        </div>
      )}

      {/* Tab: Xet nghiem */}
      {tab === 'Xet nghiem' && (
        <div className="space-y-2">
          <div className="flex justify-end mb-2">
            <EntityDialogLink entity="lab_order" mode="create" ctx={{ patientId: frame.id }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium no-underline hover:bg-primary/90">
              <Plus size={12} /> Chi dinh XN
            </EntityDialogLink>
          </div>
          {(labData?.orders || []).map((o: Record<string, unknown>) => (
            <EntityDialogLink key={o.id as string} entity="lab_order" id={o.id as string}
              className="block p-3 bg-gray-50 rounded-xl hover:bg-gray-100 no-underline">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{format(new Date(o.createdAt as string), 'dd/MM/yyyy HH:mm')}</p>
                  <p className="text-xs text-gray-500">{(o.items as unknown[])?.length || 0} xet nghiem</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[o.status as string] || 'bg-gray-100 text-gray-600'}`}>{o.status as string}</span>
              </div>
            </EntityDialogLink>
          ))}
          {!labData?.orders?.length && <p className="text-center py-8 text-gray-400 text-sm">Chua co xet nghiem</p>}
        </div>
      )}

      {/* Tab: Hoa don */}
      {tab === 'Hoa don' && (
        <div className="space-y-2">
          <div className="flex justify-end mb-2">
            <EntityDialogLink entity="bill" mode="create" ctx={{ patientId: frame.id }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium no-underline hover:bg-primary/90">
              <Plus size={12} /> Tao hoa don
            </EntityDialogLink>
          </div>
          {(billData?.bills || billData || []).map((b: Record<string, unknown>) => (
            <EntityDialogLink key={b.id as string} entity="bill" id={b.id as string}
              className="block p-3 bg-gray-50 rounded-xl hover:bg-gray-100 no-underline">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-gray-400">{(b.billCode as string)?.slice(-8)}</p>
                  <p className="text-sm font-semibold text-primary">{(b.finalAmount as number).toLocaleString('vi-VN')}d</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[b.paymentStatus as string] || 'bg-gray-100 text-gray-600'}`}>{b.paymentStatus as string}</span>
              </div>
            </EntityDialogLink>
          ))}
          {!(billData?.bills || billData || []).length && <p className="text-center py-8 text-gray-400 text-sm">Chua co hoa don</p>}
        </div>
      )}

      {/* Tab: Lich su (Timeline) */}
      {tab === 'Lich su' && (
        <PatientTimeline patientId={frame.id!} />
      )}
    </div>
  );
}

function Row({ label, value, icon, className = '' }: { label: string; value: string; icon?: React.ReactNode; className?: string }) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="text-gray-400 mt-0.5">{icon}</span>}
      <span className="text-gray-400 text-xs w-20 shrink-0">{label}:</span>
      <span className={`text-sm font-medium ${className}`}>{value}</span>
    </div>
  );
}
