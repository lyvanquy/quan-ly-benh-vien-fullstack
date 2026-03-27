import { useEntityDialog, EntityType } from '@/store/entityDialogStore';
import { X, ChevronRight, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import PatientDialog from './entity-dialogs/PatientDialog';
import AppointmentDialog from './entity-dialogs/AppointmentDialog';
import EncounterDialog from './entity-dialogs/EncounterDialog';
import BillDialog from './entity-dialogs/BillDialog';
import LabOrderDialog from './entity-dialogs/LabOrderDialog';
import WorkflowNodeDialog from './entity-dialogs/WorkflowNodeDialog';
import DoctorDialog from './entity-dialogs/DoctorDialog';
import MedicineDialog from './entity-dialogs/MedicineDialog';
import BedDialog from './entity-dialogs/BedDialog';
import SurgeryDialog from './entity-dialogs/SurgeryDialog';
import ReferralDialog from './entity-dialogs/ReferralDialog';
import ConsentDialog from './entity-dialogs/ConsentDialog';
import TeleConsultDialog from './entity-dialogs/TeleConsultDialog';

const ENTITY_LABELS: Record<EntityType, string> = {
  patient: 'Benh nhan', appointment: 'Lich kham', doctor: 'Bac si',
  encounter: 'Dot dieu tri', bill: 'Hoa don', lab_order: 'Xet nghiem',
  medicine: 'Thuoc', bed: 'Giuong', surgery: 'Phau thuat',
  referral: 'Chuyen vien', consent: 'Dong thuan', teleconsult: 'Kham tu xa',
  workflow_node: 'Workflow Node',
};

const ENTITY_COLORS: Record<EntityType, { bg: string; text: string; dot: string }> = {
  patient:       { bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500' },
  appointment:   { bg: 'bg-indigo-50',  text: 'text-indigo-600',  dot: 'bg-indigo-500' },
  doctor:        { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  encounter:     { bg: 'bg-purple-50',  text: 'text-purple-600',  dot: 'bg-purple-500' },
  bill:          { bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500' },
  lab_order:     { bg: 'bg-teal-50',    text: 'text-teal-600',    dot: 'bg-teal-500' },
  medicine:      { bg: 'bg-pink-50',    text: 'text-pink-600',    dot: 'bg-pink-500' },
  bed:           { bg: 'bg-orange-50',  text: 'text-orange-600',  dot: 'bg-orange-500' },
  surgery:       { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500' },
  referral:      { bg: 'bg-cyan-50',    text: 'text-cyan-600',    dot: 'bg-cyan-500' },
  consent:       { bg: 'bg-lime-50',    text: 'text-lime-600',    dot: 'bg-lime-500' },
  teleconsult:   { bg: 'bg-violet-50',  text: 'text-violet-600',  dot: 'bg-violet-500' },
  workflow_node: { bg: 'bg-slate-50',   text: 'text-slate-600',   dot: 'bg-slate-400' },
};

type FrameProps = { frame: Parameters<typeof PatientDialog>[0]['frame']; onClose: () => void };

function DialogContent({ entity, frame, onClose }: { entity: EntityType } & FrameProps) {
  switch (entity) {
    case 'patient':       return <PatientDialog frame={frame} onClose={onClose} />;
    case 'appointment':   return <AppointmentDialog frame={frame} onClose={onClose} />;
    case 'encounter':     return <EncounterDialog frame={frame} onClose={onClose} />;
    case 'bill':          return <BillDialog frame={frame} onClose={onClose} />;
    case 'lab_order':     return <LabOrderDialog frame={frame} onClose={onClose} />;
    case 'workflow_node': return <WorkflowNodeDialog frame={frame} onClose={onClose} />;
    case 'doctor':        return <DoctorDialog frame={frame} onClose={onClose} />;
    case 'medicine':      return <MedicineDialog frame={frame} onClose={onClose} />;
    case 'bed':          return <BedDialog frame={frame} onClose={onClose} />;
    case 'surgery':      return <SurgeryDialog frame={frame} onClose={onClose} />;
    case 'referral':     return <ReferralDialog frame={frame} onClose={onClose} />;
    case 'consent':      return <ConsentDialog frame={frame} onClose={onClose} />;
    case 'teleconsult':  return <TeleConsultDialog frame={frame} onClose={onClose} />;
    default: return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">Dialog cho <span className="font-semibold text-gray-600">{entity}</span> chua duoc trien khai.</p>
      </div>
    );
  }
}

export default function EntityDialogRenderer() {
  const { stack, pop, clear } = useEntityDialog();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') pop(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pop]);

  useEffect(() => {
    if (stack.length === 0 && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('dlg');
      url.searchParams.delete('dlgId');
      window.history.replaceState({}, '', url.toString());
    }
  }, [stack.length]);

  if (stack.length === 0) return null;

  const current = stack[stack.length - 1];
  const colors = ENTITY_COLORS[current.entity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={clear} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-dialog flex flex-col max-h-[90vh] animate-scaleIn">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 shrink-0">
          {stack.length > 1 && (
            <button onClick={pop} className="btn-icon shrink-0"><ArrowLeft size={15} /></button>
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ${colors.bg} ${colors.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            {ENTITY_LABELS[current.entity]}
            {current.mode === 'create' && <span className="opacity-60 ml-1">— Tao moi</span>}
          </div>

          {stack.length > 1 && (
            <div className="flex items-center gap-1 text-xs text-gray-400 overflow-x-auto flex-1 min-w-0">
              {stack.slice(0, -1).map((frame, i) => (
                <span key={i} className="flex items-center gap-1 shrink-0">
                  <span>{ENTITY_LABELS[frame.entity]}</span>
                  <ChevronRight size={10} className="text-gray-300" />
                </span>
              ))}
              <span className="text-gray-700 font-medium shrink-0">{ENTITY_LABELS[current.entity]}</span>
            </div>
          )}

          <div className="flex-1" />
          <button onClick={clear} className="btn-icon shrink-0"><X size={16} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <DialogContent entity={current.entity} frame={current} onClose={pop} />
        </div>

        {/* Stack dots */}
        {stack.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-3 border-t border-gray-50 shrink-0">
            {stack.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-200 ${i === stack.length - 1 ? 'w-5 h-1.5 bg-primary-500' : 'w-1.5 h-1.5 bg-gray-200'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
