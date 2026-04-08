import { useEffect, useState } from 'react';
import { Bike, Dumbbell, Flame, HeartPulse, Shield, Target, Trophy, Waves } from 'lucide-react';
import { api } from '../lib/api';
import { useCategory } from '../context/CategoryContext';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../lib/avatar';

const BjjBeltIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <path d="M3 9.5h18v5H3z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9.5 9.5v5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M14.5 9.5v5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.5 14.5l-2.2 6h3.4l2-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M15.5 14.5l2.2 6h-3.4l-2-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const getCategoryIcon = (categoryName = '') => {
  const normalized = categoryName.trim().toLowerCase();

  if (normalized.includes('bjj') || normalized.includes('jiu')) {
    return BjjBeltIcon;
  }
  if (normalized.includes('boxing') || normalized.includes('striking')) {
    return Target;
  }
  if (normalized.includes('mma') || normalized.includes('self defense')) {
    return Shield;
  }
  if (normalized.includes('wrestling') || normalized.includes('grappling')) {
    return Trophy;
  }
  if (normalized.includes('running') || normalized.includes('cardio')) {
    return HeartPulse;
  }
  if (normalized.includes('swim')) {
    return Waves;
  }
  if (normalized.includes('cycling') || normalized.includes('bike')) {
    return Bike;
  }
  if (normalized.includes('strength') || normalized.includes('lift')) {
    return Dumbbell;
  }

  return Flame;
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const { categories, selectedCategory, selectedCategoryId, setSelectedCategoryId } = useCategory();
  const [data, setData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [avatarImageError, setAvatarImageError] = useState(false);

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }
    setData(null);

    const run = async () => {
      const [{ data: dashboard }, { data: sessionData }] = await Promise.all([
        api.get('/api/dashboard', {
          params: { categoryId: selectedCategoryId },
        }),
        api.get('/api/sessions', { params: { categoryId: selectedCategoryId } }).catch(() => ({ data: [] })),
      ]);

      setData(dashboard);
      setSessions(Array.isArray(sessionData) ? sessionData : []);
    };

    run();
  }, [selectedCategoryId]);

  if (!data) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Welcome back, {user?.name || 'Athlete'}</h1>
            <p className="text-sm text-slate-500">Your dashboard is synced to your active category.</p>
          </div>
          {user?.profileImageUrl && !avatarImageError ? (
            <img
              src={user.profileImageUrl}
              alt="Account profile"
              className="h-14 w-14 rounded-full border border-slate-200 object-cover dark:border-slate-700"
              onError={() => setAvatarImageError(true)}
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-base font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
              {getInitials(user?.name || '')}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Today Activity', data.todayCount],
          ['Weekly Sessions', data.weeklyCount],
          ['Training Streak', `${data.streak} days`],
          ['Hours (recent)', data.totalHours],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Category quick access</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.name);
              const isActive = selectedCategoryId === category.id;

              return (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`group min-h-28 rounded-xl border p-4 text-left transition ${
                    isActive
                      ? 'border-slate-900 bg-slate-100 shadow-sm dark:border-slate-200 dark:bg-slate-700'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
                  }`}
                  aria-pressed={isActive}
                >
                  <div className="flex h-full items-start justify-between gap-3">
                    <div>
                      <p className={`text-base font-semibold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                        {category.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tap to view stats</p>
                    </div>
                    <div
                      className={`rounded-lg border p-2 ${
                        isActive
                          ? 'border-slate-300 bg-white text-slate-900 dark:border-slate-500 dark:bg-slate-800 dark:text-white'
                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Subscription / trial status</h2>
          <p className="mt-2 text-sm capitalize">Status: {data.subscription?.status || 'inactive'}</p>
          {data.subscription?.trialEnd && (
            <p className="text-sm text-slate-500">Trial ends: {new Date(data.subscription.trialEnd).toLocaleDateString()}</p>
          )}
        </article>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {sessions.length > 0 && (
          <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
            <h2 className="text-lg font-semibold">Session tracker for {selectedCategory?.name || 'selected activity'}</h2>
            <p className="mt-1 text-sm text-slate-500">Linked with your Category tab. Showing the latest sessions for this activity.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {sessions.slice(0, 6).map((session) => (
                <div key={session.id} className="rounded-lg border border-slate-200 p-3 sm:p-4 text-sm dark:border-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span>{new Date(session.date).toLocaleDateString()}</span>
                    <span className="capitalize text-slate-500">{session.intensity}</span>
                  </div>
                  <p className="mt-1">Duration: {session.durationMinutes} min</p>
                  {session.notes && <p className="mt-1 line-clamp-2 text-slate-500">{session.notes}</p>}
                </div>
              ))}
            </div>
          </article>
        )}

        <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Recent notes</h2>
          <div className="mt-3 space-y-2">
            {data.recentNotes.map((note) => (
              <div key={note.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                <p className="font-semibold">{note.title}</p>
                <p className="mt-1 text-slate-500">{note.content.slice(0, 120)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Goal snapshot</h2>
          <div className="mt-3 space-y-2">
            {data.goals.map((goal) => (
              <div key={goal.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                <p className="font-semibold">{goal.title}</p>
                <p className="text-slate-500 capitalize">{goal.status.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};
