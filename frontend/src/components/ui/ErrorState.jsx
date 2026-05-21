export function ErrorState({ title = 'Something went wrong', description = 'Please retry or contact support if the issue continues.' }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <h3 className="text-base font-semibold text-warelyn-danger">{title}</h3>
      <p className="mt-2 text-sm text-red-700">{description}</p>
    </div>
  );
}
