import { Button } from './Button.jsx';

export function ConfirmationModal({ cancelLabel = 'Cancel', confirmLabel = 'Confirm', description, isLoading = false, onCancel, onConfirm, open, title, variant = 'primary' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm" role="presentation">
      <div aria-modal="true" className="w-full max-w-md rounded-2xl border border-warelyn-border bg-white p-6 shadow-2xl" role="dialog">
        <h2 className="text-lg font-bold tracking-tight text-warelyn-text">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-6 text-warelyn-muted">{description}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button disabled={isLoading} onClick={onCancel} variant="secondary">{cancelLabel}</Button>
          <Button isLoading={isLoading} onClick={onConfirm} variant={variant}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
