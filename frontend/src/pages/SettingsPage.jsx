import { CheckCircle2, FileText, Mail, Smartphone, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge, StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../hooks/useToast.jsx';
import * as settingsService from '../services/settingsService.js';
import * as verificationService from '../services/verificationService.js';
import * as documentService from '../services/documentService.js';

function TenantSettingsSection({ accessToken }) {
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    settingsService.getTenantSettings(accessToken)
      .then((data) => {
        setSettings(data);
        setForm({
          company_display_name: data?.company_display_name ?? '',
          contact_email: data?.contact_email ?? '',
          phone: data?.phone ?? '',
          address_line1: data?.address_line1 ?? '',
          address_line2: data?.address_line2 ?? '',
          city: data?.city ?? '',
          state: data?.state ?? '',
          country: data?.country ?? '',
          postal_code: data?.postal_code ?? '',
          timezone: data?.timezone ?? 'UTC',
          currency: data?.currency ?? 'USD',
          tax_id: data?.tax_id ?? '',
          over_receive_tolerance: data?.over_receive_tolerance ?? '',
          low_stock_alert_enabled: data?.low_stock_alert_enabled ?? true,
          document_logo_url: data?.document_logo_url ?? '',
          document_footer: data?.document_footer ?? '',
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [accessToken]);

  function handleChange(field) {
    return (e) => setForm((p) => ({ ...p, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  }

  async function handleSave() {
    try {
      const data = {};
      for (const [key, value] of Object.entries(form)) {
        if (value !== (settings?.[key] ?? '')) data[key] = value;
      }
      if (Object.keys(data).length > 0) {
        const updated = await settingsService.updateTenantSettings(accessToken, data);
        setSettings(updated);
        toast.success('Settings saved successfully.');
      }
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <LoadingState message="Loading tenant settings..." />;
  if (error) return <ErrorState description={error} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><h3 className="text-base font-semibold text-warelyn-text">Company Profile</h3></CardHeader>
        <CardBody>
          <p className="mb-4 text-sm text-warelyn-muted">Basic company information for this tenant.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company Display Name" value={form.company_display_name} onChange={handleChange('company_display_name')} />
            <Input label="Contact Email" type="email" value={form.contact_email} onChange={handleChange('contact_email')} />
            <Input label="Phone" value={form.phone} onChange={handleChange('phone')} />
            <Input label="Address Line 1" value={form.address_line1} onChange={handleChange('address_line1')} />
            <Input label="Address Line 2" value={form.address_line2} onChange={handleChange('address_line2')} />
            <Input label="City" value={form.city} onChange={handleChange('city')} />
            <Input label="State" value={form.state} onChange={handleChange('state')} />
            <Input label="Country" value={form.country} onChange={handleChange('country')} />
            <Input label="Postal Code" value={form.postal_code} onChange={handleChange('postal_code')} />
            <Input label="Timezone" value={form.timezone} onChange={handleChange('timezone')} />
            <Input label="Currency" value={form.currency} onChange={handleChange('currency')} />
            <Input label="Tax ID" value={form.tax_id} onChange={handleChange('tax_id')} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-warelyn-text">Inventory Preferences</h3></CardHeader>
        <CardBody>
          <p className="mb-4 text-sm text-warelyn-muted">Default inventory behavior for this tenant.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Over-Receive Tolerance" value={form.over_receive_tolerance} onChange={handleChange('over_receive_tolerance')} helper="e.g. 10%" />
            <label className="flex items-center gap-2">
              <input checked={form.low_stock_alert_enabled} onChange={handleChange('low_stock_alert_enabled')} type="checkbox" className="h-4 w-4 rounded border-warelyn-border text-warelyn-primary focus:ring-warelyn-primary" />
              <span className="text-sm font-medium text-warelyn-text">Low stock alert enabled</span>
            </label>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-warelyn-text">Documents</h3></CardHeader>
        <CardBody>
          <p className="mb-4 text-sm text-warelyn-muted">Customize generated documents.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Document Logo URL" value={form.document_logo_url} onChange={handleChange('document_logo_url')} helper="URL to your company logo" />
            <div className="sm:col-span-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-warelyn-text">Document Footer</span>
                <textarea className="block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm text-warelyn-text shadow-sm outline-none transition placeholder:text-slate-400 focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10" value={form.document_footer} onChange={handleChange('document_footer')} rows={3} />
              </label>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}

function VerificationSection() {
  const { accessToken } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    verificationService.getVerificationStatus(accessToken).then(setStatus).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) return <LoadingState message="Loading verification status..." />;
  if (error) return <ErrorState description={error} />;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-warelyn-primary" />
            <h3 className="text-sm font-bold text-warelyn-text">Email</h3>
            {status?.email_verified ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-amber-500" />}
          </div>
        </CardHeader>
        <CardBody>
          <p className="mb-1 text-sm text-warelyn-text">{status?.email ?? '-'}</p>
          <Badge tone={status?.email_verified ? 'success' : 'warning'}>{status?.email_verified ? 'Verified' : 'Not verified'}</Badge>
          <div className="mt-4">
            <Link to="/verify-email">
              <Button size="sm" variant={status?.email_verified ? 'secondary' : 'primary'}>{status?.email_verified ? 'Re-verify' : 'Verify Now'}</Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-warelyn-text">Phone</h3>
            {status?.phone_verified ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-amber-500" />}
          </div>
        </CardHeader>
        <CardBody>
          <p className="mb-1 text-sm text-warelyn-text">{status?.phone ?? '-'}</p>
          <Badge tone={status?.phone_verified ? 'success' : 'warning'}>{status?.phone_verified ? 'Verified' : 'Not verified'}</Badge>
          <div className="mt-4">
            {status?.phone ? (
              <Link to="/verify-phone">
                <Button size="sm" variant={status?.phone_verified ? 'secondary' : 'primary'}>{status?.phone_verified ? 'Re-verify' : 'Verify Now'}</Button>
              </Link>
            ) : (
              <p className="text-xs text-warelyn-muted">No phone number on file.</p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function UserPreferencesSection({ accessToken }) {
  const toast = useToast();
  const [prefs, setPrefs] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    settingsService.getUserPreferences(accessToken)
      .then((data) => {
        setPrefs(data);
        setForm({
          default_landing_page: data?.default_landing_page ?? '/dashboard',
          table_density: data?.table_density ?? 'comfortable',
          theme_preference: data?.theme_preference ?? 'light',
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [accessToken]);

  function handleChange(field) {
    return (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  async function handleSave() {
    try {
      const data = {};
      for (const [key, value] of Object.entries(form)) {
        if (value !== (prefs?.[key] ?? '')) data[key] = value;
      }
      if (Object.keys(data).length > 0) {
        const updated = await settingsService.updateUserPreferences(accessToken, data);
        setPrefs(updated);
        toast.success('Preferences saved successfully.');
      }
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <LoadingState message="Loading preferences..." />;
  if (error) return <ErrorState description={error} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><h3 className="text-base font-semibold text-warelyn-text">Display Preferences</h3></CardHeader>
        <CardBody>
          <p className="mb-4 text-sm text-warelyn-muted">Customize your interface.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-warelyn-text">Default Landing Page</span>
                <select value={form.default_landing_page} onChange={handleChange('default_landing_page')} className="block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10">
                  <option value="/dashboard">Dashboard</option>
                  <option value="/catalog/products">Products</option>
                  <option value="/reports/inventory-summary">Inventory Summary</option>
                </select>
              </label>
            </div>
            <div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-warelyn-text">Table Density</span>
                <select value={form.table_density} onChange={handleChange('table_density')} className="block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10">
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                </select>
              </label>
            </div>
            <div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-warelyn-text">Theme</span>
                <select value={form.theme_preference} onChange={handleChange('theme_preference')} className="block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10">
                  <option value="light">Light</option>
                </select>
              </label>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h3 className="text-base font-semibold text-warelyn-text">Notifications</h3></CardHeader>
        <CardBody>
          <p className="text-sm text-warelyn-muted">Notification settings will be available in a future update.</p>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Preferences</Button>
      </div>
    </div>
  );
}

function DocumentTemplatesSection({ accessToken, channel }) {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState({});

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await documentService.listDocumentTemplates(accessToken, channel);
      setTemplates(data);
      const initial = {};
      for (const t of data) {
        initial[t.id] = { subject_template: t.subject_template ?? '', body_template: t.body_template ?? '' };
      }
      setForms(initial);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [accessToken, channel]);

  if (loading) return <LoadingState message={`Loading ${channel.toLowerCase()} templates...`} />;
  if (error) return <ErrorState description={error} />;

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <Card key={template.id}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-warelyn-text">{template.name}</h3>
                <p className="text-xs text-warelyn-muted">{template.template_key}</p>
              </div>
              <StatusBadge status={template.is_active ? 'ACTIVE' : 'INACTIVE'}>{template.is_active ? 'Active' : 'Inactive'}</StatusBadge>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {channel === 'EMAIL' ? (
              <Input
                label="Subject"
                value={forms[template.id]?.subject_template ?? ''}
                onChange={(e) => setForms((p) => ({ ...p, [template.id]: { ...p[template.id], subject_template: e.target.value } }))}
              />
            ) : null}
            <div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-warelyn-text">Body</span>
                <textarea
                  className="block min-h-[180px] w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 font-mono text-sm text-warelyn-text shadow-sm outline-none transition focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10"
                  value={forms[template.id]?.body_template ?? ''}
                  onChange={(e) => setForms((p) => ({ ...p, [template.id]: { ...p[template.id], body_template: e.target.value } }))}
                  rows={8}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    const data = await documentService.previewDocumentTemplate(accessToken, template.id, {});
                    setPreview((current) => ({ ...current, [template.id]: data }));
                  } catch (e) {
                    toast.error(e.message);
                  }
                }}
              >
                Preview
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    const payload = {
                      body_template: forms[template.id]?.body_template ?? template.body_template,
                      is_active: true,
                    };
                    if (channel === 'EMAIL') {
                      payload.subject_template = forms[template.id]?.subject_template ?? template.subject_template;
                    }
                    await documentService.updateDocumentTemplate(accessToken, template.id, payload);
                    toast.success('Template saved.');
                    await load();
                  } catch (e) {
                    toast.error(e.message);
                  }
                }}
              >
                Save template
              </Button>
            </div>
            {preview[template.id] ? (
              <div className="rounded-xl border border-warelyn-border bg-slate-50 p-4 text-sm text-warelyn-text">
                {preview[template.id].subject ? <p className="mb-2 font-semibold">Subject: {preview[template.id].subject}</p> : null}
                <pre className="whitespace-pre-wrap font-sans text-sm">{preview[template.id].body}</pre>
              </div>
            ) : null}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function TemplateShortcutCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link to="/settings/email-templates" className="block">
        <Card className="hover:shadow-md transition">
          <CardBody>
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-warelyn-primary" />
              <div>
                <h3 className="text-sm font-semibold text-warelyn-text">Email Templates</h3>
                <p className="text-xs text-warelyn-muted">Customize email notifications</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </Link>
      <Link to="/settings/pdf-templates" className="block">
        <Card className="hover:shadow-md transition">
          <CardBody>
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-warelyn-primary" />
              <div>
                <h3 className="text-sm font-semibold text-warelyn-text">PDF Templates</h3>
                <p className="text-xs text-warelyn-muted">Customize invoice and bill PDFs</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </Link>
    </div>
  );
}

export function SettingsPage() {
  const { accessToken, user } = useAuth();
  const [tab, setTab] = useState(user?.role === 'TENANT_ADMIN' ? 'tenant' : 'preferences');

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-kicker">Workspace</p>
          <h1>Settings</h1>
          <p>Manage tenant configuration and personal preferences.</p>
        </div>
      </div>

      <div className="mb-6 flex gap-1 rounded-2xl border border-warelyn-border bg-slate-50 p-1">
        {user?.role === 'TENANT_ADMIN' ? (
          <button className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'tenant' ? 'bg-white text-warelyn-text shadow-sm' : 'text-warelyn-muted hover:text-warelyn-text'}`} onClick={() => setTab('tenant')} type="button">
            Tenant Settings
          </button>
        ) : null}
        <button className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'verification' ? 'bg-white text-warelyn-text shadow-sm' : 'text-warelyn-muted hover:text-warelyn-text'}`} onClick={() => setTab('verification')} type="button">
          Verification
        </button>
        <button className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'preferences' ? 'bg-white text-warelyn-text shadow-sm' : 'text-warelyn-muted hover:text-warelyn-text'}`} onClick={() => setTab('preferences')} type="button">
          My Preferences
        </button>
        {user?.role === 'TENANT_ADMIN' ? (
          <>
            <button className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'email-templates' ? 'bg-white text-warelyn-text shadow-sm' : 'text-warelyn-muted hover:text-warelyn-text'}`} onClick={() => setTab('email-templates')} type="button">
              Email Templates
            </button>
            <button className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'pdf-templates' ? 'bg-white text-warelyn-text shadow-sm' : 'text-warelyn-muted hover:text-warelyn-text'}`} onClick={() => setTab('pdf-templates')} type="button">
              PDF Templates
            </button>
          </>
        ) : null}
      </div>

      {tab === 'tenant' ? <TenantSettingsSection accessToken={accessToken} /> : null}
      {tab === 'verification' ? <VerificationSection /> : null}
      {tab === 'preferences' ? <UserPreferencesSection accessToken={accessToken} /> : null}
      {tab === 'email-templates' ? <DocumentTemplatesSection accessToken={accessToken} channel="EMAIL" /> : null}
      {tab === 'pdf-templates' ? <DocumentTemplatesSection accessToken={accessToken} channel="PDF" /> : null}

      {user?.role === 'TENANT_ADMIN' && tab === 'tenant' ? (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-warelyn-text">Templates</h2>
          <TemplateShortcutCards />
        </div>
      ) : null}
    </div>
  );
}
