export const DEFAULT_CATEGORIES = [
  { name: 'BJJ', slug: 'bjj' },
  { name: 'Gym / Weightlifting', slug: 'gym-weightlifting' },
  { name: 'Judo', slug: 'judo' },
  { name: 'Boxing', slug: 'boxing' },
  { name: 'Wrestling', slug: 'wrestling' },
  { name: 'Muay Thai', slug: 'muay-thai' },
  { name: 'MMA', slug: 'mma' },
  { name: 'Running / Conditioning', slug: 'running-conditioning' },
];

export const PREMIUM_STATUSES = ['trialing', 'active'];

export const hasPremiumAccess = (subscription) => {
  if (!subscription) {
    return false;
  }

  if (!PREMIUM_STATUSES.includes(subscription.status)) {
    return false;
  }

  const accessEndsAt = subscription.currentPeriodEnd ?? subscription.trialEnd;

  if (!accessEndsAt) {
    return true;
  }

  return new Date(accessEndsAt).getTime() > Date.now();
};

export const ADMIN_EMAILS = ['diegotwebdesign@gmail.com'];

export const isAdminEmail = (email) => {
  if (!email) {
    return false;
  }

  const normalized = String(email).trim().toLowerCase();
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
};
