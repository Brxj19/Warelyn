import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Mail } from 'lucide-react';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
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

export function EmailTemplatesPage() {
  const { accessToken } = useAuth();
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', subject_template: '', body_template: '', body_template_text: '' });
  const [preview, setPreview] = useState(null);
  const [placeholderOpen, setPlaceholderOpen] = useState(false);
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
    setPlaceholderOpen(false);
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
    setPlaceholderOpen(false);
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

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-kicker">Settings</p>
          <h1>Email Templates</h1>
          <p>Sent when specific events occur in your workspace.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-3">
          {templates.map((template) => (
            <Card key={template.id} className="cursor-pointer hover:shadow-md transition" onClick={() => openEditor(template)}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-warelyn-primary" />
                    <div>
                      <h3 className="text-sm font-semibold text-warelyn-text">{template.name}</h3>
                      <p className="text-xs text-warelyn-muted">{template.subject_template}</p>
                    </div>
                  </div>
                  <Badge tone="neutral">DEFAULT</Badge>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {selected ? (
          <div className="lg:w-[500px] space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold text-warelyn-text">{selected.name} — Edit</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input label="Template Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                <Input label="Subject" value={form.subject_template} onChange={(e) => setForm((p) => ({ ...p, subject_template: e.target.value }))} />
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-warelyn-text">Body (HTML)</span>
                    <div className="relative">
                      <Button size="sm" variant="secondary" onClick={() => setPlaceholderOpen((v) => !v)}>
                        Insert Placeholder <ChevronDown size={14} />
                      </Button>
                      {placeholderOpen && PLACEHOLDER_VARS[selected.template_key] ? (
                        <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-warelyn-border bg-white py-1 shadow-lg">
                          {PLACEHOLDER_VARS[selected.template_key].map((v) => (
                            <button
                              key={v.value}
                              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50"
                              onClick={() => insertAtCursor(v.value)}
                              type="button"
                            >
                              <span className="font-medium">{v.label}</span>
                              <span className="ml-2 text-xs text-warelyn-muted">{v.value}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <textarea
                    ref={bodyRef}
                    className="block min-h-[200px] w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 font-mono text-sm text-warelyn-text shadow-sm outline-none transition focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10"
                    value={form.body_template}
                    onChange={(e) => setForm((p) => ({ ...p, body_template: e.target.value }))}
                    rows={10}
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
                  <Button onClick={handlePreview} variant="secondary">Preview</Button>
                  <Button onClick={handleSave}>Save</Button>
                  <Button onClick={() => setSelected(null)} variant="ghost">Cancel</Button>
                </div>
              </CardBody>
            </Card>

            {preview ? (
              <Card>
                <CardHeader><h3 className="text-sm font-semibold text-warelyn-text">Preview</h3></CardHeader>
                <CardBody>
                  {preview.subject ? <p className="mb-2 text-sm font-medium">Subject: {preview.subject}</p> : null}
                  <div className="rounded border border-warelyn-border bg-white p-2">
                    <iframe
                      srcDoc={preview.body}
                      title="Email preview"
                      className="w-full border-0"
                      style={{ minHeight: '200px' }}
                    />
                  </div>
                </CardBody>
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
