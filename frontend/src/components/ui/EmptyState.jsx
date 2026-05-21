export function EmptyState({ title = 'Nothing here yet', description = 'Data will appear here once this workflow is implemented.' }) {
  return (
    <div className="rounded-2xl border border-dashed border-warelyn-border bg-white p-8 text-center">
      <h3 className="text-base font-semibold text-warelyn-text">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-warelyn-muted">{description}</p>
    </div>
  );
}
