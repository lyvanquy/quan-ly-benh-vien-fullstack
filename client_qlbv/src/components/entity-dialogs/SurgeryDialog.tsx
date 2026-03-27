import { useQuery } from 'react-query';
import api from '@/lib/axios';
import { DialogFrame } from '@/store/entityDialogStore';
import EntityDialogLink from '@/components/EntityDialogLink';
import { format } from 'date-fns';
import { Scissors, Clock, User } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

interface Props { frame: DialogFrame; onClose: () => void; }

export default function SurgeryDialog({ frame }: Props) {
  const { data: surgery, isLoading } = useQuery(
    ['surgery-dlg', frame.id],
    () => api.get(`/surgery/${frame.id}`).then(r => r.data.data),
    { enabled: !!frame.id }
  );

  if (isLoading) return <div className="skeleton h-48 rounded-xl" />;
  if (!surgery) return <div className="text-center py-12 text-gray-400">Khong tim thay phau thuat</div>;

  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shrink-0">
          <Scissors size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{surgery.procedureName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={surgery.status} />
            {surgery.anesthesiaType && (
              <span className="text-xs text-gray-400">Gay me: {surgery.anesthesiaType}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Clock size={12} /> Thoi gian
          </h4>
          <div className="space-y-2 text-sm">
            <Row label="Du kien bat dau" value={format(new Date(surgery.scheduledStart), 'dd/MM/yyyy HH:mm')} />
            <Row label="Du kien ket thuc" value={format(new Date(surgery.scheduledEnd), 'dd/MM/yyyy HH:mm')} />
            {surgery.actualStart && <Row label="Bat dau thuc te" value={format(new Date(surgery.actualStart), 'dd/MM/yyyy HH:mm')} />}
            {surgery.actualEnd && <Row label="Ket thuc thuc te" value={format(new Date(surgery.actualEnd), 'dd/MM/yyyy HH:mm')} />}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <User size={12} /> Lien quan
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-gray-400 text-xs w-24 shrink-0">Benh nhan:</span>
              <EntityDialogLink entity="patient" id={surgery.patientId} className="text-sm font-medium">
                {surgery.patient?.name}
              </EntityDialogLink>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-400 text-xs w-24 shrink-0">Phau thuat vien:</span>
              <EntityDialogLink entity="doctor" id={surgery.surgeonId} className="text-sm font-medium">
                BS. {surgery.surgeon?.user?.name}
              </EntityDialogLink>
            </div>
          </div>
        </div>
      </div>

      {surgery.preOpNote && (
        <div className="mt-4 bg-blue-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-600 mb-1">Ghi chu truoc phau thuat</p>
          <p className="text-sm text-gray-700">{surgery.preOpNote}</p>
        </div>
      )}
      {surgery.postOpNote && (
        <div className="mt-3 bg-green-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-green-600 mb-1">Ghi chu sau phau thuat</p>
          <p className="text-sm text-gray-700">{surgery.postOpNote}</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 text-xs w-28 shrink-0">{label}:</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
