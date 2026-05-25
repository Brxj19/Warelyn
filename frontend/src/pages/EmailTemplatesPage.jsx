import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, Mail } from 'lucide-react';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../hooks/useToast.jsx';
import * as documentService from '../services/documentService.js';

const PLACEHOLDER_VARS = {
  EMAIL_VERIFICATION: [
    { label: 'Verification Code', value: '{{ code }}' },
    { label: 'Purpose', value: '{{ purpose }}' },
    { label: 'Expires In (minutes)', value: '{{ ttl_minutes }}' },
  ],
  INVOICE_SEND: [
    { label: 'Title', value: '{{ title }}' },
    { label: 'Intro Text', value: '{{ intro }}' },
    { label: 'Document Kind', value: '{{ document_kind }}' },
    { label: 'Document Number', value: '{{ document_number }}' },
    { label: 'Notes', value: '{{ notes }}' },
    { label: 'Sender Name', value: '{{ sender_name }}' },
  ],
  BILL_SEND: [
    { label: 'Title', value: '{{ title }}' },
    { label: 'Intro Text', value: '{{ intro }}' },
    { label: 'Document Kind', value: '{{ document_kind }}' },
    { label: 'Document Number', value: '{{ document_number }}' },
    { label: 'Notes', value: '{{ notes }}' },
    { label: 'Sender Name', value: '{{ sender_name }}' },
  ],
};
PLACEHOLDER_VARS.INVOICE_SEND_MODERN = PLACEHOLDER_VARS.INVOICE_SEND;
PLACEHOLDER_VARS.INVOICE_SEND_MINIMAL = PLACEHOLDER_VARS.INVOICE_SEND;
PLACEHOLDER_VARS.INVOICE_SEND_FORMAL = PLACEHOLDER_VARS.INVOICE_SEND;
PLACEHOLDER_VARS.BILL_SEND_MODERN = PLACEHOLDER_VARS.BILL_SEND;
PLACEHOLDER_VARS.BILL_SEND_MINIMAL = PLACEHOLDER_VARS.BILL_SEND;
PLACEHOLDER_VARS.BILL_SEND_FORMAL = PLACEHOLDER_VARS.BILL_SEND;
PLACEHOLDER_VARS.EMAIL_VERIFICATION_MODERN = PLACEHOLDER_VARS.EMAIL_VERIFICATION;
PLACEHOLDER_VARS.EMAIL_VERIFICATION_MINIMAL = PLACEHOLDER_VARS.EMAIL_VERIFICATION;

function TemplateCard({ template, onClick }) {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-warelyn-border hover:shadow-lg transition"
      onClick={onClick}
    >
      <div className="relative h-44 overflow-hidden bg-gray-50">
        <iframe
          srcDoc={template.body_template}
          title={template.name}
          className="absolute top-0 left-0 border-0 pointer-events-none"
          style={{ width: '560px', height: '700px', transform: 'scale(0.27)', transformOrigin: 'top left' }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-warelyn-primary shadow">Edit Template</span>
        </div>
      </div>
      <div className="p-2.5 border-t border-warelyn-border flex items-center justify-between">
        <span className="text-xs font-semibold text-warelyn-text truncate">{template.name}</span>
        <Badge tone={template.is_active ? 'success' : 'neutral'}>{template.is_active ? 'Active' : 'Off'}</Badge>
      </div>
    </div>
  );
}

function FormatToolbar({ textareaRef, onBodyChange, body }) {
  function applyFormat(openTag, closeTag) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.substring(start, end);
    const newBody = body.substring(0, start) + openTag + selected + closeTag + body.substring(end);
    onBodyChange(newBody);
    setTimeout(() => {
      el.selectionStart = start + openTag.length;
      el.selectionEnd = start + openTag.length + selected.length;
      el.focus();
    }, 0);
  }

  const tools = [
    { label: 'B', title: 'Bold', open: '<strong>', close: '</strong>', style: { fontWeight: 'bold' } },
    { label: 'I', title: 'Italic', open: '<em>', close: '</em>', style: { fontStyle: 'italic' } },
    { label: 'U', title: 'Underline', open: '<u>', close: '</u>', style: { textDecoration: 'underline' } },
    { label: 'S', title: 'Strikethrough', open: '<s>', close: '</s>', style: { textDecoration: 'line-through' } },
    { label: 'H1', title: 'Heading 1', open: '<h1>', close: '</h1>', style: { fontWeight: 'bold', fontSize: '14px' } },
    { label: 'H2', title: 'Heading 2', open: '<h2>', close: '</h2>', style: { fontWeight: 'bold', fontSize: '12px' } },
    { label: 'P', title: 'Paragraph', open: '<p>', close: '</p>', style: {} },
    { label: 'A', title: 'Link', open: '<a href="">', close: '</a>', style: { color: '#2563eb', textDecoration: 'underline' } },
  ];

  return (
    <div className="flex items-center gap-1 border border-warelyn-border border-b-0 bg-gray-50 px-3 py-2 rounded-t-lg">
      {tools.map((tool) => (
        <button
          key={tool.label}
          type="button"
          title={tool.title}
          style={tool.style}
          className="px-2 py-1 text-sm rounded hover:bg-warelyn-border transition text-warelyn-text"
          onClick={() => applyFormat(tool.open, tool.close)}
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}

function PlaceholderDropdown({ vars, onInsert }) {
  const [open, setOpen] = useState(false);

  if (!vars || vars.length === 0) return null;

  return (
    <div className="relative">
      <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
        Insert Placeholder <ChevronDown size={14} />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-warelyn-border bg-white py-1 shadow-lg">
          {vars.map((v) => (
            <button
              key={v.value}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50"
              onClick={() => { onInsert(v.value); setOpen(false); }}
              type="button"
            >
              <span className="font-medium">{v.label}</span>
              <span className="ml-2 text-xs text-warelyn-muted">{v.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmailTemplatesPage() {
  const { accessToken } = useAuth();
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', subject_template: '', body_template: '', body_template_text: '' });
  const [preview, setPreview] = useState(null);
  const bodyRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const data = await documentService.listTemplates(accessToken, 'EMAIL');
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
    setForm({
      name: template.name,
      subject_template: template.subject_template ?? '',
      body_template: template.body_template ?? '',
      body_template_text: template.body_template_text ?? '',
    });
    setPreview(null);
  }

  function insertAtCursor(placeholder) {
    const el = bodyRef.current;
    if (!el) {
      setForm((p) => ({ ...p, body_template: p.body_template + placeholder }));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = el.value;
    const newValue = value.substring(0, start) + placeholder + value.substring(end);
    setForm((p) => ({ ...p, body_template: newValue }));
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + placeholder.length;
      el.focus();
    }, 0);
  }

  async function handleSave() {
    if (!selected) return;
    try {
      await documentService.updateTemplate(accessToken, selected.id, {
        name: form.name,
        subject_template: form.subject_template,
        body_template: form.body_template,
        body_template_text: form.body_template_text,
      });
      toast.success('Template saved.');
      setSelected(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handlePreview() {
    if (!selected) return;
    try {
      const data = await documentService.previewTemplate(accessToken, selected.id, {});
      setPreview(data);
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <LoadingState message="Loading email templates..." />;
  if (error) return <ErrorState description={error} />;

  if (selected) {
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
            <p className="page-kicker">Email Templates</p>
            <h1>{selected.name}</h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Input label="Template Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <Input label="Subject" value={form.subject_template} onChange={(e) => setForm((p) => ({ ...p, subject_template: e.target.value }))} />

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-warelyn-text">Body (HTML)</span>
                <PlaceholderDropdown
                  vars={PLACEHOLDER_VARS[selected.template_key] ?? []}
                  onInsert={insertAtCursor}
                />
              </div>
              <FormatToolbar
                textareaRef={bodyRef}
                body={form.body_template}
                onBodyChange={(v) => setForm((p) => ({ ...p, body_template: v }))}
              />
              <textarea
                ref={bodyRef}
                className="block min-h-[250px] w-full rounded-b-lg rounded-t-none border border-warelyn-border bg-white px-3 py-2.5 font-mono text-sm text-warelyn-text shadow-sm outline-none transition focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10"
                value={form.body_template}
                onChange={(e) => setForm((p) => ({ ...p, body_template: e.target.value }))}
                rows={12}
              />
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-warelyn-text">Body (Plain Text)</span>
              <textarea
                className="block min-h-[100px] w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 font-mono text-sm text-warelyn-text shadow-sm outline-none transition focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10"
                value={form.body_template_text}
                onChange={(e) => setForm((p) => ({ ...p, body_template_text: e.target.value }))}
                rows={5}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>Save Template</Button>
              <Button onClick={handlePreview} variant="secondary">Preview</Button>
              <Button onClick={() => setSelected(null)} variant="ghost">Cancel</Button>
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-warelyn-text">Live Preview</span>
            <div className="rounded-xl border border-warelyn-border bg-white overflow-hidden" style={{ height: '600px' }}>
              <iframe srcDoc={form.body_template} title="Live preview" className="w-full h-full border-0" />
            </div>
            {preview && (
              <div className="mt-4 rounded-xl border border-warelyn-border bg-white p-4">
                <h3 className="text-sm font-semibold text-warelyn-text mb-2">Rendered Preview (with sample data)</h3>
                {preview.subject && <p className="mb-2 text-sm"><span className="font-medium">Subject:</span> {preview.subject}</p>}
                <div className="rounded border border-warelyn-border overflow-hidden" style={{ height: '300px' }}>
                  <iframe srcDoc={preview.body} title="Rendered preview" className="w-full h-full border-0" />
                </div>
              </div>
            )}
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
          <h1>Email Templates</h1>
          <p>Sent when specific events occur in your workspace.</p>
        </div>
      </div>

      {(() => {
        const verificationTpls = templates.filter((t) => t.template_key?.startsWith('EMAIL_VERIFICATION'));
        const invoiceTpls = templates.filter((t) => t.template_key?.startsWith('INVOICE_SEND'));
        const billTpls = templates.filter((t) => t.template_key?.startsWith('BILL_SEND'));

        return (
          <div className="space-y-8">
            {verificationTpls.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-warelyn-text mb-3">Verification</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {verificationTpls.map((template) => (
                    <TemplateCard key={template.id} template={template} onClick={() => openEditor(template)} />
                  ))}
                </div>
              </div>
            )}
            {invoiceTpls.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-warelyn-text mb-3">Invoice</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {invoiceTpls.map((template) => (
                    <TemplateCard key={template.id} template={template} onClick={() => openEditor(template)} />
                  ))}
                </div>
              </div>
            )}
            {billTpls.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-warelyn-text mb-3">Bill</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {billTpls.map((template) => (
                    <TemplateCard key={template.id} template={template} onClick={() => openEditor(template)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
