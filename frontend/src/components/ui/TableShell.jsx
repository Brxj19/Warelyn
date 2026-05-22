import { EmptyState } from './EmptyState.jsx';
import { ErrorState } from './ErrorState.jsx';
import { LoadingState } from './LoadingState.jsx';

export function TableShell({ actions, children, description, emptyDescription = 'No rows match this view.', emptyTitle = 'No rows', error, isEmpty = false, isLoading = false, title }) {
  return (
    <section className="table-shell">
      <div className="table-header">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="table-header-actions">{actions}</div> : null}
      </div>
      {isLoading ? <LoadingState variant="table" /> : null}
      {!isLoading && error ? <ErrorState description={error} /> : null}
      {!isLoading && !error && isEmpty ? <EmptyState title={emptyTitle} description={emptyDescription} /> : null}
      {!isLoading && !error && !isEmpty ? <div className="table-scroll">{children}</div> : null}
    </section>
  );
}
