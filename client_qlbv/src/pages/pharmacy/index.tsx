import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Plus, Search, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';

interface Medicine {
  id: string; code: string; name: string; category: string;
  price: number; stock: number; minStock: number; unit: string;
}

export default function PharmacyPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showStock, setShowStock] = useState<Medicine | null>(null);
  const { register, handleSubmit, reset } = useForm();
  const { register: regStock, handleSubmit: handleStock, reset: resetStock } = useForm();

  const { data, isLoading } = useQuery(
    ['pharmacy-medicines', search],
    () => api.get('/pharmacy/medicines', { params: { search: search || undefined } }).then(r => r.data.data)
  );

  const createMutation = useMutation(
    (d: unknown) => api.post('/pharmacy/medicines', d),
    { onSuccess: () => { qc.invalidateQueries('pharmacy-medicines'); toast.success('Thêm thuốc thành công'); setShowAdd(false); reset(); } }
  );

  const stockMutation = useMutation(
    ({ id, data }: { id: string; data: unknown }) => api.post(`/pharmacy/medicines/${id}/stock`, data),
    { onSuccess: () => { qc.invalidateQueries('pharmacy-medicines'); toast.success('Cập nhật tồn kho'); setShowStock(null); resetStock(); } }
  );

  const columns = [
    { key: 'code', label: 'Mã', render: (r: Medicine) => <span className="font-mono text-xs text-gray-500">{r.code?.slice(0, 8)}</span> },
    { key: 'name', label: 'Tên thuốc', render: (r: Medicine) => <EntityDialogLink entity="medicine" id={r.id}><span className="font-medium">{r.name}</span></EntityDialogLink> },
    { key: 'category', label: 'Nhóm' },
    { key: 'unit', label: 'ĐVT' },
    { key: 'price', label: 'Giá', render: (r: Medicine) => `${r.price.toLocaleString('vi-VN')}đ` },
    {
      key: 'stock', label: 'Tồn kho', render: (r: Medicine) => (
        <div className="flex items-center gap-1.5">
          {r.stock <= r.minStock && <AlertTriangle size={13} className="text-red-500" />}
          <span className={r.stock <= r.minStock ? 'text-red-600 font-semibold' : ''}>{r.stock} {r.unit}</span>
        </div>
      )
    },
    {
      key: 'actions', label: '', render: (r: Medicine) => (
        <button onClick={() => setShowStock(r)} className="text-primary hover:underline text-xs">Nhập/Xuất kho</button>
      )
    },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhà thuốc</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý thuốc và tồn kho</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />Thêm thuốc</button>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Tìm thuốc..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="text-sm text-gray-500">Tổng: {data?.total ?? 0}</span>
        </div>
        <Table columns={columns as never} data={data?.medicines ?? []} loading={isLoading} />
      </div>

      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset(); }} title="Thêm thuốc mới">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Tên thuốc *</label><input className="input" {...register('name', { required: true })} /></div>
            <div><label className="label">Tên generic</label><input className="input" {...register('genericName')} /></div>
            <div><label className="label">Nhóm thuốc</label><input className="input" {...register('category')} /></div>
            <div><label className="label">Giá (VNĐ) *</label><input type="number" className="input" {...register('price', { required: true, valueAsNumber: true })} /></div>
            <div><label className="label">Tồn kho ban đầu</label><input type="number" className="input" defaultValue={0} {...register('stock', { valueAsNumber: true })} /></div>
            <div><label className="label">Tồn kho tối thiểu</label><input type="number" className="input" defaultValue={10} {...register('minStock', { valueAsNumber: true })} /></div>
            <div><label className="label">Đơn vị</label><input className="input" defaultValue="viên" {...register('unit')} /></div>
            <div className="col-span-2"><label className="label">Nhà sản xuất</label><input className="input" {...register('manufacturer')} /></div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setShowAdd(false); reset(); }} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={createMutation.isLoading} className="btn-primary">{createMutation.isLoading ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!showStock} onClose={() => { setShowStock(null); resetStock(); }} title={`Nhập/Xuất kho — ${showStock?.name}`}>
        {showStock && (
          <form onSubmit={handleStock(d => stockMutation.mutate({ id: showStock.id, data: d }))} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p>Tồn kho hiện tại: <span className="font-bold">{showStock.stock} {showStock.unit}</span></p>
            </div>
            <div>
              <label className="label">Loại *</label>
              <select className="input" {...regStock('type', { required: true })}>
                <option value="IN">Nhập kho</option>
                <option value="OUT">Xuất kho</option>
                <option value="ADJUST">Điều chỉnh</option>
              </select>
            </div>
            <div>
              <label className="label">Số lượng *</label>
              <input type="number" min={1} className="input" {...regStock('quantity', { required: true, valueAsNumber: true })} />
            </div>
            <div>
              <label className="label">Lý do</label>
              <input className="input" {...regStock('reason')} />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowStock(null); resetStock(); }} className="btn-secondary">Hủy</button>
              <button type="submit" disabled={stockMutation.isLoading} className="btn-primary">{stockMutation.isLoading ? 'Đang lưu...' : 'Cập nhật'}</button>
            </div>
          </form>
        )}
      </Modal>
    </Layout>
  );
}
