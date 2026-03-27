import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import api from '@/lib/axios';
import { ShieldCheck, Plus, Trash2 } from 'lucide-react';

const ROLES = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'ACCOUNTANT', 'PHARMACIST', 'LAB_TECHNICIAN'];

export default function PermissionsAdminPage() {
  const qc = useQueryClient();
  const [selectedRole, setSelectedRole] = useState('DOCTOR');
  const [newPerm, setNewPerm] = useState({ key: '', name: '', resource: '', action: '', condition: '' });
  const [showCreate, setShowCreate] = useState(false);

  const { data: allPerms = [] } = useQuery('all-permissions', () =>
    api.get('/permissions').then(r => r.data.data));
  const { data: rolePerms = [] } = useQuery(['role-permissions', selectedRole], () =>
    api.get('/permissions/roles').then(r => (r.data.data as Record<string, unknown>[]).filter(rp => rp.role === selectedRole)));

  const assignPerm = useMutation(
    (permissionId: string) => api.post('/permissions/roles', { role: selectedRole, permissionId }),
    { onSuccess: () => qc.invalidateQueries(['role-permissions', selectedRole]) }
  );

  const removePerm = useMutation(
    ({ role, permissionId }: { role: string; permissionId: string }) =>
      api.delete(`/permissions/roles/${role}/${permissionId}`),
    { onSuccess: () => qc.invalidateQueries(['role-permissions', selectedRole]) }
  );

  const createPerm = useMutation(
    (data: typeof newPerm) => api.post('/permissions', data),
    { onSuccess: () => { qc.invalidateQueries('all-permissions'); setShowCreate(false); setNewPerm({ key: '', name: '', resource: '', action: '', condition: '' }); } }
  );

  const assignedIds = new Set((rolePerms as Record<string, unknown>[]).map(rp => (rp as { permissionId: string }).permissionId));

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quan ly quyen (RBAC)</h1>
          <p className="text-gray-500 text-sm mt-1">Phan quyen theo vai tro va nguoi dung</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tao quyen moi
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Role selector */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Vai tro</h3>
          <div className="space-y-1">
            {ROLES.map(role => (
              <button key={role} onClick={() => setSelectedRole(role)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${selectedRole === role ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Permission assignment */}
        <div className="xl:col-span-2 card">
          <h3 className="font-semibold text-gray-900 mb-4">Quyen cua {selectedRole}</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {(allPerms as Record<string, string>[]).map(perm => {
              const assigned = assignedIds.has(perm.id);
              return (
                <div key={perm.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${assigned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className={assigned ? 'text-green-600' : 'text-gray-400'} />
                      <span className="font-mono text-xs font-medium text-gray-800">{perm.key}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 ml-5">{perm.name}
                      {perm.resource && <span className="ml-2 text-gray-400">({perm.resource})</span>}
                    </p>
                    {perm.condition && (
                      <p className="text-xs text-orange-500 mt-0.5 ml-5 font-mono">ABAC: {perm.condition}</p>
                    )}
                  </div>
                  <button
                    onClick={() => assigned
                      ? removePerm.mutate({ role: selectedRole, permissionId: perm.id })
                      : assignPerm.mutate(perm.id)
                    }
                    className={`ml-3 px-3 py-1 rounded text-xs font-medium transition-colors ${assigned ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                    {assigned ? 'Xoa' : 'Cap'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create permission modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Tao quyen moi</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Permission Key</label>
                <input className="input font-mono" placeholder="resource.action" value={newPerm.key}
                  onChange={e => setNewPerm(f => ({ ...f, key: e.target.value }))} />
              </div>
              <div>
                <label className="label">Ten hien thi</label>
                <input className="input" value={newPerm.name} onChange={e => setNewPerm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Resource</label>
                  <input className="input" placeholder="Encounter" value={newPerm.resource}
                    onChange={e => setNewPerm(f => ({ ...f, resource: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Action</label>
                  <input className="input" placeholder="CREATE" value={newPerm.action}
                    onChange={e => setNewPerm(f => ({ ...f, action: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">ABAC Condition (tuy chon)</label>
                <input className="input font-mono text-xs" placeholder="user.role === 'DOCTOR'" value={newPerm.condition}
                  onChange={e => setNewPerm(f => ({ ...f, condition: e.target.value }))} />
                <p className="text-xs text-gray-400 mt-1">Bieu thuc JS don gian su dung bien user va ctx</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Huy</button>
              <button className="btn-primary" onClick={() => createPerm.mutate(newPerm)} disabled={!newPerm.key || !newPerm.name || createPerm.isLoading}>
                {createPerm.isLoading ? 'Dang luu...' : 'Tao'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
