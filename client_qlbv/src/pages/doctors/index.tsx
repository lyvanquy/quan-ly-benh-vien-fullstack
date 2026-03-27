import { useQuery } from 'react-query';
import Layout from '@/components/Layout';
import api from '@/lib/axios';
import { UserRound, Stethoscope, DoorOpen } from 'lucide-react';

interface Doctor {
  id: string; specialty: string; experienceYears: number; roomNumber: string;
  user: { name: string; email: string; phone: string; avatar: string };
}

export default function DoctorsPage() {
  const { data: doctors = [], isLoading } = useQuery('doctors', () => api.get('/doctors').then(r => r.data.data));

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bác sĩ</h1>
        <p className="text-gray-500 text-sm mt-1">Danh sách bác sĩ trong bệnh viện</p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {doctors.map((d: Doctor) => (
            <div key={d.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
                  <UserRound size={22} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{d.user.name}</p>
                  <p className="text-xs text-gray-500">{d.user.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Stethoscope size={14} /><span>{d.specialty}</span></div>
                <div className="flex items-center gap-2"><span className="text-gray-400">Kinh nghiệm:</span>{d.experienceYears} năm</div>
                {d.roomNumber && <div className="flex items-center gap-2"><DoorOpen size={14} /><span>Phòng {d.roomNumber}</span></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
