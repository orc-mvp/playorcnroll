import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, QrCode, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UpgradeBanner from '@/components/UpgradeBanner';

export default function Upgrade() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isPremium, status, paymentMethod, currentPeriodEnd, daysUntilExpiry, isSuperadmin } = usePremium();
  const { t } = useI18n();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  if (!authLoading && !user) {
    navigate('/login?returnTo=/upgrade');
    return null;
  }

  const checkout = async (method: 'card' | 'pix') => {
    setBusy(method);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', { body: { method } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      toast({ title: 'Erro', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const portal = async () => {
    setBusy('portal');
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      toast({ title: 'Erro', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-medieval text-xl">{t.upgrade?.pageTitle}</h1>
        </div>
      </header>
      <UpgradeBanner />

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {isPremium && (
          <Card className="border-emerald-600/40 bg-emerald-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                {t.upgrade?.activeTitle}
              </CardTitle>
              <CardDescription>
                {isSuperadmin
                  ? t.upgrade?.superadminNote
                  : currentPeriodEnd
                    ? `${t.upgrade?.validUntil} ${new Date(currentPeriodEnd).toLocaleDateString()} (${daysUntilExpiry ?? 0} ${t.upgrade?.daysLeft})`
                    : status}
              </CardDescription>
            </CardHeader>
            {paymentMethod === 'card' && (
              <CardContent>
                <Button onClick={portal} disabled={busy === 'portal'}>
                  {t.upgrade?.managePortal}
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" /> {t.upgrade?.planTitle}
                </CardTitle>
                <CardDescription>{t.upgrade?.planDescription}</CardDescription>
              </div>
              <Badge variant="secondary" className="text-base">R$ 4,90 / {t.upgrade?.monthShort}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="w-4 h-4" /> {t.upgrade?.cardTitle}
                </CardTitle>
                <CardDescription>{t.upgrade?.cardDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => checkout('card')} disabled={!!busy}>
                  {busy === 'card' ? '...' : t.upgrade?.payWithCard}
                </Button>
              </CardContent>
            </Card>
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <QrCode className="w-4 h-4" /> {t.upgrade?.pixTitle}
                </CardTitle>
                <CardDescription>{t.upgrade?.pixDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => checkout('pix')} disabled={!!busy}>
                  {busy === 'pix' ? '...' : t.upgrade?.payWithPix}
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">{t.upgrade?.footerNote}</p>
      </main>
    </div>
  );
}
