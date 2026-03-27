import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { Stethoscope, BedDouble, Activity } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';
import { DialogFrame } from '@/store/entityDialogStore';
import StatusBadge from '@/components/StatusBadge';

interface Props { frame: DialogFrame; onClose: () => void; }

export default function EncounterDialog({ frame, onClose }: Props) {
  const qc = useQueryClient();

  const { data: enc, isLoading } = useQuery(
    ['enc-dlg', frame.id],
    () => api.get(`/encounters/${frame.id}`).then(r => r.data.data),
    { enabled: !!frame.id }
  );

  const updateStatus = useMutation(
    (status: string) => api.put(`/encounters/${frame.id}`, { status }),
    { onSuccess: () => { qc.invalidateQueries(['enc-dlg', frame.id]); qc.invalidateQueries('encounters'); } }
  );

  if (isLoading) return <div className="flex items-center justify-center h-48 text-gray-400">Dang tai...</div>;
  if (!enc) return <div className="text-center py-12 text-gray-400">Khong tim thay dot dieu tri</div>;

  return (
    <div>
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
          <Stethoscope size={22} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-mono text-gray-400 mb-0.5">#{enc.encounterCode?.slice(-8)}</p>
          <h2 className="text-lg font-bold text-gray-900">{enc.type}</h2>
          <div className="mt-1"><StatusBadge status={enc.status} /></div>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-400 mb-1">Benh nhan</p>
          <EntityDialogLink entity="patient" id={enc.patient?.id}>
            <p className="text-sm font-medium text-primary">{enc.patient?.name}</p>
          </EntityDialogLink>
        </div>
        {enc.department && (
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">Khoa</p>
            <p className="text-sm font-medium">{enc.department.name}</p>
          </div>
        )}
        {enc.bed && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
            <BedDouble size={16} className="text-blue-500" />
            <div>
              <p className="text-xs text-blue-400">Giuong</p>
              <p className="text-sm font-medium text-blue-700">{enc.bed.code}</p>
            </div>
          </div>
        )}
        {enc.chiefComplaint && (
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">Ly do vao vien</p>
            <p className="text-sm text-gray-700">{enc.chiefComplaint}</p>
          </div>
        )}
        {enc.admitDate && (
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">Ngay vao</p>
            <p className="text-sm font-medium">{format(new Date(enc.admitDate), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        )}
        {enc.vitals?.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Activity size={11} /> Sinh hieu gan nhat</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {enc.vitals[0].temperature && <div><span className="text-gray-400">Nhiet do:</span> <span className="font-medium">{enc.vitals[0].temperature}°C</span></div>}
              {enc.vitals[0].pulse && <div><span className="text-gray-400">Mach:</span> <span className="font-medium">{enc.vitals[0].pulse} bpm</span></div>}
              {enc.vitals[0].bpSystolic && <div><span className="text-gray-400">HA:</span> <span className="font-medium">{enc.vitals[0].bpSystolic}/{enc.vitals[0].bpDiastolic}</span></div>}
              {enc.vitals[0].spO2 && <div><span className="text-gray-400">SpO2:</span> <span className="font-medium">{enc.vitals[0].spO2}%</span></div>}
            </div>
          </div>
        )}
      </div>

      {/* Status transitions */}
      <div className="flex flex-wrap gap-2">
        {enc.status === 'REGISTERED' && (
          <button onClick={() => updateStatus.mutate('IN_PROGRESS')}
            className="px-4 py-2 bg-teal-50 text-teal-700 rounded-xl text-sm font-medium hover:bg-teal-100">Bat dau kham</button>
        )}
        {enc.status === 'IN_PROGRESS' && (
          <button onClick={() => updateStatus.mutate('ADMITTED')}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100">Nhap vien</button>
        )}
        {enc.status === 'ADMITTED' && (
          <button onClick={() => updateStatus.mutate('DISCHARGED')}
            className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100">Xuat vien</button>
        )}
      </div>
    </div>
  );
}
