import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  Plus, Search, Trash2, Edit2, Users, UserCheck, UserX,
  ChevronLeft, ChevronRight, Filter, X, Eye
} from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import EntityDialogLink from '@/components/EntityDialogLink';

interface Patient {
  id: string; name: string; dob: string; gender: string;
  phone: string; address: string; bloodType: string;
  email: string; createdAt: string; patientCode?: string;
}

interface PatientForm {
  name: string; dob: string; gender: string; phone: string;
  address: string; bloodType: string; email: string;
  allergies?: string; chronicDiseases?: string; emergencyContact?: string;
}

const GENDER_OPTIONS = [
  { value: '', label: 'Tất cả giới tính' },
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function GenderBadge({ gender }: { gender: string }) {
  if (gender === 'MALE')   return <span className="badge bg-blue-50 text-blue-700 ring-1 ring-blue-200/60">Nam</span>;
  if (gender === 'FEMALE') return <span className="badge bg-pink-50 text-pink-700 ring-1 ring-pink-200/60">Nữ</span>;
  return <span className="badge bg-gray-50 text-gray-600 ring-1 ring-gray-200/60">Khác</span>;
}

function AvatarCell({ name, gender }: { name: string; gender: string }) {
  const initials = name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase();
  const bg = gender === 'MALE' ? 'from-blue-400 to-blue-600' : gender === 'FEMALE' ? 'from-pink-400 to-rose-500' : 'from-gray-400 to-gray-600';
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
        {initials}
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{name}</p>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const qc = useQueryClient();
  const [search, setSearch]       = useState('');
  const [genderFilter, setGender] = useState('');
  const [page, setPage]           = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, genderFilter]);

  const { data, isLoading } = useQuery(
    ['patients', search, genderFilter, page],
    () => api.get('/patients', { params: { search, gender: genderFilter || undefined, page, limit: 10 } }).then(r => r.data.data),
    { keepPreviousData: true }
  );

  const patients: Patient[] = data?.patients ?? [];
  const total: number       = data?.total ?? 0;
  const totalPages          = Math.ceil(total / 10);

  // Stats from data
  const genderStats = { male: 0, female: 0, other: 0 };
  patients.forEach(p => {
    if (p.gender === 'MALE') genderStats.male++;
    else if (p.gender === 'FEMALE') genderStats.female++;
    else genderStats.other++;
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PatientForm>();

  // Populate form when editing
  useEffect(() => {
    if (editTarget) {
      Object.entries(editTarget).forEach(([k, v]) => setValue(k as keyof PatientForm, v as string));
      if (editTarget.dob) setValue('dob', format(new Date(editTarget.dob), 'yyyy-MM-dd'));
      setShowModal(true);
    }
  }, [editTarget, setValue]);

  const createMutation = useMutation(
    (d: PatientForm) => editTarget
      ? api.put(`/patients/${editTarget.id}`, d)
      : api.post('/patients', d),
    {
      onSuccess: () => {
        qc.invalidateQueries('patients');
        toast.success(editTarget ? 'Cập nhật thành công' : 'Thêm bệnh nhân thành công');
        closeModal();
      },
      onError: () => { toast.error('Thao tác thất bại'); },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => api.delete(`/patients/${id}`),
    {
      onSuccess: () => {
        qc.invalidateQueries('patients');
        toast.success('Đã xóa bệnh nhân');
        setDeleteTarget(null);
      },
      onError: () => { toast.error('Xóa thất bại'); },
    }
  );

  const closeModal = () => { setShowModal(false); setEditTarget(null); reset(); };

  const columns = [
    {
      key: 'name', label: 'Bệnh nhân',
      render: (r: Patient) => (
        <EntityDialogLink entity="patient" id={r.id}>
          <AvatarCell name={r.name} gender={r.gender} />
        </EntityDialogLink>
      )
    },
    { key: 'phone', label: 'Điện thoại', render: (r: Patient) => <span className="text-sm text-gray-600">{r.phone}</span> },
    { key: 'gender', label: 'Giới tính', render: (r: Patient) => <GenderBadge gender={r.gender} /> },
    {
      key: 'dob', label: 'Tuổi',
      render: (r: Patient) => {
        const age = differenceInYears(new Date(), new Date(r.dob));
        return (
          <div>
            <span className="text-sm font-medium text-gray-900">{age} tuổi</span>
            <p className="text-xs text-gray-400">{format(new Date(r.dob), 'dd/MM/yyyy')}</p>
          </div>
        );
      }
    },
    {
      key: 'bloodType', label: 'Nhóm máu',
      render: (r: Patient) => r.bloodType
        ? <span className="badge bg-red-50 text-red-700 ring-1 ring-red-200/60">{r.bloodType}</span>
        : <span className="text-gray-300 text-xs">—</span>
    },
    { key: 'address', label: 'Địa chỉ', render: (r: Patient) => <span className="text-xs text-gray-500 line-clamp-1 max-w-32">{r.address || '—'}</span> },
    {
      key: 'actions', label: '',
      render: (r: Patient) => (
        <div className="flex items-center gap-1">
          <EntityDialogLink entity="patient" id={r.id}>
            <button className="btn-icon w-7 h-7 text-gray-400 hover:text-primary-500" title="Xem chi tiết">
              <Eye size={14} />
            </button>
          </EntityDialogLink>
          <button
            onClick={() => setEditTarget(r)}
            className="btn-icon w-7 h-7 text-gray-400 hover:text-amber-500"
            title="Chỉnh sửa"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => setDeleteTarget(r)}
            className="btn-icon w-7 h-7 text-gray-400 hover:text-red-500"
            title="Xóa"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    },
  ];

  return (
    <Layout>
      <PageHeader
        title="Bệnh nhân"
        subtitle="Quản lý danh sách bệnh nhân trong hệ thống"
        icon={Users}
        stats={[
          { label: 'tổng cộng', value: total, color: 'blue' },
        ]}
        actions={
          <button onClick={() => { setEditTarget(null); setShowModal(true); }} className="btn-primary">
            <Plus size={16} /> Thêm bệnh nhân
          </button>
        }
      />

      {/* ── Filter Bar ── */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 pr-8"
              placeholder="Tìm theo tên, SĐT, địa chỉ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              className="input-sm min-w-36"
              value={genderFilter}
              onChange={e => setGender(e.target.value)}
            >
              {GENDER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <span className="text-sm text-gray-400 ml-auto">
            Hiển thị {patients.length} / {total} bệnh nhân
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Chưa có bệnh nhân nào"
            description="Nhấn 'Thêm bệnh nhân' để tạo hồ sơ bệnh nhân mới."
            action={
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <Plus size={14} /> Thêm bệnh nhân
              </button>
            }
          />
        ) : (
          <>
            <Table columns={columns as never} data={patients as never} loading={false} />

            {/* Pagination */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-50">
              <span className="text-xs text-gray-400">
                Trang {page} / {totalPages || 1} &nbsp;·&nbsp; {total} bệnh nhân
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="btn-icon disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pg = page <= 3 ? i + 1 : page + i - 2;
                  if (pg < 1 || pg > totalPages) return null;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        pg === page ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="btn-icon disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editTarget ? `Chỉnh sửa bệnh nhân` : 'Thêm bệnh nhân mới'}
      >
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Full name */}
            <div className="col-span-2">
              <label className="label">Họ và tên *</label>
              <input className="input" placeholder="Nguyễn Văn A" {...register('name', { required: 'Bắt buộc nhập tên' })} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* DOB */}
            <div>
              <label className="label">Ngày sinh *</label>
              <input type="date" className="input" {...register('dob', { required: true })} />
            </div>

            {/* Gender */}
            <div>
              <label className="label">Giới tính *</label>
              <select className="input" {...register('gender', { required: true })}>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="label">Số điện thoại *</label>
              <input
                className="input"
                placeholder="0912345678"
                {...register('phone', {
                  required: 'Bắt buộc',
                  pattern: { value: /^[0-9]{9,11}$/, message: 'SĐT không hợp lệ' }
                })}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            {/* Blood type */}
            <div>
              <label className="label">Nhóm máu</label>
              <select className="input" {...register('bloodType')}>
                <option value="">-- Chưa rõ --</option>
                {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Email */}
            <div className="col-span-2">
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="example@email.com" {...register('email')} />
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label className="label">Địa chỉ</label>
              <input className="input" placeholder="Số nhà, đường, phường/xã, tỉnh/thành" {...register('address')} />
            </div>

            {/* Allergies */}
            <div>
              <label className="label">Dị ứng</label>
              <input className="input" placeholder="Penicillin, hải sản..." {...register('allergies')} />
            </div>

            {/* Chronic diseases */}
            <div>
              <label className="label">Bệnh mãn tính</label>
              <input className="input" placeholder="Tiểu đường, cao huyết áp..." {...register('chronicDiseases')} />
            </div>

            {/* Emergency contact */}
            <div className="col-span-2">
              <label className="label">Liên hệ khẩn cấp</label>
              <input className="input" placeholder="Tên người thân - SĐT" {...register('emergencyContact')} />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-50">
            <button type="button" onClick={closeModal} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={createMutation.isLoading} className="btn-primary">
              {createMutation.isLoading ? 'Đang lưu...' : editTarget ? 'Cập nhật' : 'Thêm bệnh nhân'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Delete ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isLoading}
        title="Xóa bệnh nhân"
        message={`Bạn có chắc muốn xóa bệnh nhân "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa bệnh nhân"
      />
    </Layout>
  );
}
