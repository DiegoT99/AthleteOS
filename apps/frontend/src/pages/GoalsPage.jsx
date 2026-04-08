import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useCategory } from '../context/CategoryContext';
import { Paywall } from '../components/Paywall';

export const GoalsPage = () => {
  const { selectedCategoryId } = useCategory();
  const [subStatus, setSubStatus] = useState('inactive');
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({ title: '', targetValue: '', unit: '', deadline: '' });

  const load = async () => {
    const [{ data: sub }, goalsRes] = await Promise.all([
      api.get('/api/subscription'),
      api.get('/api/goals', { params: { categoryId: selectedCategoryId } }).catch(() => ({ data: [] })),
    ]);
    setSubStatus(sub.status);
    setGoals(goalsRes.data);
  };

  useEffect(() => {
    if (selectedCategoryId) {
      load();
    }
  }, [selectedCategoryId]);

  const create = async (event) => {
    event.preventDefault();
    await api.post('/api/goals', {
      title: form.title,
      categoryId: selectedCategoryId,
      targetValue: form.targetValue ? Number(form.targetValue) : null,
      unit: form.unit || null,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      status: 'not_started',
    });
    setForm({ title: '', targetValue: '', unit: '', deadline: '' });
    load();
  };

  const setStatus = async (goal, status) => {
    await api.put(`/api/goals/${goal.id}`, { status });
    load();
  };

  if (!['active', 'trialing'].includes(subStatus)) {
    return <Paywall status={subStatus} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">Category Goals</h1>
      </div>

      <form onSubmit={create} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
        <input className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Goal title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Target value" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} />
        <input className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Unit (kg, sessions/week)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        <input type="date" className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        <button className="md:col-span-4 min-h-11 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950">Create goal</button>
      </form>

      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        {goals.map((goal) => (
          <div key={goal.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{goal.title}</p>
              <select
                className="min-h-10 rounded border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={goal.status}
                onChange={(e) => setStatus(goal, e.target.value)}
              >
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <p className="text-sm text-slate-500">
              Target: {goal.targetValue || '-'} {goal.unit || ''} {goal.deadline ? ` • Due ${new Date(goal.deadline).toLocaleDateString()}` : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
