import { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../lib/avatar';

export const ProfilePage = () => {
  const MAX_AVATAR_SIZE_MB = 8;
  const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;
  const { setUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    profileImageUrl: '',
    gymTeam: '',
    rankBelt: '',
    weightClass: '',
  });
  const [message, setMessage] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/api/profile');
      setForm({
        name: data.name || '',
        profileImageUrl: data.profileImageUrl || '',
        gymTeam: data.gymTeam || '',
        rankBelt: data.rankBelt || '',
        weightClass: data.weightClass || '',
      });
    };

    load();
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    const { data: updated } = await api.put('/api/profile', {
      ...form,
      profileImageUrl: form.profileImageUrl || null,
      gymTeam: form.gymTeam || null,
      rankBelt: form.rankBelt || null,
      weightClass: form.weightClass || null,
    });

    setUser((prev) => ({ ...prev, ...updated }));
    setMessage('Profile updated');
  };

  const onUploadImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Please upload PNG, JPG, WEBP, or GIF images only.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setMessage(`Image is too large. Please upload a file under ${MAX_AVATAR_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        profileImageUrl: typeof reader.result === 'string' ? reader.result : prev.profileImageUrl,
      }));
      setImageError(false);
      setMessage('Image selected. Save profile to apply it.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-2xl font-bold">Profile & Settings</h1>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
        {form.profileImageUrl && !imageError ? (
          <img
            src={form.profileImageUrl}
            alt="Profile"
            className="h-16 w-16 rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
            {getInitials(form.name)}
          </div>
        )}
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium dark:border-slate-600 dark:bg-slate-900">
          <ImagePlus size={16} />
          Upload profile image
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onUploadImage} />
        </label>
      </div>
      <input className="min-h-11 w-full rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className="min-h-11 w-full rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Gym / Team" value={form.gymTeam} onChange={(e) => setForm({ ...form, gymTeam: e.target.value })} />
      <input className="min-h-11 w-full rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Rank / Belt" value={form.rankBelt} onChange={(e) => setForm({ ...form, rankBelt: e.target.value })} />
      <input className="min-h-11 w-full rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800" placeholder="Weight class" value={form.weightClass} onChange={(e) => setForm({ ...form, weightClass: e.target.value })} />
      <button className="min-h-11 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950">Save profile</button>
      {message && <p className="text-sm text-emerald-500">{message}</p>}
    </form>
  );
};
