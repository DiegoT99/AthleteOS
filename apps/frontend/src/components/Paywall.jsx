import { Link } from 'react-router-dom';

export const Paywall = ({ status }) => {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100">
      <h3 className="text-xl font-semibold">Upgrade to AthleteOS Premium</h3>
      <p className="mt-2 text-slate-300">
        Your subscription is currently <span className="font-medium capitalize">{status || 'inactive'}</span>. Premium features are locked until billing is active.
      </p>
      <Link
        to="/billing"
        className="mt-4 inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
      >
        Manage Billing
      </Link>
    </div>
  );
};
