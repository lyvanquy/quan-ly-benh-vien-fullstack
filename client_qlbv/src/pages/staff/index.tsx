import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Plus, Users, Briefcase, Building2, Phone, Mail, Calendar, Search, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface StaffMember {
  id: string; department: string; position: string; joinDate: string; salary?: number;
  user: { id: string; name: string; email: string; role: string; phone: string; isActive: boolean };
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quan tri', DOCTOR: 'Bac si', NURSE: 'Y ta',
  RECEPTIONIST: 'Le tan', ACCOUNTANT: 'Ke toan',
  PHARMACIST: 'Duoc si', LAB_TECHNICIAN: 'KTV Xet nghiem',
};
const ROLE_COLOR: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700', DOCTOR: 'bg-blue-100 text-blue-700',
  NURSE: 'bg-green-100 text-green-700', RECEPTIONIST: 'bg-yellow-100 text-yellow-700',
  ACCOUNTANT: 'bg-purple-100 text-purple-700', PHARMACIST: 'bg-orange-100 text-orange-700',
  LAB_TECHNICIAN: 'bg-teal-100 text-teal-700',
};
const DEPT_OPTIONS = [
  'Khoa Noi tong hop', 'Khoa Tim mach', 'Khoa Ngoai tong hop', 'Khoa Nhi',
  'Khoa Cap cuu', 'Khoa Da lieu', 'Khoa Than kinh', 'Khoa San phu khoa',
  'Phong Xet nghiem', 'Phong Duoc', 'Phong Hanh chinh', 'Ban Giam doc',
];

const EMPTY_FORM = {
  name: '', email: '', password: '', role: 'NURSE', phone: '',
  department: '', position: '', joinDate: '', salary: '',
};

export default function StaffPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [view, setView] = useState<'table' | 'card'>('table');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: staffRaw = [], isLoading } = useQuery('staff', () =>
    api.get('/staff').then(r => r.data.data));

  const staff: StaffMember[] = Array.isArray(staffRaw) ? staffRaw : [];

  const filtered = staff.filter(s => {
    const matchSearch = !search ||
      s.user.name.toLowerCase().includes(search.toLowerCase()) ||
      s.user.email.toLowerCase().includes(search.toLowerCase()) ||
      s.department?.toLowerCase().includes(search.toLowerCase()) ||
      s.position?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || s.user.role === filterRole;
    const matchDept = !filterDept || s.department === filterDept;
    return matchSearch && matchRole && matchDept;
  });

  const createMut = useMutation(
    (d: typeof form) => api.post('/staff', { ...d, salary: d.salary ? Number(d.salary) : undefined }),
    {
      onSuccess: () => {
        qc.invalidateQueries('staff');
        toast.success('Da them nhan vien');
        setShowModal(false);
        setForm(EMPTY_FORM);
      },
      onError: () => { toast.error('Loi khi them nhan vien'); },
    }
  );

  const depts = Array.from(new Set(staff.map(s => s.department).filter(Boolean)));

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhan su</h1>
          <p className="text-gray-500 text-sm mt-1">Quan ly nhan vien benh vien ({staff.length} nhan vien)</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Them nhan vien
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(ROLE_LABEL).slice(1).map(([role, label]) => {
          const count = staff.filter(s => s.user.role === role).length;
          if (!count) return null;
          return (
            <div key={role} className={`rounded-xl px-4 py-3 flex items-center gap-3 ${ROLE_COLOR[role]} bg-opacity-20`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${ROLE_COLOR[role]}`}>{count}</div>
              <span className="text-sm font-medium">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 py-2" placeholder="Tim kiem ten, email, khoa..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <select className="input py-2 pr-8 appearance-none" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">Tat ca chuc vu</option>
            {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select className="input py-2 pr-8 appearance-none" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">Tat ca khoa/phong</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => setView('table')} className={`px-3 py-2 text-sm ${view === 'table' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Bang</button>
          <button onClick={() => setView('card')} className={`px-3 py-2 text-sm ${view === 'card' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>The</button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Dang tai...</div>
      ) : view === 'table' ? (
        /* ── TABLE VIEW ── */
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nhan vien', 'Chuc vu', 'Khoa / Phong', 'Lien he', 'Ngay vao lam', 'Luong', 'Trang thai'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {s.user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{s.user.name}</p>
                        <p className="text-xs text-gray-400">{s.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLOR[s.user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABEL[s.user.role] || s.user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Building2 size={13} className="text-gray-400 shrink-0" />
                      <span>{s.department || '-'}</span>
                    </div>
                    {s.position && <p className="text-xs text-gray-400 mt-0.5 ml-5">{s.position}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {s.user.phone && (
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                          <Phone size={11} />{s.user.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <Mail size={11} />{s.user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {s.joinDate ? format(new Date(s.joinDate), 'dd/MM/yyyy') : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-sm">
                    {s.salary ? `${s.salary.toLocaleString('vi-VN')}đ` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.user.isActive ? 'Dang lam' : 'Nghi viec'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <Users size={36} className="mx-auto mb-2 opacity-30" />
                    {search || filterRole || filterDept ? 'Khong tim thay nhan vien phu hop' : 'Chua co nhan vien nao'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── CARD VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold shrink-0">
                  {s.user.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-gray-900">{s.user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s.user.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ROLE_COLOR[s.user.role] || 'bg-gray-100 text-gray-600'}`}>
                  {ROLE_LABEL[s.user.role] || s.user.role}
                </span>
              </div>
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Building2 size={13} className="text-gray-400" /><span>{s.department || '-'}</span></div>
                <div className="flex items-center gap-2"><Briefcase size={13} className="text-gray-400" /><span>{s.position || '-'}</span></div>
                {s.user.phone && <div className="flex items-center gap-2"><Phone size={13} className="text-gray-400" /><span>{s.user.phone}</span></div>}
                {s.joinDate && <div className="flex items-center gap-2"><Calendar size={13} className="text-gray-400" /><span>{format(new Date(s.joinDate), 'dd/MM/yyyy')}</span></div>}
              </div>
              {s.salary && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  Luong: <span className="font-semibold text-gray-700">{s.salary.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Users size={36} className="mx-auto mb-2 opacity-30" />
              Khong tim thay nhan vien
            </div>
          )}
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setForm(EMPTY_FORM); }} title="Them nhan vien moi" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ho ten *</label>
              <input className="input" placeholder="Nguyen Van A" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" placeholder="nhanvien@hms.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Mat khau *</label>
              <input type="password" className="input" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label className="label">So dien thoai</label>
              <input className="input" placeholder="09xxxxxxxx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Chuc vu *</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Khoa / Phong *</label>
              <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                <option value="">-- Chon khoa --</option>
                {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Vi tri cong viec *</label>
              <input className="input" placeholder="Truong khoa / Nhan vien..." value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
            </div>
            <div>
              <label className="label">Ngay vao lam *</label>
              <input type="date" className="input" value={form.joinDate} onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Luong co ban (VND)</label>
            <input type="number" className="input" placeholder="8000000" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }} className="btn-secondary">Huy</button>
            <button
              onClick={() => createMut.mutate(form)}
              disabled={createMut.isLoading || !form.name || !form.email || !form.password || !form.department || !form.position || !form.joinDate}
              className="btn-primary"
            >
              {createMut.isLoading ? 'Dang luu...' : 'Them nhan vien'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
