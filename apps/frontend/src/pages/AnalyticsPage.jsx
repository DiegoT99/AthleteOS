import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useCategory } from '../context/CategoryContext';
import { Paywall } from '../components/Paywall';

const MiniBarChart = ({ title, dataKey, data }) => {
  const max = Math.max(...data.map((item) => item[dataKey] || 0), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-3 space-y-2">
        {data.slice(-8).map((item) => (
          <div key={item.week} className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>{item.week}</span>
              <span>{item[dataKey]}</span>
            </div>
            <div className="h-2 rounded bg-slate-200 dark:bg-slate-700">
              <div className="h-2 rounded bg-emerald-500" style={{ width: `${(item[dataKey] / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AnalyticsPage = () => {
  const { selectedCategoryId } = useCategory();
  const [analytics, setAnalytics] = useState(null);
  const [subStatus, setSubStatus] = useState('inactive');

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }

    const load = async () => {
      const [{ data: sub }, { data }] = await Promise.all([
        api.get('/api/subscription'),
        api.get('/api/analytics', { params: { categoryId: selectedCategoryId } }).catch(() => ({ data: null })),
      ]);
      setSubStatus(sub.status);
      setAnalytics(data);
    };

    load();
  }, [selectedCategoryId]);

  if (!['active', 'trialing'].includes(subStatus)) {
    return <Paywall status={subStatus} />;
  }

  if (!analytics) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">Loading analytics...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <MiniBarChart title="Session frequency" dataKey="sessions" data={analytics.weeklyStats} />
        <MiniBarChart title="Training hours" dataKey="hours" data={analytics.weeklyStats} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold">Strength progression</h3>
          <div className="mt-2 space-y-1 text-sm">
            {analytics.strengthProgression.slice(-10).map((item) => (
              <div key={`${item.exercise}-${item.date}`} className="flex justify-between rounded border border-slate-200 p-2 dark:border-slate-700">
                <span>{item.exercise}</span>
                <span>{item.oneRepMax}kg</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold">Milestones</h3>
          <p className="mt-2 text-sm">Total sessions: {analytics.milestones.totalSessions}</p>
          <p className="text-sm">Total hours: {analytics.milestones.totalHours}</p>
          <div className="mt-4 overflow-x-auto">
            <div className="grid min-w-[360px] grid-cols-7 gap-1">
              {analytics.heatmap.slice(-56).map((item) => (
                <div key={item.date} title={`${item.date}: ${item.count}`} className="h-4 rounded" style={{ background: `rgba(16,185,129,${Math.min(0.15 + item.count * 0.15, 1)})` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
