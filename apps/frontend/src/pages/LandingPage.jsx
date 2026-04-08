import { Link } from 'react-router-dom';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-emerald-400">
            <img src="/AthleteOS_PWAlogo.png" alt="AthleteOS" className="h-8 w-8 rounded-lg border border-emerald-300/30 object-cover" />
            <span>AthleteOS</span>
          </h1>
          <div className="space-x-2">
            <Link className="rounded-lg px-4 py-2 text-sm" to="/login">
              Login
            </Link>
            <Link className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900" to="/signup">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:pt-16">
        <h2 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          Track BJJ, Gym, Boxing, and every discipline in one subscription.
        </h2>
        <p className="mt-4 max-w-2xl text-slate-300">
          AthleteOS is a category-based training tracker with journals, technique logs, goals, and analytics built for multi-discipline athletes.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/signup" className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-900">
            Start 7-Day Free Trial
          </Link>
          <Link to="/pricing" className="rounded-xl border border-slate-700 px-5 py-3 font-semibold">
            View Pricing
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 md:grid-cols-3">
        {[
          'Category-isolated logs and notes',
          'Technique progression tracking',
          'Training streaks and analytics',
        ].map((item) => (
          <article key={item} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-lg font-semibold">{item}</h3>
            <p className="mt-2 text-sm text-slate-300">
              Built to keep each training category separate while still giving a complete global view when needed.
            </p>
          </article>
        ))}
      </section>
    </div>
  );
};
