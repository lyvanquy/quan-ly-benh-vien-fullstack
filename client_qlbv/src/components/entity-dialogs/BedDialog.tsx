import { useQuery } from 'react-query';
import api from '@/lib/axios';
import { DialogFrame } from '@/store/entityDialogStore';
import { BedDouble } from 'lucide-react';

interface Props { frame: DialogFrame; onClose: () => void; }

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE:   'badge-completed',
  OCCUPIED:    'badge-pending',
  RESERVED:    'badge-info',
  MAINTENANCE: 'badge-warning',
};

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Trong', OCCUPIED: 'Co benh nhan', RESERVED: 'Da dat', MAINTENANCE: 'Bao tri',
};

export default function BedDialog({ frame }: Props) {
  const { data: bed, isLoading } = useQuery(
    ['bed-dlg', frame.id],
    () => api.get(`/beds/${frame.id}`).then(r => r.data.data),
    { enabled: !!frame.id }
  );

  if (isLoading) return <div className="skeleton h-48 rounded-xl" />;
  if (!bed) return <div className="text-center py-12 text-gray-400">Khong tim thay giuong</div>;

  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0">
          <BedDouble size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">Giuong {bed.code}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge ${STATUS_COLOR[bed.status] || 'badge-info'}`}>
              {STATUS_LABEL[bed.status] || bed.status}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <div className="space-y-2 text-sm">
          {bed.room && (
            <>
              <Row label="Phong" value={bed.room.name} />
              {bed.room.ward && <Row label="Khoa" value={bed.room.ward.name} />}
              {bed.room.type && <Row label="Loai phong" value={bed.room.type} />}
            </>
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
