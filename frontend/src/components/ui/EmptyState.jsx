import { Inbox } from 'lucide-react';

const illustrations = {
  warehouse: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="24" width="48" height="32" rx="4" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2"/>
      <path d="M8 28L32 12L56 28" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round"/>
      <rect x="20" y="36" width="10" height="12" rx="2" fill="#BFDBFE" stroke="#1E3A8A" strokeWidth="1.5"/>
      <rect x="34" y="36" width="10" height="12" rx="2" fill="#BFDBFE" stroke="#1E3A8A" strokeWidth="1.5"/>
      <rect x="26" y="48" width="12" height="8" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="1.5"/>
    </svg>
  ),
  clipboard: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="10" width="36" height="46" rx="4" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2"/>
      <rect x="24" y="6" width="16" height="8" rx="3" fill="#BFDBFE" stroke="#1E3A8A" strokeWidth="1.5"/>
      <line x1="22" y1="26" x2="42" y2="26" stroke="#1E3A8A" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="22" y1="34" x2="38" y2="34" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="22" y1="42" x2="40" y2="42" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  bell: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8C24 8 18 14 18 22V34L14 40H50L46 34V22C46 14 40 8 32 8Z" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2"/>
      <path d="M26 44C26 47.3 28.7 50 32 50C35.3 50 38 47.3 38 44" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="44" cy="16" r="6" fill="#BFDBFE" stroke="#1E3A8A" strokeWidth="1.5"/>
    </svg>
  ),
};

export function EmptyState({ action, icon: Icon = Inbox, illustration, title = 'Nothing here yet', description = 'Data will appear here once this workflow is implemented.' }) {
  return (
    <div className="rounded-2xl border border-dashed border-warelyn-border bg-slate-50/70 p-8 text-center">
      {illustration && illustrations[illustration] ? (
        <div className="mx-auto mb-4 flex items-center justify-center">
          {illustrations[illustration]}
        </div>
      ) : (
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-warelyn-border">
          <Icon className="text-warelyn-primary" size={18} />
        </div>
      )}
      <h3 className="text-base font-semibold text-warelyn-text">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-warelyn-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
