import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Plus, Search } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';

interface Medicine { id: string; name: string; price: number; stock: number; unit: string; description: string; }
interface MedicineForm { name: string; price: number; stock: number; unit: string; description: string; }

export default function MedicinesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset } = useForm<MedicineForm>();

  const { data: medicines = [], isLoading } = useQuery(
    ['medicines', search],
    () => api.get('/medicines', { params: { search: search || undefined } }).then(r => r.data.data)
  );

  const createMutation = useMutation(
    (d: MedicineForm) => api.post('/medicines', { ...d, price: Number(d.price), stock: Number(d.stock) }),
    { onSuccess: () => { qc.invalidateQueries('medicines'); toast.success('Them thuoc thanh cong'); setShowModal(false); reset(); } }
  );

  const columns = [
    {
      key: 'name', label: 'Ten thuoc',
      render: (r: Medicine) => (
        <EntityDialogLink entity="medicine" id={r.id} className="font-medium">
          {r.name}
        </EntityDialogLink>
      ),
    },
    { key: 'unit', label: 'Don vi' },
    { key: 'price', label: 'Gia', render: (r: Medicine) => `${r.price.toLocaleString('vi-VN')}d` },
    {
      key: 'stock', label: 'Ton kho',
      render: (r: Medicine) => (
        <span className={r.stock < 50 ? 'text-red-500 font-medium' : 'text-gray-900'}>{r.stock}</span>
      ),
    },
    { key: 'description', label: 'Mo ta' },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thuốc</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý kho thuốc</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />Thêm thuốc</button>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Tìm thuốc..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <Table columns={columns as never} data={medicines} loading={isLoading} />
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); reset(); }} title="Thêm thuốc mới">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Tên thuốc *</label>
            <input className="input" {...register('name', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Giá (VNĐ) *</label>
              <input type="number" className="input" {...register('price', { required: true })} />
            </div>
            <div>
              <label className="label">Tồn kho *</label>
              <input type="number" className="input" {...register('stock', { required: true })} />
            </div>
          </div>
          <div>
            <label className="label">Đơn vị</label>
            <input className="input" defaultValue="viên" {...register('unit')} />
          </div>
          <div>
            <label className="label">Mô tả</label>
            <textarea className="input" rows={2} {...register('description')} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { setShowModal(false); reset(); }} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={createMutation.isLoading} className="btn-primary">{createMutation.isLoading ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
