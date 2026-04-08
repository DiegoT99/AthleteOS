import { Link } from 'react-router-dom';

export const PricingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-4xl font-bold">Simple Pricing</h1>
        <p className="mt-2 text-slate-300">7-day free trial. Cancel anytime.</p>
        <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6">
          <p className="text-sm uppercase tracking-widest text-emerald-300">AthleteOS Premium</p>
          <p className="mt-2 text-4xl font-bold">$19<span className="text-lg font-normal text-slate-300">/month</span></p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-slate-200">
            <li>All categories + custom categories</li>
            <li>Unlimited sessions, techniques, notes, goals</li>
            <li>Advanced analytics and streak tracking</li>
          </ul>
          <Link to="/signup" className="mt-6 inline-flex rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-900">
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
};
