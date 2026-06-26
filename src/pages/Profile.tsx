import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';

import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, KeyRound, Crown } from 'lucide-react';
import { UserMenu } from '@/components/UserMenu';
import UpgradeBanner from '@/components/UpgradeBanner';
import logoLateral from '@/assets/logo-orcnroll-lateral.webp';

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, loading, updateProfile } = useAuth();
  const { isPremium, planName, status, currentPeriodEnd, loading: premiumLoading } = usePremium();

  const { t, language, setLanguage } = useI18n();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  const handleUpdateName = async () => {
    setSavingName(true);
    const { error } = await updateProfile({ display_name: displayName });
    setSavingName(false);
    if (error) {
      toast({ title: t.profile.errorUpdatingName, variant: 'destructive' });
    } else {
      toast({ title: t.profile.nameUpdated });
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: t.auth.passwordTooShort, variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t.auth.passwordMismatch, variant: 'destructive' });
      return;
    }

    setSavingPassword(true);
    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    });

    if (signInError) {
      setSavingPassword(false);
      toast({ title: t.auth.invalidCredentials, variant: 'destructive' });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      toast({ title: t.profile.errorUpdatingPassword, variant: 'destructive' });
    } else {
      toast({ title: t.profile.passwordUpdated });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-medieval text-2xl">
          {t.common.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img src={logoLateral} alt="Orc and Roll" className="h-8 sm:h-10 object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <Button
                variant={language === 'pt-BR' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLanguage('pt-BR')}
                className="text-xs px-2"
              >
                PT
              </Button>
              <Button
                variant={language === 'en' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLanguage('en')}
                className="text-xs px-2"
              >
                EN
              </Button>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>
      <UpgradeBanner />

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4" />
          {t.common.back}
        </Button>

        <h1 className="font-medieval text-3xl text-foreground mb-6 text-shadow-medieval">
          {t.profile.title}
        </h1>

        {/* Change Name */}
        <Card className="medieval-card mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="font-medieval text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {t.profile.changeName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-body">{t.auth.displayName}</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t.profile.namePlaceholder}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-body">Email</Label>
              <p className="font-body text-sm text-muted-foreground mt-1">{user?.email}</p>
            </div>
            <Button onClick={handleUpdateName} disabled={savingName || !displayName.trim()}>
              {savingName ? t.profile.updating : t.common.save}
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card className="medieval-card mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="font-medieval text-lg flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {premiumLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm">Status</span>
                  <span className={`font-body text-sm font-semibold ${isPremium ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    {isPremium ? 'Premium' : 'Free'}
                  </span>
                </div>
                {planName && (
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">Plano</span>
                    <span className="font-body text-sm font-semibold">{planName}</span>
                  </div>
                )}
                {!isPremium && status && status !== 'active' && (
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">Situação</span>
                    <span className="font-body text-sm text-muted-foreground capitalize">{status}</span>
                  </div>
                )}
                {isPremium && currentPeriodEnd && (
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">Válido até</span>
                    <span className="font-body text-sm text-muted-foreground">
                      {new Date(currentPeriodEnd).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}

        <Card className="medieval-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-medieval text-lg flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              {t.profile.changePassword}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-body">{t.profile.currentPassword}</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-body">{t.profile.newPassword}</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-body">{t.profile.confirmNewPassword}</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleUpdatePassword}
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {savingPassword ? t.profile.updating : t.common.save}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
