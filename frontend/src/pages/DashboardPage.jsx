import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const foundationCards = [
  ['Backend API', 'FastAPI foundation and health endpoint are ready.'],
  ['Frontend Shell', 'React, Vite, Tailwind, layouts, and UI primitives are ready.'],
  ['Database Layer', 'SQLAlchemy and Alembic foundation are ready for future models.'],
];

export function DashboardPage() {
  const { logout, tenant, user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="primary">Auth + Tenant Foundation</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">Welcome, {user?.name ?? 'Warelyn user'}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-warelyn-muted">
            This protected dashboard confirms tenant context and role-aware navigation are wired. Operational workflows are intentionally not implemented yet.
          </p>
        </div>
        <Button variant="secondary" onClick={logout}>Logout</Button>
      </div>

      <Card>
        <CardBody className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-warelyn-muted">User</p>
            <p className="mt-1 font-semibold text-warelyn-text">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-warelyn-muted">Company</p>
            <p className="mt-1 font-semibold text-warelyn-text">{tenant?.company_name ?? 'Platform administration'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-warelyn-muted">Role</p>
            <p className="mt-1 font-semibold text-warelyn-text">{user?.role}</p>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {foundationCards.map(([title, description]) => (
          <Card key={title}>
            <CardBody>
              <h2 className="text-base font-semibold text-warelyn-text">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-warelyn-muted">{description}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-warelyn-text">Operational modules</h2>
          <p className="mt-1 text-sm text-warelyn-muted">Placeholders only. Inventory workflows are intentionally not implemented in Phase 1.</p>
        </CardHeader>
        <CardBody>
          <EmptyState title="No operational data yet" description="Auth, tenant foundations, catalog, warehouses, and inventory workflows will be implemented in future phases." />
        </CardBody>
      </Card>
    </div>
  );
}
