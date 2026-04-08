import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const PREMIUM_STATUSES = new Set(['active', 'trialing']);

export const ProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [hasPremium, setHasPremium] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setSubscriptionLoading(false);
      setHasPremium(false);
      return;
    }

    let mounted = true;

    const loadSubscription = async () => {
      setSubscriptionLoading(true);
      try {
        const { data } = await api.get('/api/subscription');
        const status = String(data?.status || 'inactive').toLowerCase();
        const premiumByStatus = PREMIUM_STATUSES.has(status);
        const premiumByServer = typeof data?.hasPremiumAccess === 'boolean' ? data.hasPremiumAccess : premiumByStatus;
        if (mounted) {
          setHasPremium(premiumByServer);
        }
      } catch {
        if (mounted) {
          setHasPremium(false);
        }
      } finally {
        if (mounted) {
          setSubscriptionLoading(false);
        }
      }
    };

    loadSubscription();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  if (loading || (isAuthenticated && subscriptionLoading)) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!hasPremium && location.pathname !== '/billing') {
    return <Navigate to="/billing" replace state={{ from: location.pathname }} />;
  }

  return children;
};
