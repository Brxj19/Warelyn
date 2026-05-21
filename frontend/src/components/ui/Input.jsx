export function Input({ className = '', label, id, ...props }) {
  return (
    <label className="block" htmlFor={id}>
      {label ? <span className="mb-2 block text-sm font-medium text-warelyn-text">{label}</span> : null}
      <input
        id={id}
        className={`block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm text-warelyn-text shadow-sm outline-none transition placeholder:text-slate-400 focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10 ${className}`}
        {...props}
      />
    </label>
  );
}
