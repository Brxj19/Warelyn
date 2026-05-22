import { Inbox } from 'lucide-react';

export function EmptyState({ action, icon: Icon = Inbox, title = 'Nothing here yet', description = 'Data will appear here once this workflow is implemented.' }) {
  return (
    <div className="rounded-2xl border border-dashed border-warelyn-border bg-slate-50/70 p-8 text-center">
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-warelyn-border">
        <Icon className="text-warelyn-primary" size={18} />
      </div>
      <h3 className="text-base font-semibold text-warelyn-text">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-warelyn-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
