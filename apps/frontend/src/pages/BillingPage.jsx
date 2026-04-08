import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export const BillingPage = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await api.get('/api/subscription');
    setSubscription(data);
  };

  useEffect(() => {
    load();
  }, []);

  const startCheckout = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/billing/create-checkout-session');
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-2xl font-bold">Billing</h1>
      <p className="mt-2 text-sm capitalize text-slate-500">
        Status: {subscription?.status || 'inactive'}
      </p>
      {subscription?.trialEnd && (
        <p className="text-sm text-slate-500">Trial ends: {new Date(subscription.trialEnd).toLocaleDateString()}</p>
      )}
      <button
        disabled={loading}
        onClick={startCheckout}
        className="mt-4 min-h-11 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60 sm:w-auto"
      >
        {loading ? 'Opening Stripe...' : 'Upgrade / Manage Subscription'}
      </button>
    </div>
  );
};
