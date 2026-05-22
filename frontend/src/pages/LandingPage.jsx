import { Link } from 'react-router-dom';
import { Activity, Boxes, CheckCircle2, ClipboardList, PackageCheck, ShieldCheck, Truck, Undo2 } from 'lucide-react';

import { AppLogo } from '../components/ui/AppLogo.jsx';
import { Button } from '../components/ui/Button.jsx';

const features = [
  ['Accurate stock', Boxes, 'Backend-led stock projection, ledger visibility, and reorder signals.'],
  ['Faster receiving', Truck, 'Purchase receiving flows with warehouse, location, batch, and serial capture.'],
  ['Sales-ready fulfillment', PackageCheck, 'Reservation, picking, packing, and fulfillment screens built around the workflow.'],
  ['Returns QC', Undo2, 'Inspect returns before sellable restock, blocked stock, damage, scrap, or rejection.'],
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white text-warelyn-text">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link to="/"><AppLogo imageClassName="h-14 max-w-[190px]" /></Link>
        <nav className="flex items-center gap-3"><Link className="hidden text-sm font-semibold text-warelyn-muted hover:text-warelyn-primary sm:inline" to="/login">Features</Link><Link className="hidden text-sm font-semibold text-warelyn-muted hover:text-warelyn-primary sm:inline" to="/login">About</Link><Link to="/login"><Button variant="secondary">Sign in</Button></Link></nav>
      </header>
      <main className="mx-auto max-w-7xl px-5 pb-16 pt-10">
        <section className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="text-center lg:text-left">
            <div className="mx-auto mb-8 flex justify-center lg:mx-0 lg:justify-start"><AppLogo imageClassName="h-[72px] max-w-[240px]" /></div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">Inventory that moves with your business</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-500 lg:mx-0">Manage products, stock, purchases, sales, fulfillment, returns, and reports from one clear workspace.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"><Link to="/login"><Button>Sign in</Button></Link><Link to="/register"><Button variant="secondary">Create workspace</Button></Link></div>
          </div>
          <div className="rounded-[2rem] border border-warelyn-border bg-white p-4 shadow-soft">
            <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white"><div className="flex items-center justify-between"><span className="text-sm font-bold">Warelyn operations</span><span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">Clear</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{[['Products', '1,248'], ['Low stock', '12'], ['QC queue', '4']].map(([label, value]) => <div className="rounded-2xl bg-white/10 p-4" key={label}><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-warelyn-border p-4"><div className="mb-3 flex items-center gap-2 text-sm font-bold"><Activity size={17} /> Recent movement</div><p className="text-sm text-warelyn-muted">Purchase receipt posted through InventoryEngine.</p></div><div className="rounded-2xl border border-warelyn-border p-4"><div className="mb-3 flex items-center gap-2 text-sm font-bold"><ShieldCheck size={17} /> Reconciliation</div><p className="text-sm text-warelyn-muted">Ledger and projection health stay visible.</p></div></div>
          </div>
        </section>
        <section className="mt-16 grid overflow-hidden rounded-3xl border border-warelyn-border bg-white shadow-sm md:grid-cols-4">{features.map(([title, Icon, description]) => <div className="border-warelyn-border p-6 md:border-r" key={title}><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-warelyn-primary"><Icon size={22} /></div><h2 className="font-bold">{title}</h2><p className="mt-3 text-sm leading-6 text-warelyn-muted">{description}</p></div>)}</section>
        <section className="mt-16 rounded-3xl border border-warelyn-border bg-slate-100 p-3"><div className="grid min-h-[320px] place-items-center rounded-2xl border border-white bg-white/60 text-center"><div><CheckCircle2 className="mx-auto text-warelyn-primary" size={42} /><p className="mt-4 border border-warelyn-primary bg-white px-5 py-3 text-sm font-bold uppercase tracking-widest text-warelyn-primary">System interface preview</p></div></div></section>
      </main>
    </div>
  );
}
