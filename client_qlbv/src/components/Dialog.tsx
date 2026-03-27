import { ReactNode, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

type DialogVariant = 'modal' | 'drawer' | 'panel';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: DialogVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: ReactNode;
}

const modalSizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl' };
const drawerSizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

export default function Dialog({ open, onClose, title, subtitle, children, footer, variant = 'modal', size = 'md', icon }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  if (variant === 'drawer') {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative ml-auto h-full ${drawerSizes[size]} w-full bg-white shadow-2xl flex flex-col
          animate-[slideInRight_0.25s_ease-out]`}>
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            {icon && <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">{title}</h2>
              {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
          {footer && <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">{footer}</div>}
        </div>
      </div>
    );
  }

  if (variant === 'panel') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full ${modalSizes[size]} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]
          animate-[slideUp_0.3s_ease-out]`}>
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 sm:hidden" />
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            {icon && <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900">{title}</h2>
              {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
          {footer && <div className="px-6 py-4 border-t border-gray-100">{footer}</div>}
        </div>
      </div>
    );
  }

  // Default: modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${modalSizes[size]} bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]
        animate-[scaleIn_0.2s_ease-out]`}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          {icon && <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

// Breadcrumb helper for dialog navigation
export function DialogBreadcrumb({ items }: { items: string[] }) {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} />}
          <span className={i === items.length - 1 ? 'text-gray-700 font-medium' : ''}>{item}</span>
        </span>
      ))}
    </div>
  );
}

// Info row helper
export function InfoRow({ label, value, className = '' }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={`flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0 ${className}`}>
      <span className="text-xs text-gray-400 w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 flex-1">{value}</span>
    </div>
  );
}
