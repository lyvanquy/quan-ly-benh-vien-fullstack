import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/lib/axios';
import { GitBranch, Plus, Trash2, Play, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { DialogFrame } from '@/store/entityDialogStore';

interface Props { frame: DialogFrame; onClose: () => void; }

const ACTION_TYPES = ['CREATE_APPOINTMENT','CREATE_RECORD','CREATE_LAB_ORDER','CREATE_BILL',
  'SEND_NOTIFICATION','UPDATE_APPOINTMENT_STATUS','ALLOCATE_BED','DISCHARGE_PATIENT',
  'CREATE_REFERRAL','RESERVE_OR','CREATE_CONSENT'];

const NODE_TYPES = ['TEXT','DIALOG','FORM','DECISION','PAGE','ACTION'];

export default function WorkflowNodeDialog({ frame, onClose }: Props) {
  const qc = useQueryClient();
  const [expandedOpt, setExpandedOpt] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState(false);
  const [configText, setConfigText] = useState('');
  const [newOpt, setNewOpt] = useState({ label: '', value: '' });
  const [showNewOpt, setShowNewOpt] = useState(false);

  const { data: node, isLoading } = useQuery(
    ['node-dlg', frame.id],
    () => api.get(`/nodes/${frame.id}`).then(r => r.data.data),
    { enabled: !!frame.id }
  );

  const updateMut = useMutation(
    (data: Record<string, unknown>) => api.put(`/nodes/${frame.id}`, data),
    { onSuccess: () => qc.invalidateQueries(['node-dlg', frame.id]) }
  );

  const addOptMut = useMutation(
    (data: typeof newOpt) => api.post(`/nodes/${frame.id}/options`, data),
    { onSuccess: () => { qc.invalidateQueries(['node-dlg', frame.id]); setShowNewOpt(false); setNewOpt({ label: '', value: '' }); } }
  );

  const deleteOptMut = useMutation(
    (optId: string) => api.delete(`/options/${optId}`),
    { onSuccess: () => qc.invalidateQueries(['node-dlg', frame.id]) }
  );

  const addActionMut = useMutation(
    ({ optId, type }: { optId: string; type: string }) => api.post(`/options/${optId}/actions`, { type, params: {} }),
    { onSuccess: () => qc.invalidateQueries(['node-dlg', frame.id]) }
  );

  const deleteActionMut = useMutation(
    (actionId: string) => api.delete(`/actions/${actionId}`),
    { onSuccess: () => qc.invalidateQueries(['node-dlg', frame.id]) }
  );

  const runActionMut = useMutation(
    (actionId: string) => api.post(`/actions/${actionId}/run`),
  );

  const saveConfig = () => {
    try {
      const parsed = JSON.parse(configText);
      updateMut.mutate({ config: parsed });
      setEditingConfig(false);
    } catch { alert('JSON khong hop le'); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-48 text-gray-400">Dang tai...</div>;
  if (!node) return <div className="text-center py-12 text-gray-400">Khong tim thay node</div>;

  return (
    <div>
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0"><GitBranch size={22} /></div>
        <div className="flex-1">
          <p className="text-xs font-mono text-gray-400 mb-0.5">{node.key}</p>
          <h2 className="text-lg font-bold text-gray-900">{node.title}</h2>
          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">{node.type}</span>
        </div>
      </div>

      {/* Config editor */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Config JSON</span>
          {!editingConfig ? (
            <button onClick={() => { setConfigText(JSON.stringify(node.config || {}, null, 2)); setEditingConfig(true); }}
              className="text-xs text-primary hover:underline">Chinh sua</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={saveConfig} className="flex items-center gap-1 text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary/90"><Save size={10} /> Luu</button>
              <button onClick={() => setEditingConfig(false)} className="text-xs text-gray-400 hover:text-gray-600">Huy</button>
            </div>
          )}
        </div>
        {editingConfig ? (
          <textarea className="input font-mono text-xs" rows={8} value={configText} onChange={e => setConfigText(e.target.value)} />
        ) : (
          <pre className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-600 overflow-x-auto max-h-32">
            {JSON.stringify(node.config || {}, null, 2)}
          </pre>
        )}
      </div>

      {/* Options */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Options ({node.options?.length || 0})</span>
          <button onClick={() => setShowNewOpt(true)} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={11} /> Them option</button>
        </div>

        {showNewOpt && (
          <div className="flex gap-2 mb-3 p-3 bg-blue-50 rounded-xl">
            <input className="input text-sm flex-1" placeholder="Label" value={newOpt.label} onChange={e => setNewOpt(f => ({ ...f, label: e.target.value }))} />
            <input className="input text-sm flex-1" placeholder="Value" value={newOpt.value} onChange={e => setNewOpt(f => ({ ...f, value: e.target.value }))} />
            <button onClick={() => addOptMut.mutate(newOpt)} disabled={addOptMut.isLoading} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs">Them</button>
            <button onClick={() => setShowNewOpt(false)} className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-xs">Huy</button>
          </div>
        )}

        <div className="space-y-2">
          {node.options?.map((opt: Record<string, unknown>) => (
            <div key={opt.id as string} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 cursor-pointer"
                onClick={() => setExpandedOpt(expandedOpt === opt.id ? null : opt.id as string)}>
                {expandedOpt === opt.id ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                <span className="text-sm font-medium flex-1">{opt.label as string}</span>
                <span className="text-xs font-mono text-gray-400 bg-gray-200 px-2 py-0.5 rounded">{opt.value as string}</span>
                <button onClick={(e) => { e.stopPropagation(); if (confirm('Xoa option nay?')) deleteOptMut.mutate(opt.id as string); }}
                  className="text-red-400 hover:text-red-600 ml-2"><Trash2 size={13} /></button>
              </div>

              {expandedOpt === opt.id && (
                <div className="px-4 py-3 border-t border-gray-100">
                  {opt.condition && (
                    <p className="text-xs text-gray-500 mb-2 font-mono bg-yellow-50 px-2 py-1 rounded">if: {opt.condition as string}</p>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Actions ({(opt.actions as unknown[])?.length || 0})</span>
                    <select className="text-xs border border-gray-200 rounded px-2 py-1"
                      onChange={e => { if (e.target.value) { addActionMut.mutate({ optId: opt.id as string, type: e.target.value }); e.target.value = ''; } }}>
                      <option value="">+ Them action</option>
                      {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    {(opt.actions as Record<string, unknown>[])?.map((action) => (
                      <div key={action.id as string} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <span className="text-xs font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded flex-1">{action.type as string}</span>
                        <button onClick={() => runActionMut.mutate(action.id as string)}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">
                          <Play size={10} /> Test
                        </button>
                        <button onClick={() => deleteActionMut.mutate(action.id as string)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {!node.options?.length && <p className="text-center py-4 text-gray-400 text-xs">Chua co option</p>}
        </div>
      </div>

      {/* Node type changer */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
        <span className="text-xs text-gray-500">Doi loai node:</span>
        <select className="input text-xs py-1 flex-1" defaultValue={node.type}
          onChange={e => updateMut.mutate({ type: e.target.value })}>
          {NODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  );
}
