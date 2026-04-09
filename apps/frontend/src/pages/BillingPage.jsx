import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export const BillingPage = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState(null);

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
    } catch (err) {
      setPromoMessage({
        ok: false,
        text: err?.response?.data?.message || 'Unable to open Square checkout right now.',
      });
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

      {subscription?.status !== 'active' && (
        <>
          <button
            disabled={loading}
            onClick={startCheckout}
            className="mt-4 min-h-11 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60 sm:w-auto"
          >
            {loading ? 'Opening Square Checkout...' : 'Upgrade / Renew Subscription'}
          </button>

          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Have a promo code?</p>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoMessage(null); }}
                placeholder="Enter code"
                className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase tracking-widest dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="button"
                disabled={promoLoading || !promoCode.trim()}
                onClick={async () => {
                  setPromoLoading(true);
                  setPromoMessage(null);
                  try {
                    const { data } = await api.post('/api/billing/redeem-promo', { code: promoCode });
                    setPromoMessage({ ok: true, text: data.message });
                    setPromoCode('');
                    load();
                  } catch (err) {
                    setPromoMessage({ ok: false, text: err?.response?.data?.message || 'Invalid promo code.' });
                  } finally {
                    setPromoLoading(false);
                  }
                }}
                className="min-h-11 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-700"
              >
                {promoLoading ? 'Applying...' : 'Apply'}
              </button>
            </div>
            {promoMessage && (
              <p className={`mt-2 text-sm ${promoMessage.ok ? 'text-emerald-500' : 'text-rose-400'}`}>
                {promoMessage.text}
              </p>
            )}
          </div>
        </>
      )}

      {subscription?.status === 'active' && (
        <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Your subscription is active. Full access unlocked.
        </div>
      )}
    </div>
  );
};
