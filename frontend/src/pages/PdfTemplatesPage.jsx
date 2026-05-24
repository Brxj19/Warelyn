import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';

import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
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

function TemplateCard({ template, onEdit }) {
  return (
    <div className="group relative cursor-pointer overflow-hidden rounded-xl border border-warelyn-border hover:shadow-lg transition">
      <div className="relative h-64 overflow-hidden bg-gray-50">
        <iframe
          srcDoc={template.body_template}
          title={template.name}
          className="absolute top-0 left-0 border-0 pointer-events-none"
          style={{ width: '333%', height: '333%', transform: 'scale(0.3)', transformOrigin: 'top left' }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
          <Button className="opacity-0 group-hover:opacity-100 transition" variant="primary" onClick={() => onEdit(template)}>
            Edit Template
          </Button>
        </div>
      </div>
      <div className="p-3 flex items-center gap-2">
        <span className="text-sm font-semibold text-warelyn-text">{template.name}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
          DEFAULT
        </span>
      </div>
    </div>
  );
}

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
        <div className="page-header">
          <div>
            <p className="page-kicker">Settings</p>
            <h1>Edit: {selected.name}</h1>
          </div>
          <Button variant="ghost" onClick={() => setSelected(null)}>Back to Gallery</Button>
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
              <Button onClick={handleSave}>Save</Button>
              <Button variant="secondary" onClick={handleDownloadPdf}>Download PDF Preview</Button>
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
              {variablesOpen ? (
                <div className="mt-2 rounded-lg border border-warelyn-border bg-slate-50 p-3">
                  <ul className="space-y-1 text-xs font-mono text-warelyn-muted">
                    {vars.map((v) => <li key={v}>{`{{ ${v} }}`}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-warelyn-text">Live Preview</span>
            <div className="rounded-xl border border-warelyn-border bg-white overflow-hidden" style={{ height: '600px' }}>
              <iframe
                srcDoc={form.body_template}
                title="PDF preview"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-kicker">Settings</p>
          <h1>PDF Templates</h1>
          <p>Invoice and bill PDF templates.</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} onEdit={openEditor} />
        ))}
      </div>
    </div>
  );
}
