import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const SignupPage = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold">Create your AthleteOS account</h1>
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          minLength={8}
          required
        />
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button className="w-full rounded-lg bg-emerald-400 py-2 font-semibold text-slate-900">Start Free Trial</button>
        <p className="text-sm text-slate-400">
          Already have an account? <Link className="text-emerald-300" to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};
