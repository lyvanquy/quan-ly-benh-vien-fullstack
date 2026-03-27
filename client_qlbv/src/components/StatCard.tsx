import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  sub?: string;
  trend?: number;
}

export default function StatCard({ title, value, icon: Icon, color, sub, trend }: Props) {
  return (
    <div className="card-hover group relative overflow-hidden">
      {/* background glow */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[.07] bg-gradient-to-br ${color} blur-xl pointer-events-none`} />

      <div className="relative flex items-start justify-between gap-2 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${color} shadow-sm shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-lg ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="relative">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-extrabold text-gray-900 mt-0.5 leading-none tracking-tight">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{sub}</p>}
      </div>
    </div>
  );
}
