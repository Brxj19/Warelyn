import { useEffect, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../hooks/useToast.jsx';
import * as documentService from '../services/documentService.js';

const PDF_VARIABLES = {
  PDF_INVOICE: [
    'tenant.company_name', 'tenant.contact_email', 'tenant.phone', 'tenant.address', 'tenant.footer',
    'customer.name', 'customer.email', 'customer.phone',
    'invoice.invoice_number', 'invoice.invoice_date', 'invoice.due_date',
    'invoice.subtotal', 'invoice.tax_amount', 'invoice.discount_amount', 'invoice.total_amount', 'invoice.notes',
    'sales_order.so_number',
    'items[].product_name', 'items[].warehouse_name', 'items[].quantity', 'items[].unit_price', 'items[].tax_rate', 'items[].total_price',
  ],
  PDF_BILL: [
    'tenant.company_name', 'tenant.contact_email', 'tenant.phone', 'tenant.address', 'tenant.footer',
    'vendor.name', 'vendor.email', 'vendor.phone', 'vendor.address',
    'bill.bill_number', 'bill.bill_date', 'bill.due_date',
    'bill.subtotal', 'bill.tax_amount', 'bill.total_amount', 'bill.notes',
    'purchase_order.po_number',
    'items[].product_name', 'items[].warehouse_name', 'items[].quantity_ordered', 'items[].unit_price', 'items[].tax_rate', 'items[].total_price',
  ],
};
PDF_VARIABLES.PDF_INVOICE_MODERN = PDF_VARIABLES.PDF_INVOICE;
PDF_VARIABLES.PDF_INVOICE_MINIMAL = PDF_VARIABLES.PDF_INVOICE;
PDF_VARIABLES.PDF_INVOICE_BOLD = PDF_VARIABLES.PDF_INVOICE;
PDF_VARIABLES.PDF_INVOICE_WARM = PDF_VARIABLES.PDF_INVOICE;
PDF_VARIABLES.PDF_BILL_MODERN = PDF_VARIABLES.PDF_BILL;
PDF_VARIABLES.PDF_BILL_MINIMAL = PDF_VARIABLES.PDF_BILL;
PDF_VARIABLES.PDF_BILL_BOLD = PDF_VARIABLES.PDF_BILL;
PDF_VARIABLES.PDF_BILL_WARM = PDF_VARIABLES.PDF_BILL;

export function PdfTemplatesPage() {
  const { accessToken } = useAuth();
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', body_template: '' });
  const [variablesOpen, setVariablesOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await documentService.listTemplates(accessToken, 'PDF');
      setTemplates(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [accessToken]);

  function openEditor(template) {
    setSelected(template);
    setForm({ name: template.name, body_template: template.body_template ?? '' });
    setVariablesOpen(false);
  }

  async function handleSave() {
    if (!selected) return;
    try {
      await documentService.updateTemplate(accessToken, selected.id, {
        name: form.name,
        body_template: form.body_template,
      });
      toast.success('Template saved.');
      setSelected(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleDownloadPdf() {
    if (!selected) return;
    try {
      const blob = await documentService.previewTemplatePdf(accessToken, selected.id, {});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'preview.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <LoadingState message="Loading PDF templates..." />;
  if (error) return <ErrorState description={error} />;

  if (selected) {
    const vars = PDF_VARIABLES[selected.template_key] ?? [];
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-warelyn-muted hover:text-warelyn-text transition"
        >
          <ArrowLeft size={16} />
          Back to Templates
        </button>

        <div className="page-header">
          <div>
            <p className="page-kicker">PDF Templates</p>
            <h1>{selected.name}</h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Input label="Template Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <div>
              <span className="mb-2 block text-sm font-medium text-warelyn-text">HTML Source</span>
              <textarea
                className="block min-h-[400px] w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 font-mono text-xs text-warelyn-text shadow-sm outline-none transition focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10"
                value={form.body_template}
                onChange={(e) => setForm((p) => ({ ...p, body_template: e.target.value }))}
                rows={20}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save Template</Button>
              <Button variant="secondary" onClick={handleDownloadPdf}>Download PDF</Button>
              <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
            </div>

            <div>
              <button
                className="text-sm font-medium text-warelyn-primary hover:underline"
                onClick={() => setVariablesOpen((v) => !v)}
                type="button"
              >
                {variablesOpen ? 'Hide' : 'Show'} Available Variables
              </button>
              {variablesOpen && (
                <div className="mt-2 rounded-lg border border-warelyn-border bg-slate-50 p-3">
                  <ul className="space-y-1 text-xs font-mono text-warelyn-muted">
                    {vars.map((v) => <li key={v}>{`{{ ${v} }}`}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-warelyn-text">Live Preview (A4)</span>
            <div className="flex justify-center">
              <div
                className="relative bg-white border border-warelyn-border shadow-lg"
                style={{ width: '396px', height: '560px', overflow: 'hidden' }}
              >
                <iframe
                  srcDoc={form.body_template}
                  title="PDF preview"
                  className="absolute top-0 left-0 border-0 pointer-events-none"
                  style={{ width: '792px', height: '1120px', transform: 'scale(0.5)', transformOrigin: 'top left' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => window.history.back()}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-warelyn-muted hover:text-warelyn-text transition"
      >
        <ArrowLeft size={16} />
        Back to Settings
      </button>

      <div className="page-header">
        <div>
          <p className="page-kicker">Settings</p>
          <h1>PDF Templates</h1>
          <p>Invoice and bill PDF layouts.</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-warelyn-border hover:shadow-lg transition"
            onClick={() => openEditor(template)}
          >
            <div className="relative h-64 overflow-hidden bg-gray-50">
              <iframe
                srcDoc={template.body_template}
                title={template.name}
                className="absolute top-0 left-0 border-0 pointer-events-none"
                style={{ width: '333%', height: '333%', transform: 'scale(0.3)', transformOrigin: 'top left' }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-warelyn-primary shadow">Edit Template</span>
              </div>
            </div>
            <div className="p-3 border-t border-warelyn-border flex items-center justify-between">
              <span className="text-sm font-semibold text-warelyn-text">{template.name}</span>
              <Badge tone={template.is_active ? 'success' : 'neutral'}>{template.is_active ? 'Active' : 'Off'}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
