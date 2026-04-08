import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useCategory } from '../context/CategoryContext';
import { Paywall } from '../components/Paywall';

export const TechniquesPage = () => {
  const { selectedCategoryId, selectedCategory } = useCategory();
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState([]);
  const [progression, setProgression] = useState([]);
  const [subStatus, setSubStatus] = useState('inactive');
  const [form, setForm] = useState({
    techniqueName: '',
    date: new Date().toISOString().slice(0, 10),
    timesDrilled: 1,
    confidenceLevel: 5,
    successRating: 5,
    whatImproved: '',
    whatNeedsWork: '',
    notes: '',
  });

  const load = async () => {
    const [{ data: sub }, logsRes, progRes] = await Promise.all([
      api.get('/api/subscription'),
      api.get('/api/techniques', { params: { categoryId: selectedCategoryId, q: query } }).catch(() => ({ data: [] })),
      api.get('/api/techniques/progression', { params: { categoryId: selectedCategoryId } }).catch(() => ({ data: [] })),
    ]);

    setSubStatus(sub.status);
    setLogs(logsRes.data);
    setProgression(progRes.data.slice(-10));
  };

  useEffect(() => {
    if (selectedCategoryId) {
      load();
    }
  }, [selectedCategoryId, query]);

  const create = async (event) => {
    event.preventDefault();
    await api.post('/api/techniques', {
      ...form,
      categoryId: selectedCategoryId,
      date: new Date(form.date).toISOString(),
      timesDrilled: Number(form.timesDrilled),
      confidenceLevel: Number(form.confidenceLevel),
      successRating: Number(form.successRating),
    });
    setForm({ ...form, techniqueName: '', whatImproved: '', whatNeedsWork: '', notes: '' });
    load();
  };

  if (!['active', 'trialing'].includes(subStatus)) {
    return <Paywall status={subStatus} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">Technique log: {selectedCategory?.name}</h1>
        <p className="text-sm text-slate-500">Filter by selected category and search by keyword.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search techniques"
          className="min-h-11 w-full rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      <form onSubmit={create} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
        <input className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Technique name" value={form.techniqueName} onChange={(e) => setForm({ ...form, techniqueName: e.target.value })} required />
        <input type="date" className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        <input type="number" min="1" max="100" className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={form.timesDrilled} onChange={(e) => setForm({ ...form, timesDrilled: e.target.value })} placeholder="Times drilled" />
        <input type="number" min="1" max="10" className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={form.confidenceLevel} onChange={(e) => setForm({ ...form, confidenceLevel: e.target.value })} placeholder="Confidence" />
        <input type="number" min="1" max="10" className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={form.successRating} onChange={(e) => setForm({ ...form, successRating: e.target.value })} placeholder="Success rating" />
        <input className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" placeholder="What improved" value={form.whatImproved} onChange={(e) => setForm({ ...form, whatImproved: e.target.value })} />
        <input className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 md:col-span-2" placeholder="What needs work" value={form.whatNeedsWork} onChange={(e) => setForm({ ...form, whatNeedsWork: e.target.value })} />
        <textarea className="rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button className="md:col-span-2 min-h-11 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950">Add technique log</button>
      </form>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Technique entries</h2>
          {logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
              <p className="font-semibold">{log.techniqueName}</p>
              <p className="text-slate-500">{new Date(log.date).toLocaleDateString()} • confidence {log.confidenceLevel}/10 • success {log.successRating}/10</p>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Progression timeline</h2>
          {progression.map((point) => (
            <div key={`${point.techniqueName}-${point.date}`} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
              <p>{point.techniqueName}</p>
              <p className="text-slate-500">{new Date(point.date).toLocaleDateString()} • drilled {point.timesDrilled} • confidence {point.confidenceLevel}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
