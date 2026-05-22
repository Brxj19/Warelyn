export function EmptyState({ action, title = 'Nothing here yet', description = 'Data will appear here once this workflow is implemented.' }) {
  return (
    <div className="rounded-2xl border border-dashed border-warelyn-border bg-slate-50/70 p-8 text-center">
      <div className="mx-auto mb-4 h-10 w-10 rounded-2xl bg-white shadow-sm ring-1 ring-warelyn-border" />
      <h3 className="text-base font-semibold text-warelyn-text">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-warelyn-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
