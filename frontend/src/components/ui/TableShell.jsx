import { EmptyState } from './EmptyState.jsx';
import { ErrorState } from './ErrorState.jsx';
import { LoadingState } from './LoadingState.jsx';

export function TableShell({
  actions,
  children,
  description,
  emptyAction,
  emptyDescription = 'No rows match this view.',
  emptyTitle = 'No rows',
  error,
  isEmpty = false,
  isLoading = false,
  rowCount,
  title,
  toolbar,
}) {
  return (
    <section className="table-shell">
      <div className="table-header">
        <div>
          <div className="table-title-row">
            <h2>{title}</h2>
            {rowCount !== undefined ? <span className="table-row-count">{rowCount}</span> : null}
          </div>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="table-header-actions">{actions}</div> : null}
      </div>
      {toolbar ? <div className="table-toolbar">{toolbar}</div> : null}
      {isLoading ? <LoadingState variant="table" /> : null}
      {!isLoading && error ? <ErrorState description={error} /> : null}
      {!isLoading && !error && isEmpty ? <EmptyState action={emptyAction} title={emptyTitle} description={emptyDescription} /> : null}
      {!isLoading && !error && !isEmpty ? <div className="table-scroll overflow-x-auto">{children}</div> : null}
    </section>
  );
}
