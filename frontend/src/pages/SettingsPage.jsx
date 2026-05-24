import { CheckCircle2, Mail, Smartphone, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge, StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { SettingsForm } from '../components/SettingsForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../hooks/useToast.jsx';
import * as settingsService from '../services/settingsService.js';
import * as verificationService from '../services/verificationService.js';
import * as documentService from '../services/documentService.js';

function TenantSettingsSection({ accessToken }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    settingsService.getTenantSettings(accessToken).then(setSettings).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) return <LoadingState message="Loading tenant settings..." />;
  if (error) return <ErrorState description={error} />;

  return (
    <SettingsForm
      error={error}
      isLoading={loading}
      onSave={async () => {
        const data = {};
        for (const field of ['company_display_name', 'contact_email', 'phone', 'address_line1', 'address_line2', 'city', 'state', 'country', 'postal_code', 'timezone', 'currency', 'tax_id', 'over_receive_tolerance', 'document_logo_url', 'document_footer']) {
          const el = document.getElementById(field);
          if (el && el.value !== undefined && el.value !== (settings[field] ?? '')) data[field] = el.value;
        }
        const ls = document.getElementById('low_stock_alert_enabled');
        if (ls) data.low_stock_alert_enabled = ls.checked;
        if (Object.keys(data).length > 0) {
          const updated = await settingsService.updateTenantSettings(accessToken, data);
          setSettings(updated);
        }
      }}
      sections={[
        {
          title: 'Company Profile',
          description: 'Basic company information for this tenant.',
          fields: [
            <Input defaultValue={settings?.company_display_name ?? ''} id="company_display_name" key="company_display_name" label="Company Display Name" />,
            <Input defaultValue={settings?.contact_email ?? ''} id="contact_email" key="contact_email" label="Contact Email" type="email" />,
            <Input defaultValue={settings?.phone ?? ''} id="phone" key="phone" label="Phone" />,
            <Input defaultValue={settings?.address_line1 ?? ''} id="address_line1" key="address_line1" label="Address Line 1" />,
            <Input defaultValue={settings?.address_line2 ?? ''} id="address_line2" key="address_line2" label="Address Line 2" />,
            <Input defaultValue={settings?.city ?? ''} id="city" key="city" label="City" />,
            <Input defaultValue={settings?.state ?? ''} id="state" key="state" label="State" />,
            <Input defaultValue={settings?.country ?? ''} id="country" key="country" label="Country" />,
            <Input defaultValue={settings?.postal_code ?? ''} id="postal_code" key="postal_code" label="Postal Code" />,
            <Input defaultValue={settings?.timezone ?? 'UTC'} id="timezone" key="timezone" label="Timezone" />,
            <Input defaultValue={settings?.currency ?? 'USD'} id="currency" key="currency" label="Currency" />,
            <Input defaultValue={settings?.tax_id ?? ''} id="tax_id" key="tax_id" label="Tax ID" />,
          ],
        },
        {
          title: 'Inventory Preferences',
          description: 'Default inventory behavior for this tenant.',
          fields: [
            <Input defaultValue={settings?.over_receive_tolerance ?? ''} id="over_receive_tolerance" key="over_receive_tolerance" label="Over-Receive Tolerance" helper="e.g. 10%" />,
            <label className="flex items-center gap-2" key="low_stock_alert_enabled">
              <input defaultChecked={settings?.low_stock_alert_enabled ?? true} id="low_stock_alert_enabled" type="checkbox" className="h-4 w-4 rounded border-warelyn-border text-warelyn-primary focus:ring-warelyn-primary" />
              <span className="text-sm font-medium text-warelyn-text">Low stock alert enabled</span>
            </label>,
          ],
        },
        {
          title: 'Documents',
          description: 'Customize generated documents.',
          fields: [
            <Input defaultValue={settings?.document_logo_url ?? ''} id="document_logo_url" key="document_logo_url" label="Document Logo URL" helper="URL to your company logo" />,
            <div className="sm:col-span-2" key="document_footer">
              <label className="block" htmlFor="document_footer">
                <span className="mb-2 block text-sm font-medium text-warelyn-text">Document Footer</span>
                <textarea className="block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm text-warelyn-text shadow-sm outline-none transition placeholder:text-slate-400 focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10" defaultValue={settings?.document_footer ?? ''} id="document_footer" rows={3} />
              </label>
            </div>,
          ],
        },
      ]}
    />
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
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    settingsService.getUserPreferences(accessToken).then(setPrefs).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) return <LoadingState message="Loading preferences..." />;
  if (error) return <ErrorState description={error} />;

  return (
    <SettingsForm
      error={error}
      isLoading={loading}
      onSave={async () => {
        const data = {};
        const landing = document.getElementById('default_landing_page');
        if (landing && landing.value !== prefs.default_landing_page) data.default_landing_page = landing.value;
        const density = document.getElementById('table_density');
        if (density && density.value !== prefs.table_density) data.table_density = density.value;
        const theme = document.getElementById('theme_preference');
        if (theme && theme.value !== prefs.theme_preference) data.theme_preference = theme.value;
        if (Object.keys(data).length > 0) {
          const updated = await settingsService.updateUserPreferences(accessToken, data);
          setPrefs(updated);
        }
      }}
      sections={[
        {
          title: 'Display Preferences',
          description: 'Customize your interface.',
          fields: [
            <div key="default_landing_page">
              <label className="block" htmlFor="default_landing_page">
                <span className="mb-2 block text-sm font-medium text-warelyn-text">Default Landing Page</span>
                <select id="default_landing_page" defaultValue={prefs?.default_landing_page ?? '/dashboard'} className="block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10">
                  <option value="/dashboard">Dashboard</option>
                  <option value="/catalog/products">Products</option>
                  <option value="/reports/inventory-summary">Inventory Summary</option>
                </select>
              </label>
            </div>,
            <div key="table_density">
              <label className="block" htmlFor="table_density">
                <span className="mb-2 block text-sm font-medium text-warelyn-text">Table Density</span>
                <select id="table_density" defaultValue={prefs?.table_density ?? 'comfortable'} className="block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10">
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                </select>
              </label>
            </div>,
            <div key="theme_preference">
              <label className="block" htmlFor="theme_preference">
                <span className="mb-2 block text-sm font-medium text-warelyn-text">Theme</span>
                <select id="theme_preference" defaultValue={prefs?.theme_preference ?? 'light'} className="block w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10">
                  <option value="light">Light</option>
                </select>
              </label>
            </div>,
          ],
        },
        {
          title: 'Notifications',
          description: 'Notification preferences (coming soon).',
          fields: [
            <p className="text-sm text-warelyn-muted sm:col-span-2" key="notice">Notification settings will be available in a future update.</p>,
          ],
        },
      ]}
    />
  );
}

function DocumentTemplatesSection({ accessToken, channel }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState({});

  async function load() {
    setLoading(true);
    setError('');
    try {
      setTemplates(await documentService.listDocumentTemplates(accessToken, channel));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [accessToken, channel]);

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
                defaultValue={template.subject_template ?? ''}
                id={`template-subject-${template.id}`}
                label="Subject"
              />
            ) : null}
            <div>
              <label className="block" htmlFor={`template-body-${template.id}`}>
                <span className="mb-2 block text-sm font-medium text-warelyn-text">Body</span>
                <textarea
                  className="block min-h-[180px] w-full rounded-lg border border-warelyn-border bg-white px-3 py-2.5 text-sm text-warelyn-text shadow-sm outline-none transition focus:border-warelyn-primary focus:ring-4 focus:ring-blue-900/10"
                  defaultValue={template.body_template}
                  id={`template-body-${template.id}`}
                  rows={8}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  const data = await documentService.previewDocumentTemplate(accessToken, template.id, {});
                  setPreview((current) => ({ ...current, [template.id]: data }));
                }}
              >
                Preview
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  const payload = {
                    body_template: document.getElementById(`template-body-${template.id}`)?.value ?? template.body_template,
                    is_active: true,
                  };
                  if (channel === 'EMAIL') {
                    payload.subject_template = document.getElementById(`template-subject-${template.id}`)?.value ?? template.subject_template;
                  }
                  await documentService.updateDocumentTemplate(accessToken, template.id, payload);
                  await load();
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
    </div>
  );
}
