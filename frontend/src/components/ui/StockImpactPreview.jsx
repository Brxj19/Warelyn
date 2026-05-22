export function StockImpactPreview({ items = [], title = 'Stock impact preview' }) {
  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
      <h3 className="text-sm font-bold text-warelyn-primary">{title}</h3>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {items.map((item, index) => (
          <div className="rounded-xl border border-blue-100 bg-white p-3 text-sm" key={item.id ?? index}>
            <p className="font-semibold text-warelyn-text">{item.product ?? item.title}</p>
            <p className="mt-1 text-xs text-warelyn-muted">{item.meta}</p>
            <p className="mt-2 text-xs font-semibold text-warelyn-primary">{item.effect}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
