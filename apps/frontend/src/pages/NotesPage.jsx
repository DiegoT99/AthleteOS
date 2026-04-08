import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useCategory } from '../context/CategoryContext';
import { Paywall } from '../components/Paywall';

export const NotesPage = () => {
  const { selectedCategoryId } = useCategory();
  const [subStatus, setSubStatus] = useState('inactive');
  const [notes, setNotes] = useState([]);
  const [filters, setFilters] = useState({
    q: '',
    tag: '',
    from: '',
    to: '',
    pinned: '',
  });
  const [form, setForm] = useState({
    title: '',
    content: '',
    tags: 'technique',
    isGlobal: false,
    pinned: false,
  });

  const load = async () => {
    const [{ data: sub }, notesRes] = await Promise.all([
      api.get('/api/subscription'),
      api.get('/api/notes', {
        params: {
          categoryId: selectedCategoryId,
          q: filters.q || undefined,
          tag: filters.tag || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          pinned: filters.pinned || undefined,
        },
      }).catch(() => ({ data: [] })),
    ]);

    setSubStatus(sub.status);
    setNotes(notesRes.data);
  };

  useEffect(() => {
    if (selectedCategoryId) {
      load();
    }
  }, [selectedCategoryId, filters.q, filters.tag, filters.from, filters.to, filters.pinned]);

  const create = async (event) => {
    event.preventDefault();
    await api.post('/api/notes', {
      title: form.title,
      content: form.content,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      isGlobal: form.isGlobal,
      pinned: form.pinned,
      categoryId: form.isGlobal ? null : selectedCategoryId,
    });
    setForm({ ...form, title: '', content: '' });
    load();
  };

  const togglePin = async (note) => {
    await api.put(`/api/notes/${note.id}`, { pinned: !note.pinned });
    load();
  };

  const remove = async (id) => {
    await api.delete(`/api/notes/${id}`);
    load();
  };

  if (!['active', 'trialing'].includes(subStatus)) {
    return <Paywall status={subStatus} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">Notebook</h1>
        <p className="text-sm text-slate-500">Advanced search by keyword, tags, category, and date.</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-5">
        <input className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Keyword" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <input className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Tag" value={filters.tag} onChange={(e) => setFilters({ ...filters, tag: e.target.value })} />
        <input type="date" className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <select className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" value={filters.pinned} onChange={(e) => setFilters({ ...filters, pinned: e.target.value })}>
          <option value="">Pinned or not</option>
          <option value="true">Pinned</option>
          <option value="false">Unpinned</option>
        </select>
      </div>

      <form onSubmit={create} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <input className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea className="rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Write your note" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
        <input className="min-h-11 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Tags comma-separated" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isGlobal} onChange={(e) => setForm({ ...form, isGlobal: e.target.checked })} /> Global note
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Pin note
        </label>
        <button className="min-h-11 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950">Create note</button>
      </form>

      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        {notes.map((note) => (
          <article key={note.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{note.title}</h3>
              <div className="space-x-2 text-xs">
                <button onClick={() => togglePin(note)} className="min-h-9 rounded-md border border-slate-400 px-3 py-2">{note.pinned ? 'Unpin' : 'Pin'}</button>
                <button onClick={() => remove(note.id)} className="min-h-9 rounded-md border border-rose-400 px-3 py-2 text-rose-400">Delete</button>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-500">{note.content}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {note.tags.map((tagObj) => (
                <span key={tagObj.id} className="rounded-full bg-slate-200 px-2 py-1 text-xs dark:bg-slate-700">
                  #{tagObj.tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
