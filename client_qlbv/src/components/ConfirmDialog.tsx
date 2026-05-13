import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Xác nhận hành động',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  confirmText = 'Xác nhận',
  confirmVariant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="flex flex-col items-center text-center pt-2 pb-4 px-2">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
          confirmVariant === 'danger' ? 'bg-red-50' : 'bg-primary-50'
        }`}>
          <AlertTriangle size={24} className={confirmVariant === 'danger' ? 'text-red-500' : 'text-primary-500'} />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed max-w-sm">{message}</p>
        <div className="flex gap-3 mt-6 w-full justify-center">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary min-w-24"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`min-w-24 ${confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
          >
            {isLoading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
