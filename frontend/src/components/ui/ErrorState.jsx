export function ErrorState({ action, title = 'Something went wrong', description = 'Please retry or contact support if the issue continues.' }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <div className="flex gap-3">
        <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-warelyn-danger" />
        <div>
          <h3 className="text-base font-semibold text-warelyn-danger">{title}</h3>
          <p className="mt-2 text-sm text-red-700">{description}</p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
