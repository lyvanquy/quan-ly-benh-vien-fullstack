import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import api from '@/lib/axios';
import { BedDouble } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: 'bg-green-100 border-green-300 text-green-700',
  OCCUPIED: 'bg-red-100 border-red-300 text-red-700',
  RESERVED: 'bg-yellow-100 border-yellow-300 text-yellow-700',
  MAINTENANCE: 'bg-gray-100 border-gray-300 text-gray-500',
};
const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Trong', OCCUPIED: 'Co benh nhan', RESERVED: 'Da dat', MAINTENANCE: 'Bao tri',
};

export default function BedsPage() {
  const qc = useQueryClient();
  const { data: wards = [], isLoading } = useQuery('beds-map', () =>
    api.get('/beds/map').then(r => r.data.data));

  // Compute stats from ward data
  const allBeds = (wards as Record<string, unknown>[]).flatMap(w =>
    ((w.rooms as Record<string, unknown>[]) ?? []).flatMap(r =>
      (r.beds as Record<string, unknown>[]) ?? []
    )
  );
  const stats = {
    total: allBeds.length,
    available: allBeds.filter(b => b.status === 'AVAILABLE').length,
    occupied: allBeds.filter(b => b.status === 'OCCUPIED').length,
    reserved: allBeds.filter(b => b.status === 'RESERVED').length,
    maintenance: allBeds.filter(b => b.status === 'MAINTENANCE').length,
  };

  if (isLoading) return <Layout><div className="flex items-center justify-center h-40 text-gray-400">Dang tai...</div></Layout>;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ban do giuong benh</h1>
        <p className="text-gray-500 text-sm mt-1">Trang thai giuong theo khoa phong</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Tong so', value: stats.total, cls: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Trong', value: stats.available, cls: 'bg-green-50 text-green-700 border-green-200' },
          { label: 'Co benh nhan', value: stats.occupied, cls: 'bg-red-50 text-red-700 border-red-200' },
          { label: 'Da dat', value: stats.reserved, cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
          { label: 'Bao tri', value: stats.maintenance, cls: 'bg-gray-50 text-gray-600 border-gray-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 text-center ${s.cls}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-sm">
            <div className={`w-4 h-4 rounded border ${STATUS_COLOR[k]}`} />
            <span className="text-gray-600">{v}</span>
          </div>
        ))}
      </div>

      {(wards as Record<string, unknown>[]).length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-gray-400">
          <BedDouble size={48} className="mb-3 opacity-30" />
          <p>Chua co du lieu giuong. Hay chay seed de tao du lieu mau.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(wards as Record<string, unknown>[]).map((ward) => (
            <div key={ward.id as string} className="card">
              <h3 className="font-semibold text-gray-900 mb-4">{ward.name as string}
                <span className="ml-2 text-sm font-normal text-gray-500">({ward.code as string})</span>
              </h3>
              {(ward.rooms as Record<string, unknown>[])?.map((room) => (
                <div key={room.id as string} className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">{room.name as string}</p>
                  <div className="flex flex-wrap gap-3">
                    {(room.beds as Record<string, unknown>[])?.map((bed) => (
                      <EntityDialogLink key={bed.id as string} entity="bed" id={bed.id as string}>
                        <div
                          className={`relative w-24 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-all hover:shadow-md ${STATUS_COLOR[bed.status as string]}`}
                          title={`${bed.code} - ${STATUS_LABEL[bed.status as string]}`}>
                          <BedDouble size={20} />
                          <span className="text-xs font-medium mt-1">{bed.code as string}</span>
                        </div>
                      </EntityDialogLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
