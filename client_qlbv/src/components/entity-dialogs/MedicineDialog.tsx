import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/lib/axios';
import { DialogFrame } from '@/store/entityDialogStore';
import { Pill, Package, AlertTriangle, Save, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { frame: DialogFrame; onClose: () => void; }

export default function MedicineDialog({ frame, onClose }: Props) {
  const qc = useQueryClient();
  const isCreate = frame.mode === 'create';
  const [editing, setEditing] = useState(isCreate);
  const [form, setForm] = useState<Record<string, string | number>>({
    name: '', genericName: '', category: '', price: 0, stock: 0, unit: 'vien', manufacturer: '',
  });

  const { data: medicine, isLoading } = useQuery(
    ['medicine-dlg', frame.id],
    () => api.get(`/medicines/${frame.id}`).then(r => r.data.data),
    {
      enabled: !!frame.id && !isCreate,
      onSuccess: (d) => setForm({ name: d.name, genericName: d.genericName || '', category: d.category || '', price: d.price, stock: d.stock, unit: d.unit, manufacturer: d.manufacturer || '' }),
    }
  );

  const saveMut = useMutation(
    (data: typeof form) => isCreate
      ? api.post('/medicines', data)
      : api.put(`/medicines/${frame.id}`, data),
    {
      onSuccess: () => {
        qc.invalidateQueries('medicines');
        toast.success(isCreate ? 'Da tao thuoc' : 'Da cap nhat');
        if (isCreate) onClose(); else setEditing(false);
      },
    }
  );

  if (isLoading) return <div className="skeleton h-48 rounded-xl" />;

  const data = isCreate ? form : (medicine || form);
  const isLowStock = !isCreate && medicine && medicine.stock <= medicine.minStock;

  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shrink-0">
          <Pill size={20} className="text-white" />
        </div>
        <div className="flex-1">
          {editing ? (
            <input className="input text-lg font-bold" value={form.name as string}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ten thuoc" />
          ) : (
            <h2 className="text-xl font-bold text-gray-900">{data.name}</h2>
          )}
          {!editing && data.genericName && <p className="text-sm text-gray-400 mt-0.5">{data.genericName as string}</p>}
          {isLowStock && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg w-fit">
              <AlertTriangle size={11} /> Ton kho thap
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {editing ? (
            <>
              <button onClick={() => saveMut.mutate(form)} className="btn-primary text-xs px-3 py-1.5">
                <Save size={12} /> Luu
              </button>
              {!isCreate && <button onClick={() => setEditing(false)} className="btn-secondary text-xs px-3 py-1.5">
                <X size={12} /> Huy
              </button>}
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-secondary text-xs px-3 py-1.5">
              <Edit2 size={12} /> Sua
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Pill size={12} /> Thong tin thuoc
          </h4>
          {editing ? (
            <div className="space-y-3">
              {[
                { key: 'genericName', label: 'Ten goc' },
                { key: 'category', label: 'Nhom thuoc' },
                { key: 'unit', label: 'Don vi' },
                { key: 'manufacturer', label: 'Nha san xuat' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input className="input" value={form[key] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <Row label="Ten goc" value={String(data.genericName || '-')} />
              <Row label="Nhom" value={String(data.category || '-')} />
              <Row label="Don vi" value={String(data.unit || '-')} />
              <Row label="Nha SX" value={String(data.manufacturer || '-')} />
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Package size={12} /> Kho & Gia
          </h4>
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="label">Don gia (VND)</label>
                <input type="number" className="input" value={form.price as number}
                  onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Ton kho</label>
                <input type="number" className="input" value={form.stock as number}
                  onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <Row label="Don gia" value={`${Number(data.price).toLocaleString('vi-VN')}d`} />
              <Row label="Ton kho" value={`${data.stock} ${data.unit}`} />
              {medicine?.minStock && <Row label="Ton toi thieu" value={String(medicine.minStock)} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 text-xs w-20 shrink-0">{label}:</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
