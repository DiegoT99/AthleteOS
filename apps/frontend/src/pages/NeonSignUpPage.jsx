import { SignUp } from '@stackframe/stack';

export const NeonSignUpPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="mb-4 text-2xl font-bold">Create account with Neon Auth</h1>
        <SignUp />
      </div>
    </div>
  );
};