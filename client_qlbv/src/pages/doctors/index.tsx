import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import EntityDialogLink from '@/components/EntityDialogLink';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  UserRound, Stethoscope, DoorOpen, Plus, Search, X, Filter,
  Edit2, Trash2, Star, Calendar, Phone, Mail, Award, Clock,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

interface Doctor {
  id: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  roomNumber: string;
  status: string;
  user: { name: string; email: string; phone: string; avatar?: string };
}

interface DoctorForm {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  roomNumber: string;
  status: string;
}

const SPECIALTIES = [
  'Nội tổng quát', 'Tim mạch', 'Thần kinh', 'Nhi khoa', 'Sản phụ khoa',
  'Ngoại tổng quát', 'Chỉnh hình', 'Tai mũi họng', 'Mắt', 'Da liễu',
  'Tiêu hóa', 'Hô hấp', 'Nội tiết', 'Thận - Tiết niệu', 'Phẫu thuật',
  'Cấp cứu', 'Gây mê hồi sức', 'Chẩn đoán hình ảnh', 'Xét nghiệm', 'Y học cổ truyền',
];

const QUALIFICATIONS = ['Tiến sĩ Y khoa', 'Thạc sĩ Y khoa', 'Chuyên khoa II', 'Chuyên khoa I', 'Bác sĩ'];

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIVE:   { label: 'Đang làm việc', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60', dot: 'bg-emerald-400' },
  ON_LEAVE: { label: 'Nghỉ phép',     cls: 'bg-amber-50  text-amber-700  ring-1 ring-amber-200/60',   dot: 'bg-amber-400' },
  INACTIVE: { label: 'Ngừng làm',     cls: 'bg-red-50    text-red-700    ring-1 ring-red-200/60',     dot: 'bg-red-400' },
};

const SPECIALTY_ICON: Record<string, string> = {
  'Tim mạch': '🫀', 'Thần kinh': '🧠', 'Nhi khoa': '👶', 'Sản phụ khoa': '🤱',
  'Mắt': '👁️', 'Tai mũi họng': '👂', 'Da liễu': '🩺', 'Phẫu thuật': '🔪',
};

function DoctorSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
          <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded-lg w-full" />
        <div className="h-3 bg-gray-100 rounded-lg w-2/3" />
      </div>
    </div>
  );
}

function DoctorCard({
  doctor, onEdit, onDelete,
}: {
  doctor: Doctor;
  onEdit: (d: Doctor) => void;
  onDelete: (d: Doctor) => void;
}) {
  const st = STATUS_CONFIG[doctor.status] ?? STATUS_CONFIG['ACTIVE'];
  const icon = SPECIALTY_ICON[doctor.specialty] ?? '🩺';
  const initials = doctor.user.name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group relative">
      {/* Actions top-right */}
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(doctor)}
          className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-colors"
          title="Chỉnh sửa"
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={() => onDelete(doctor)}
          className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
          title="Xóa"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <EntityDialogLink entity="doctor" id={doctor.id}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-[0_4px_12px_rgb(14_165_233/.3)] cursor-pointer">
            {initials}
          </div>
        </EntityDialogLink>
        <div className="flex-1 min-w-0 pt-0.5">
          <EntityDialogLink entity="doctor" id={doctor.id}>
            <p className="font-bold text-gray-900 text-sm truncate hover:text-primary-600 transition-colors cursor-pointer pr-16">
              {doctor.user.name}
            </p>
          </EntityDialogLink>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${st.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        </div>
      </div>

      {/* Specialty badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
          {doctor.specialty}
        </span>
      </div>

      {/* Info rows */}
      <div className="space-y-1.5 text-xs text-gray-500">
        {doctor.qualifications && (
          <div className="flex items-center gap-2">
            <Award size={12} className="text-violet-400 shrink-0" />
            <span className="truncate">{doctor.qualifications}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-teal-400 shrink-0" />
          <span>{doctor.experienceYears} năm kinh nghiệm</span>
        </div>
        {doctor.roomNumber && (
          <div className="flex items-center gap-2">
            <DoorOpen size={12} className="text-indigo-400 shrink-0" />
            <span>Phòng {doctor.roomNumber}</span>
          </div>
        )}
        {doctor.user.phone && (
          <div className="flex items-center gap-2">
            <Phone size={12} className="text-gray-300 shrink-0" />
            <span>{doctor.user.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Mail size={12} className="text-gray-300 shrink-0" />
          <span className="truncate">{doctor.user.email}</span>
        </div>
      </div>
    </div>
  );
}

export default function DoctorsPage() {
  const qc = useQueryClient();
  const [search, setSearch]           = useState('');
  const [specFilter, setSpecFilter]   = useState('');
  const [statusFilter, setStatus]     = useState('');
  const [page, setPage]               = useState(1);
  const [showModal, setShowModal]     = useState(false);
  const [editTarget, setEdit]         = useState<Doctor | null>(null);
  const [deleteTarget, setDelete]     = useState<Doctor | null>(null);

  useEffect(() => { setPage(1); }, [search, specFilter, statusFilter]);

  const { data, isLoading } = useQuery(
    ['doctors', search, specFilter, statusFilter, page],
    () => api.get('/doctors', {
      params: {
        search: search || undefined,
        specialty: specFilter || undefined,
        status: statusFilter || undefined,
        page, limit: 12,
      }
    }).then(r => {
      const d = r.data.data;
      return Array.isArray(d) ? { doctors: d, total: d.length } : d;
    }),
    { keepPreviousData: true }
  );

  const doctors: Doctor[] = data?.doctors ?? (Array.isArray(data) ? data : []);
  const total: number     = data?.total ?? doctors.length;
  const totalPages        = Math.ceil(total / 12);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<DoctorForm>();

  useEffect(() => {
    if (editTarget) {
      setValue('name', editTarget.user.name);
      setValue('email', editTarget.user.email);
      setValue('phone', editTarget.user.phone ?? '');
      setValue('specialty', editTarget.specialty);
      setValue('qualifications', editTarget.qualifications ?? '');
      setValue('experienceYears', editTarget.experienceYears);
      setValue('roomNumber', editTarget.roomNumber ?? '');
      setValue('status', editTarget.status ?? 'ACTIVE');
      setShowModal(true);
    }
  }, [editTarget, setValue]);

  const saveMutation = useMutation(
    (d: DoctorForm) => editTarget
      ? api.put(`/doctors/${editTarget.id}`, d)
      : api.post('/doctors', d),
    {
      onSuccess: () => {
        qc.invalidateQueries('doctors');
        toast.success(editTarget ? 'Cập nhật bác sĩ thành công' : 'Thêm bác sĩ thành công');
        closeModal();
      },
      onError: () => { toast.error('Thao tác thất bại'); },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => api.delete(`/doctors/${id}`),
    {
      onSuccess: () => {
        qc.invalidateQueries('doctors');
        toast.success('Đã xóa bác sĩ');
        setDelete(null);
      },
      onError: () => { toast.error('Xóa thất bại'); },
    }
  );

  const closeModal = () => { setShowModal(false); setEdit(null); reset(); };

  // Stats
  const activeCount   = doctors.filter(d => d.status === 'ACTIVE').length;
  const onLeaveCount  = doctors.filter(d => d.status === 'ON_LEAVE').length;

  return (
    <Layout>
      <PageHeader
        title="Bác sĩ"
        subtitle="Quản lý danh sách bác sĩ trong bệnh viện"
        icon={UserRound}
        stats={[
          { label: 'tổng cộng', value: total, color: 'blue' },
          { label: 'đang làm việc', value: activeCount, color: 'emerald' },
          { label: 'nghỉ phép', value: onLeaveCount, color: 'amber' },
        ]}
        actions={
          <button onClick={() => { setEdit(null); setShowModal(true); }} className="btn-primary">
            <Plus size={16} /> Thêm bác sĩ
          </button>
        }
      />

      {/* ── Filter Bar ── */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 pr-8"
              placeholder="Tìm theo tên, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Specialty filter */}
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-gray-400" />
            <select className="input-sm min-w-40" value={specFilter} onChange={e => setSpecFilter(e.target.value)}>
              <option value="">Tất cả chuyên khoa</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <select className="input-sm min-w-36" value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang làm việc</option>
            <option value="ON_LEAVE">Nghỉ phép</option>
            <option value="INACTIVE">Ngừng làm</option>
          </select>

          {(search || specFilter || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setSpecFilter(''); setStatus(''); }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <X size={12} /> Xóa lọc
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto">Hiển thị {doctors.length} / {total} bác sĩ</span>
        </div>
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mb-5">
          {Array.from({ length: 8 }).map((_, i) => <DoctorSkeleton key={i} />)}
        </div>
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="Chưa có bác sĩ nào"
          description="Nhấn 'Thêm bác sĩ' để tạo hồ sơ bác sĩ mới."
          action={
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={14} /> Thêm bác sĩ
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 mb-5">
            {doctors.map(d => (
              <DoctorCard key={d.id} doctor={d} onEdit={setEdit} onDelete={setDelete} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <span className="text-xs text-gray-400">Trang {page} / {totalPages} · {total} bác sĩ</span>
              <div className="flex items-center gap-1.5">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-icon disabled:opacity-30">
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pg = page <= 3 ? i + 1 : page + i - 2;
                  if (pg < 1 || pg > totalPages) return null;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${pg === page ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-icon disabled:opacity-30">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editTarget ? 'Chỉnh sửa bác sĩ' : 'Thêm bác sĩ mới'}
      >
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2">
              <label className="label">Họ và tên *</label>
              <input className="input" placeholder="Nguyễn Văn A" {...register('name', { required: 'Bắt buộc' })} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" placeholder="bac.si@hospital.vn" {...register('email', { required: 'Bắt buộc' })} />
            </div>

            {/* Phone */}
            <div>
              <label className="label">Số điện thoại</label>
              <input className="input" placeholder="0912345678" {...register('phone')} />
            </div>

            {/* Specialty */}
            <div>
              <label className="label">Chuyên khoa *</label>
              <select className="input" {...register('specialty', { required: 'Bắt buộc' })}>
                <option value="">-- Chọn chuyên khoa --</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.specialty && <p className="text-red-500 text-xs mt-1">{errors.specialty.message}</p>}
            </div>

            {/* Qualifications */}
            <div>
              <label className="label">Bằng cấp</label>
              <select className="input" {...register('qualifications')}>
                <option value="">-- Chọn bằng cấp --</option>
                {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="label">Số năm kinh nghiệm</label>
              <input type="number" min={0} max={50} className="input" placeholder="5" {...register('experienceYears', { valueAsNumber: true })} />
            </div>

            {/* Room */}
            <div>
              <label className="label">Số phòng khám</label>
              <input className="input" placeholder="101" {...register('roomNumber')} />
            </div>

            {/* Status */}
            <div className="col-span-2">
              <label className="label">Trạng thái</label>
              <select className="input" {...register('status')}>
                <option value="ACTIVE">Đang làm việc</option>
                <option value="ON_LEAVE">Nghỉ phép</option>
                <option value="INACTIVE">Ngừng làm việc</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-50">
            <button type="button" onClick={closeModal} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={saveMutation.isLoading} className="btn-primary">
              {saveMutation.isLoading ? 'Đang lưu...' : editTarget ? 'Cập nhật' : 'Thêm bác sĩ'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Delete ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDelete(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isLoading}
        title="Xóa bác sĩ"
        message={`Bạn có chắc muốn xóa bác sĩ "${deleteTarget?.user.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa bác sĩ"
      />
    </Layout>
  );
}


