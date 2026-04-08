import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useCategory } from '../context/CategoryContext';
import { Paywall } from '../components/Paywall';

export const CategoryPage = () => {
  const { selectedCategory, selectedCategoryId } = useCategory();
  const [sessions, setSessions] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    durationMinutes: 60,
    intensity: 'medium',
    mood: '',
    wins: '',
    needsWork: '',
    notes: '',
  });

  const load = async () => {
    const [{ data: sub }, { data: sessionData }] = await Promise.all([
      api.get('/api/subscription'),
      api.get('/api/sessions', { params: { categoryId: selectedCategoryId } }).catch(() => ({ data: [] })),
    ]);

    setSubscriptionStatus(sub.status);
    setSessions(sessionData);
  };

  useEffect(() => {
    if (selectedCategoryId) {
      load();
    }
  }, [selectedCategoryId]);

  const canUsePremium = ['active', 'trialing'].includes(subscriptionStatus);

  const createSession = async (event) => {
    event.preventDefault();
    await api.post('/api/sessions', {
      ...form,
      categoryId: selectedCategoryId,
      date: new Date(form.date).toISOString(),
      durationMinutes: Number(form.durationMinutes),
    });
    setForm({ ...form, mood: '', wins: '', needsWork: '', notes: '' });
    load();
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">{selectedCategory?.name || 'Category'} tracker</h1>
        <p className="text-sm text-slate-500">All data shown here belongs only to the selected category.</p>
      </div>

      {!canUsePremium ? (
        <Paywall status={subscriptionStatus} />
      ) : (
        <>
          <form onSubmit={createSession} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
            <input type="date" className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <input type="number" className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} placeholder="Duration minutes" required />
            <select className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={form.intensity} onChange={(e) => setForm({ ...form, intensity: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })} placeholder="Mood" />
            <input className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={form.wins} onChange={(e) => setForm({ ...form, wins: e.target.value })} placeholder="Wins" />
            <input className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={form.needsWork} onChange={(e) => setForm({ ...form, needsWork: e.target.value })} placeholder="Needs work" />
            <textarea className="md:col-span-2 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Session notes" />
            <button className="md:col-span-2 min-h-11 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950">Add session</button>
          </form>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Sessions for {selectedCategory?.name}</h2>
            {sessions.map((session) => (
              <div key={session.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                <div className="flex justify-between gap-2">
                  <span>{new Date(session.date).toLocaleDateString()}</span>
                  <span className="capitalize">{session.intensity}</span>
                </div>
                <p className="mt-1">Duration: {session.durationMinutes} min</p>
                {session.notes && <p className="mt-1 text-slate-500">{session.notes}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
