const tones = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  primary: 'bg-blue-50 text-warelyn-primary ring-blue-200',
  slate: 'bg-slate-900 text-white ring-slate-800',
};

const statusTones = {
  ACCEPTED_BLOCKED: 'warning',
  ACCEPTED_RESTOCK: 'success',
  CANCELLED: 'danger',
  CLOSED: 'neutral',
  COMMITTED: 'success',
  CONFIRMED: 'primary',
  DAMAGED: 'danger',
  DRAFT: 'neutral',
  FULFILLED: 'success',
  OPEN: 'primary',
  PACKED: 'success',
  PARTIALLY_FULFILLED: 'warning',
  PARTIALLY_RECEIVED: 'warning',
  PENDING: 'warning',
  PICKED: 'success',
  RECEIVED: 'success',
  REJECTED: 'danger',
  SCRAPPED: 'danger',
  SUBMITTED: 'primary',
};

export function Badge({ children, className = '', tone = 'neutral' }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tones[tone] ?? tones.neutral} ${className}`}>{children}</span>;
}

export function StatusBadge({ children, status, className = '' }) {
  const value = status ?? children;
  return <Badge className={className} tone={statusTones[value] ?? 'neutral'}>{children ?? value}</Badge>;
}
