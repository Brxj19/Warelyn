import { Outlet } from 'react-router-dom';

import { AppLogo } from '../components/ui/AppLogo.jsx';

export function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden px-12 py-14 text-warelyn-text lg:flex lg:flex-col lg:justify-between">
        <div>
          <AppLogo className="mb-10" imageClassName="h-[68px] max-w-[220px]" />
          <h1 className="max-w-xl text-4xl font-bold tracking-tight">Inventory that moves with your business</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-warelyn-muted">Manage products, stock, purchases, sales, fulfillment, returns, and reports from one clear workspace.</p>
        </div>
        <div className="space-y-5">
          <div className="rounded-3xl border border-warelyn-border bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between border-b border-warelyn-border pb-3"><span className="text-sm font-bold">Operations preview</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Live</span></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {['Receiving ready', 'Pick queue clear', 'Low stock watched', 'Returns QC pending'].map((item) => <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-warelyn-text" key={item}>{item}</div>)}
            </div>
          </div>
          <p className="max-w-xl text-sm leading-6 text-warelyn-muted">Operational clarity over decoration: tenant-safe workflows, stock accuracy, and reportable decisions.</p>
        </div>
      </section>
      <main className="flex items-center justify-center px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
}
