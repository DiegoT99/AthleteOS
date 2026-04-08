import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCategory } from '../context/CategoryContext';
import { api } from '../lib/api';

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Category', to: '/category' },
  { label: 'Techniques', to: '/techniques' },
  { label: 'Notes', to: '/notes' },
  { label: 'Goals', to: '/goals' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Billing', to: '/billing' },
  { label: 'Profile', to: '/profile' },
];

export const AppLayout = () => {
  const { logout } = useAuth();
  const { categories, selectedCategoryId, setSelectedCategoryId } = useCategory();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [countdownText, setCountdownText] = useState('');
  const location = useLocation();

  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    const loadSubscription = async () => {
      try {
        const { data } = await api.get('/api/subscription');
        const status = String(data?.status || 'inactive').toLowerCase();
        const premiumByStatus = status === 'active' || status === 'trialing';
        const premiumByServer = typeof data?.hasPremiumAccess === 'boolean' ? data.hasPremiumAccess : premiumByStatus;
        if (mounted) {
          setHasPremium(premiumByServer);
          setSubscription(data);
        }
      } catch {
        if (mounted) {
          setHasPremium(false);
          setSubscription(null);
        }
      }
    };

    loadSubscription();

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    const formatCountdown = () => {
      if (!subscription?.accessEndsAt) {
        setCountdownText('');
        return;
      }

      const remainingMs = new Date(subscription.accessEndsAt).getTime() - Date.now();

      if (remainingMs <= 0) {
        setCountdownText('Expired');
        return;
      }

      const totalMinutes = Math.floor(remainingMs / 60000);
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;

      setCountdownText(`${days}d ${hours}h ${minutes}m`);
    };

    formatCountdown();
    const timer = setInterval(formatCountdown, 60000);

    return () => clearInterval(timer);
  }, [subscription]);

  const status = String(subscription?.status || 'inactive').toLowerCase();
  const isTrialing = status === 'trialing' && countdownText;
  const hasRenewalCountdown = status === 'active' && countdownText;
  const expiresSoon = subscription?.accessEndsAt
    ? new Date(subscription.accessEndsAt).getTime() - Date.now() <= 1000 * 60 * 60 * 24 * 3
    : false;

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('athleteos_theme', next);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="rounded-lg border border-slate-300 p-2 md:hidden dark:border-slate-700"
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link to={hasPremium ? '/dashboard' : '/billing'} className="flex items-center gap-2 text-xl font-bold tracking-tight text-emerald-500">
              <img src="/AthleteOS_PWAlogo.png" alt="AthleteOS" className="h-8 w-8 rounded-lg border border-emerald-300/40 object-cover" />
              <span>AthleteOS</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {(isTrialing || hasRenewalCountdown) && (
              <div
                className={`hidden rounded-lg border px-3 py-2 text-xs font-semibold md:block ${
                  expiresSoon
                    ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
                }`}
              >
                {isTrialing
                  ? `Free trial ends in ${countdownText}`
                  : `Subscription renews in ${countdownText}`}
              </div>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-slate-300 p-2 dark:border-slate-700"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {(isTrialing || hasRenewalCountdown) && (
        <div className="border-b border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 md:hidden">
          {isTrialing
            ? `Free trial ends in ${countdownText}`
            : `Subscription renews in ${countdownText}`}
        </div>
      )}

      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-slate-950/50 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <div className="mx-auto grid max-w-7xl gap-4 px-3 py-3 sm:px-4 sm:py-4 md:grid-cols-[240px_1fr]">
        <aside
          className={`z-30 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 ${
            mobileNavOpen
              ? 'fixed left-3 right-3 top-20 max-h-[80vh] overflow-auto shadow-xl'
              : 'hidden'
          } md:static md:block md:max-h-none md:overflow-visible md:shadow-none`}
        >
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Active category
          </label>
          <select
            value={selectedCategoryId}
            disabled={!hasPremium}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setMobileNavOpen(false);
            }}
            className="mb-4 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {!hasPremium && (
            <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
              Account locked. Activate billing or redeem a promo code to unlock app features.
            </p>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => (
              hasPremium || item.to === '/billing' ? (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ) : (
                <span
                  key={item.to}
                  className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium text-slate-400 opacity-70"
                >
                  {item.label}
                </span>
              )
            ))}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
