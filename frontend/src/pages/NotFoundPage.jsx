import { Link } from 'react-router-dom';

import { Card, CardBody } from '../components/ui/Card.jsx';

export function NotFoundPage() {
  return (
    <Card>
      <CardBody className="text-center">
        <p className="text-sm font-semibold text-warelyn-primary">404</p>
        <h1 className="mt-2 text-2xl font-bold text-warelyn-text">Page not found</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-warelyn-muted">This workspace route is not available in the Phase 0 foundation.</p>
        <Link
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-warelyn-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-warelyn-primary/30"
          to="/"
        >
          Back to dashboard
        </Link>
      </CardBody>
    </Card>
  );
}
