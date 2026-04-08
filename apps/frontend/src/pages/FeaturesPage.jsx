export const FeaturesPage = () => {
  const features = [
    'Dedicated category data contexts',
    'Martial arts technique logs with progression',
    'Advanced notebook with tags and filters',
    'Goals with deadlines and progress tracking',
    'Dashboard with streak, summary, and quick access',
    'Stripe-based subscription and trial management',
  ];

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">Features</h1>
        <div className="mt-6 grid gap-3">
          {features.map((feature) => (
            <div key={feature} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
