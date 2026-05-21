import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-warelyn-background lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-warelyn-primary px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold ring-1 ring-white/20">WI</div>
          <h1 className="max-w-xl text-4xl font-bold tracking-tight">Warelyn Inventory</h1>
          <p className="mt-4 max-w-lg text-lg text-blue-100">Inventory that moves with your business.</p>
        </div>
        <p className="max-w-xl text-sm leading-6 text-blue-100">
          A clean foundation for real inventory operations: tenant isolation, workflow clarity, stock accuracy, and audit-ready decisions.
        </p>
      </section>
      <main className="flex items-center justify-center px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
}
