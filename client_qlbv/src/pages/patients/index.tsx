import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Plus, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import EntityDialogLink from '@/components/EntityDialogLink';

interface Patient {
  id: string; name: string; dob: string; gender: string;
  phone: string; address: string; bloodType: string; createdAt: string;
}

interface PatientForm {
  name: string; dob: string; gender: string; phone: string;
  address: string; bloodType: string; email: string;
}

export default function PatientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery(
    ['patients', search, page],
    () => api.get('/patients', { params: { search, page, limit: 10 } }).then(r => r.data.data),
    { keepPreviousData: true }
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PatientForm>();

  const createMutation = useMutation(
    (d: PatientForm) => api.post('/patients', d),
    {
      onSuccess: () => { qc.invalidateQueries('patients'); toast.success('Thêm bệnh nhân thành công'); setShowModal(false); reset(); },
      onError: () => toast.error('Thêm thất bại'),
    }
  );

  const deleteMutation = useMutation(
    (id: string) => api.delete(`/patients/${id}`),
    { onSuccess: () => { qc.invalidateQueries('patients'); toast.success('Đã xóa'); } }
  );

  const columns = [
    { key: 'name', label: 'Ho ten', render: (r: Patient) => (
        <EntityDialogLink entity="patient" id={r.id} className="font-medium">{r.name}</EntityDialogLink>
      )
    },
    { key: 'phone', label: 'Điện thoại' },
    { key: 'gender', label: 'Giới tính', render: (r: Patient) => r.gender === 'MALE' ? 'Nam' : r.gender === 'FEMALE' ? 'Nữ' : 'Khác' },
    { key: 'dob', label: 'Ngày sinh', render: (r: Patient) => format(new Date(r.dob), 'dd/MM/yyyy') },
    { key: 'bloodType', label: 'Nhóm máu' },
    {
      key: 'actions', label: '', render: (r: Patient) => (
        <div className="flex gap-2">
          <EntityDialogLink entity="patient" id={r.id} className="text-primary hover:text-primary/80 text-xs">Xem</EntityDialogLink>
          <button onClick={() => { if (confirm('Xoa benh nhan nay?')) deleteMutation.mutate(r.id); }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
        </div>
      )
    },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bệnh nhân</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý danh sách bệnh nhân</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Thêm bệnh nhân
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Tìm theo tên, SĐT..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <span className="text-sm text-gray-500">Tổng: {data?.total ?? 0}</span>
        </div>

        <Table columns={columns as never} data={data?.patients ?? []} loading={isLoading} />

        <div className="flex items-center justify-between mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm disabled:opacity-40">Trước</button>
          <span className="text-sm text-gray-500">Trang {page}</span>
          <button disabled={!data || page * 10 >= data.total} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm disabled:opacity-40">Sau</button>
        </div>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); reset(); }} title="Thêm bệnh nhân mới">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Họ tên *</label>
              <input className="input" {...register('name', { required: true })} />
              {errors.name && <p className="text-red-500 text-xs mt-1">Bắt buộc</p>}
            </div>
            <div>
              <label className="label">Ngày sinh *</label>
              <input type="date" className="input" {...register('dob', { required: true })} />
            </div>
            <div>
              <label className="label">Giới tính *</label>
              <select className="input" {...register('gender', { required: true })}>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div>
              <label className="label">Điện thoại *</label>
              <input className="input" {...register('phone', { required: true })} />
            </div>
            <div>
              <label className="label">Nhóm máu</label>
              <select className="input" {...register('bloodType')}>
                <option value="">--</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Địa chỉ</label>
              <input className="input" {...register('address')} />
            </div>
            <div className="col-span-2">
              <label className="label">Email</label>
              <input type="email" className="input" {...register('email')} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setShowModal(false); reset(); }} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={createMutation.isLoading} className="btn-primary">
              {createMutation.isLoading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
