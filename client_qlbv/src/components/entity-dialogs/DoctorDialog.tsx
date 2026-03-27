import { useQuery } from 'react-query';
import api from '@/lib/axios';
import { DialogFrame } from '@/store/entityDialogStore';
import EntityRelationTabs from '@/components/EntityRelationTabs';
import { UserRound, Stethoscope, Star, DoorOpen } from 'lucide-react';

interface Props { frame: DialogFrame; onClose: () => void; }

export default function DoctorDialog({ frame }: Props) {
  const { data: doctor, isLoading } = useQuery(
    ['doctor-dlg', frame.id],
    () => api.get(`/doctors/${frame.id}`).then(r => r.data.data),
    { enabled: !!frame.id }
  );

  if (isLoading) return <div className="flex items-center justify-center h-48"><div className="skeleton h-full w-full rounded-xl" /></div>;
  if (!doctor) return <div className="text-center py-12 text-gray-400">Khong tim thay bac si</div>;

  const user = doctor.user || {};

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-sm">
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">BS. {user.name}</h2>
          <p className="text-sm text-emerald-600 font-medium mt-0.5">{doctor.specialty}</p>
          <div className="flex items-center gap-3 mt-2">
            {doctor.experienceYears > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Star size={11} /> {doctor.experienceYears} nam kinh nghiem
              </span>
            )}
            {doctor.roomNumber && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <DoorOpen size={11} /> Phong {doctor.roomNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <UserRound size={12} /> Thong tin
          </h4>
          <div className="space-y-2 text-sm">
            <Row label="Email" value={user.email} />
            <Row label="SDT" value={user.phone || 'Chua cap nhat'} />
            <Row label="Vai tro" value={user.role} />
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Stethoscope size={12} /> Chuyen mon
          </h4>
          <div className="space-y-2 text-sm">
            <Row label="Chuyen khoa" value={doctor.specialty} />
            <Row label="Kinh nghiem" value={`${doctor.experienceYears} nam`} />
            {doctor.bio && <p className="text-xs text-gray-500 mt-2 leading-relaxed">{doctor.bio}</p>}
          </div>
        </div>
      </div>

      {/* Relation tabs from graph */}
      <EntityRelationTabs entity="doctor" id={frame.id!} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 text-xs w-24 shrink-0">{label}:</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
