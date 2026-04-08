import { useState } from 'react';
import { api } from '../lib/api';

export const ResetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [message, setMessage] = useState('');

  const requestReset = async (event) => {
    event.preventDefault();
    const { data } = await api.post('/api/auth/password-reset/request', { email });
    setGeneratedToken(data.resetToken || '');
    setMessage(data.message);
  };

  const confirmReset = async (event) => {
    event.preventDefault();
    const { data } = await api.post('/api/auth/password-reset/confirm', {
      token,
      newPassword,
    });
    setMessage(data.message);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">Password Reset</h1>
        <form onSubmit={requestReset} className="space-y-2">
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2"
            placeholder="Account email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="rounded-lg bg-slate-700 px-3 py-2 text-sm">Generate reset token</button>
        </form>

        {generatedToken && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
            Basic implementation token: <span className="font-mono">{generatedToken}</span>
          </div>
        )}

        <form onSubmit={confirmReset} className="space-y-2">
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2"
            placeholder="Reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2"
            placeholder="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
          <button className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-900">
            Set new password
          </button>
        </form>

        {message && <p className="text-sm text-slate-300">{message}</p>}
      </div>
    </div>
  );
};
