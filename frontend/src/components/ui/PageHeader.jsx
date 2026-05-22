import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PageHeader({ actions, backLabel = 'Back', backTo, children, description, kicker, status, title }) {
  return (
    <section className="page-header">
      <div>
        {backTo ? (
          <Link className="page-back-link" to={backTo}>
            <ArrowLeft size={15} />
            <span>{backLabel}</span>
          </Link>
        ) : null}
        {kicker ? <p className="page-kicker">{kicker}</p> : null}
        <div className="page-title-row">
          <h1>{title}</h1>
          {status}
        </div>
        {description ? <p>{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </section>
  );
}
