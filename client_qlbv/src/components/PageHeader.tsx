import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Optional icon component from lucide-react */
  icon?: React.ElementType;
  /** Optional stat badges shown below title */
  stats?: { label: string; value: string | number; color?: string }[];
}

export default function PageHeader({ title, subtitle, actions, icon: Icon, stats }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-0.5">
            {Icon && (
              <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-primary-500" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight truncate">{title}</h1>
          </div>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5 ml-10">{subtitle}</p>}
          {stats && stats.length > 0 && (
            <div className="flex items-center gap-3 mt-3 ml-10 flex-wrap">
              {stats.map((s, i) => (
                <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                  s.color === 'blue'    ? 'bg-blue-50 text-blue-700' :
                  s.color === 'green'   ? 'bg-emerald-50 text-emerald-700' :
                  s.color === 'red'     ? 'bg-red-50 text-red-700' :
                  s.color === 'amber'   ? 'bg-amber-50 text-amber-700' :
                  s.color === 'violet'  ? 'bg-violet-50 text-violet-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  <span className="font-bold">{s.value}</span>
                  <span className="opacity-70">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
