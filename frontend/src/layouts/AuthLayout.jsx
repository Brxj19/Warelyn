import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-warelyn-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden bg-slate-950 px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <img alt="Warelyn" className="mb-8 h-14 w-14 rounded-2xl bg-white object-contain p-1 ring-1 ring-white/20" src="/warelyn-logo.png" />
          <h1 className="max-w-xl text-4xl font-bold tracking-tight">Warelyn</h1>
          <p className="mt-4 max-w-lg text-lg text-slate-300">Inventory that moves with your business.</p>
        </div>
        <div className="space-y-4 text-sm leading-6 text-slate-300">
          <p className="max-w-xl">Operational clarity over decoration: tenant-safe workflows, stock accuracy, and reportable decisions.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {['Receive', 'Reserve', 'Reconcile'].map((item) => <div className="rounded-2xl border border-white/10 bg-white/5 p-4 font-semibold" key={item}>{item}</div>)}
          </div>
        </div>
      </section>
      <main className="flex items-center justify-center px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
}
