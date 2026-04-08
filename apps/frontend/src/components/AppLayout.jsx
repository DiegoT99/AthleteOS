import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCategory } from '../context/CategoryContext';

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
  const location = useLocation();

  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

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
            <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold tracking-tight text-emerald-500">
              <img src="/AthleteOS_PWAlogo.png" alt="AthleteOS" className="h-8 w-8 rounded-lg border border-emerald-300/40 object-cover" />
              <span>AthleteOS</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
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
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setMobileNavOpen(false);
            }}
            className="mb-4 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <nav className="space-y-1">
            {navItems.map((item) => (
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
