export function Card({ children, className = '' }) {
  return <div className={`rounded-2xl border border-warelyn-border bg-white shadow-soft ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '' }) {
  return <div className={`border-b border-warelyn-border px-6 py-5 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}
