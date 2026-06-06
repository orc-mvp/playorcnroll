import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PremiumState {
  isPremium: boolean;
  loading: boolean;
  status: string | null;
  paymentMethod: string | null;
  currentPeriodEnd: string | null;
  daysUntilExpiry: number | null;
  isSuperadmin: boolean;
  refresh: () => Promise<void>;
}

export function usePremium(): PremiumState {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setIsPremium(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: sub }, { data: roles }] = await Promise.all([
      supabase.from('subscriptions').select('status, payment_method, current_period_end').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', user.id),
    ]);
    const superadmin = !!roles?.some((r: any) => r.role === 'superadmin');
    const admin = !!roles?.some((r: any) => r.role === 'admin');
    const periodActive = sub?.current_period_end ? new Date(sub.current_period_end).getTime() > Date.now() : false;
    setIsSuperadmin(superadmin);
    setIsPremium(superadmin || admin || periodActive);
    setStatus(sub?.status ?? null);
    setPaymentMethod(sub?.payment_method ?? null);
    setCurrentPeriodEnd(sub?.current_period_end ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`subs-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` }, () => fetchAll())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetchAll]);

  const daysUntilExpiry = currentPeriodEnd
    ? Math.ceil((new Date(currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return { isPremium, loading, status, paymentMethod, currentPeriodEnd, daysUntilExpiry, isSuperadmin, refresh: fetchAll };
}
