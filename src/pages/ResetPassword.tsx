import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import logoLarge from '@/assets/logo-orcnroll-large.webp';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery type in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      setIsRecovery(true);
      // Supabase client automatically handles the session from the URL
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          setError('Link de recuperação inválido ou expirado.');
        }
      });
    } else {
      setError('Link de recuperação inválido.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setIsSubmitting(false);
      return;
    }

    toast({
      title: 'Senha atualizada',
      description: 'Sua senha foi redefinida com sucesso. Faça login com a nova senha.',
    });

    // Sign out to require re-login with new password
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-parchment">
      <Helmet>
        <title>Redefinir Senha — Orc & Roll</title>
        <meta name="description" content="Redefina sua senha do Orc & Roll." />
        <link rel="canonical" href="https://play.orcnroll.com/reset-password" />
      </Helmet>

      <div className="mb-8 text-center">
        <img
          src={logoLarge}
          alt="Orc and Roll"
          className="w-32 h-32 mx-auto mb-4 object-contain"
        />
        <p className="text-on-light-alt font-body text-lg">
          {t.landing.tagline}
        </p>
      </div>

      <Card className="w-full max-w-md medieval-card">
        <CardHeader className="text-center">
          <CardTitle className="font-medieval text-2xl">
            Redefinir Senha
          </CardTitle>
          <CardDescription className="font-body">
            Digite sua nova senha abaixo.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 mb-4">
              <p className="text-destructive text-sm font-body">{error}</p>
            </div>
          )}

          {isRecovery && !error && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="font-body">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="font-body bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-body">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="font-body bg-input border-border"
                />
              </div>

              <Button
                type="submit"
                className="w-full btn-medieval"
                disabled={isSubmitting}
              >
                {isSubmitting ? t.common.loading : 'Redefinir Senha'}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-primary hover:underline font-body text-sm"
          >
            Voltar para o login
          </button>
        </CardFooter>
      </Card>
    </main>
  );
}
