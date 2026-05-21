import { Input } from '../ui/Input.jsx';

export function BarcodeInput({ hint = 'Scan or paste a product barcode.', ...props }) {
  return (
    <div>
      <Input autoComplete="off" inputMode="text" label="Barcode" placeholder="Scan barcode" {...props} />
      <p className="mt-1 text-xs text-warelyn-muted">{hint}</p>
    </div>
  );
}
