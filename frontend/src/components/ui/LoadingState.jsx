export function LoadingState({ message = 'Loading Warelyn workspace...' }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-warelyn-border bg-white p-8 text-center">
      <div>
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-warelyn-primary" />
        <p className="text-sm font-medium text-warelyn-muted">{message}</p>
      </div>
    </div>
  );
}
