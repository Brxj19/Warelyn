import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

const foundationCards = [
  ['Backend API', 'FastAPI foundation and health endpoint are ready.'],
  ['Frontend Shell', 'React, Vite, Tailwind, layouts, and UI primitives are ready.'],
  ['Database Layer', 'SQLAlchemy and Alembic foundation are ready for future models.'],
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="primary">Phase 0 Foundation</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">Warelyn workspace foundation</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-warelyn-muted">
            This is the production-ready starting point for Warelyn Inventory V2. Business workflows will be added progressively after auth and tenant foundations are stable.
          </p>
        </div>
      </div>

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
          <p className="mt-1 text-sm text-warelyn-muted">Placeholders only. Inventory workflows are intentionally not implemented in Phase 0.</p>
        </CardHeader>
        <CardBody>
          <EmptyState title="No operational data yet" description="Auth, tenant foundations, catalog, warehouses, and inventory workflows will be implemented in future phases." />
        </CardBody>
      </Card>
    </div>
  );
}
