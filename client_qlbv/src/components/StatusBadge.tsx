import React from 'react';

type StatusConfig = { label: string; cls: string };

const STATUS_MAP: Record<string, StatusConfig> = {
  // Appointment
  PENDING:      { label: 'Chờ xác nhận', cls: 'bg-yellow-100 text-yellow-700 ring-yellow-200' },
  CONFIRMED:    { label: 'Đã xác nhận',  cls: 'bg-blue-100 text-blue-700 ring-blue-200' },
  CHECKED_IN:   { label: 'Đã check-in',  cls: 'bg-purple-100 text-purple-700 ring-purple-200' },
  IN_PROGRESS:  { label: 'Đang thực hiện', cls: 'bg-teal-100 text-teal-700 ring-teal-200' },
  COMPLETED:    { label: 'Hoàn thành',   cls: 'bg-green-100 text-green-700 ring-green-200' },
  CANCELLED:    { label: 'Đã hủy',       cls: 'bg-red-100 text-red-700 ring-red-200' },
  NO_SHOW:      { label: 'Vắng mặt',     cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
  // Bill
  UNPAID:       { label: 'Chưa thanh toán', cls: 'bg-red-100 text-red-700 ring-red-200' },
  PAID:         { label: 'Đã thanh toán',   cls: 'bg-green-100 text-green-700 ring-green-200' },
  PARTIAL:      { label: 'Thanh toán một phần', cls: 'bg-orange-100 text-orange-700 ring-orange-200' },
  REFUNDED:     { label: 'Đã hoàn tiền',    cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
  // Encounter
  REGISTERED:   { label: 'Đã đăng ký',   cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
  TRIAGED:      { label: 'Đã phân loại', cls: 'bg-yellow-100 text-yellow-700 ring-yellow-200' },
  ADMITTED:     { label: 'Đã nhập viện', cls: 'bg-blue-100 text-blue-700 ring-blue-200' },
  DISCHARGED:   { label: 'Đã xuất viện', cls: 'bg-green-100 text-green-700 ring-green-200' },
  // Surgery
  SCHEDULED:    { label: 'Đã lên lịch',  cls: 'bg-blue-100 text-blue-700 ring-blue-200' },
  // Lab
  RESULTED:     { label: 'Có kết quả',   cls: 'bg-green-100 text-green-700 ring-green-200' },
  REJECTED:     { label: 'Từ chối',      cls: 'bg-red-100 text-red-700 ring-red-200' },
  // Referral / TeleConsult
  ACCEPTED:     { label: 'Đã chấp nhận', cls: 'bg-green-100 text-green-700 ring-green-200' },
  DECLINED:     { label: 'Từ chối',      cls: 'bg-red-100 text-red-700 ring-red-200' },
  TRANSFERRED:  { label: 'Đã chuyển',    cls: 'bg-teal-100 text-teal-700 ring-teal-200' },
  ENDED:        { label: 'Đã kết thúc',  cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
  // Consent
  SIGNED:       { label: 'Đã ký',        cls: 'bg-green-100 text-green-700 ring-green-200' },
  UNSIGNED:     { label: 'Chưa ký',      cls: 'bg-yellow-100 text-yellow-700 ring-yellow-200' },
  REVOKED:      { label: 'Đã thu hồi',   cls: 'bg-red-100 text-red-700 ring-red-200' },
  // Bed
  AVAILABLE:    { label: 'Trống',        cls: 'bg-green-100 text-green-700 ring-green-200' },
  OCCUPIED:     { label: 'Đang dùng',    cls: 'bg-red-100 text-red-700 ring-red-200' },
  MAINTENANCE:  { label: 'Bảo trì',      cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
  RESERVED:     { label: 'Đã đặt',       cls: 'bg-blue-100 text-blue-700 ring-blue-200' },
  // Insurance
  ACTIVE:       { label: 'Hiệu lực',     cls: 'bg-green-100 text-green-700 ring-green-200' },
  EXPIRED:      { label: 'Hết hạn',      cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
  SUSPENDED:    { label: 'Tạm dừng',     cls: 'bg-yellow-100 text-yellow-700 ring-yellow-200' },
  // Claim
  SUBMITTED:    { label: 'Đã nộp',       cls: 'bg-blue-100 text-blue-700 ring-blue-200' },
  APPROVED:     { label: 'Đã duyệt',     cls: 'bg-green-100 text-green-700 ring-green-200' },
};

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const cfg = STATUS_MAP[status];
  const label = cfg?.label || status;
  const cls = cfg?.cls || 'bg-gray-100 text-gray-600 ring-gray-200';
  const sizeClass = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ring-1 ${sizeClass} ${cls}`}>
      {label}
    </span>
  );
}
