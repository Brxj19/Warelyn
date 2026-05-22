import { Input } from '../ui/Input.jsx';

export function BarcodeInput({ hint = 'Scan or paste a product barcode.', ...props }) {
  return (
    <div>
      <Input autoComplete="off" helper={hint} inputMode="text" label="Barcode" placeholder="Scan barcode" {...props} />
    </div>
  );
}
