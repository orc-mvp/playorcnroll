import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Crown, Users } from 'lucide-react';
import logoLarge from '@/assets/logo-orcnroll-large.webp';

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);

type AuthMode = 'login' | 'signup';
type Role = 'narrator' | 'player';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user, loading } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      const from = (location.state as { from?: string })?.from || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!emailSchema.safeParse(email).success) {
      newErrors.email = t.auth.emailRequired;
    }

    if (!passwordSchema.safeParse(password).success) {
      newErrors.password = t.auth.passwordTooShort;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        newErrors.confirmPassword = t.auth.passwordMismatch;
      }
      if (!role) {
        newErrors.role = 'Role is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrors({ form: t.auth.invalidCredentials });
          } else {
            setErrors({ form: error.message });
          }
        }
      } else {
        if (!role) return;
        
        const { error } = await signUp(email, password, role, displayName || undefined);
        if (error) {
          if (error.message.includes('already registered')) {
            setErrors({ form: t.auth.userExists });
          } else {
            setErrors({ form: error.message });
          }
        } else {
          toast({
            title: t.auth.checkEmail,
            description: 'Por favor, verifique sua caixa de entrada.',
          });
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrors({ form: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors({});
    setRole(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-medieval text-2xl">
          {t.common.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-parchment">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant={language === 'pt-BR' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setLanguage('pt-BR')}
          className="font-body"
        >
          PT
        </Button>
        <Button
          variant={language === 'en' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setLanguage('en')}
          className="font-body"
        >
          EN
        </Button>
      </div>

      {/* Logo */}
      <div className="mb-8 text-center">
        <img
          src={logoLarge}
          alt="Orc and Roll"
          className="w-32 h-32 mx-auto mb-4 object-contain"
        />
        <p className="text-foreground font-body text-lg">
          {language === 'pt-BR' ? 'Teatro da Mente Online' : 'Online Theater of the Mind'}
        </p>
      </div>

      <Card className="w-full max-w-md medieval-card">
        <CardHeader className="text-center">
          <CardTitle className="font-medieval text-2xl">
            {mode === 'login' ? t.auth.loginTitle : t.auth.signupTitle}
          </CardTitle>
          <CardDescription className="font-body">
            {mode === 'login' ? t.auth.loginSubtitle : t.auth.signupSubtitle}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-3">
                <Label className="font-body">{t.auth.selectRole}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('narrator')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      role === 'narrator'
                        ? 'border-primary bg-primary/10 gold-border'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <Crown className={`w-8 h-8 mx-auto mb-2 ${role === 'narrator' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-medieval text-sm">{t.auth.narrator}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-body">
                      {t.auth.narratorDesc}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('player')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      role === 'player'
                        ? 'border-primary bg-primary/10 gold-border'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <Users className={`w-8 h-8 mx-auto mb-2 ${role === 'player' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-medieval text-sm">{t.auth.player}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-body">
                      {t.auth.playerDesc}
                    </p>
                  </button>
                </div>
                {errors.role && (
                  <p className="text-destructive text-sm font-body">{errors.role}</p>
                )}
              </div>
            )}

            {/* Display Name (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="font-body">
                  {t.character.name} ({t.common.cancel.toLowerCase()})
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Sir Lancelot"
                  className="font-body bg-input border-border"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body">{t.auth.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hero@kingdom.com"
                required
                className="font-body bg-input border-border"
              />
              {errors.email && (
                <p className="text-destructive text-sm font-body">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="font-body">{t.auth.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="font-body bg-input border-border"
              />
              {errors.password && (
                <p className="text-destructive text-sm font-body">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-body">
                  {t.auth.confirmPassword}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="font-body bg-input border-border"
                />
                {errors.confirmPassword && (
                  <p className="text-destructive text-sm font-body">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Form Error */}
            {errors.form && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-destructive text-sm font-body">{errors.form}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full btn-medieval"
              disabled={isSubmitting}
            >
              {isSubmitting ? t.common.loading : (mode === 'login' ? t.auth.login : t.auth.signup)}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="ornate-divider w-full" />
          <p className="text-center text-muted-foreground font-body text-sm">
            {mode === 'login' ? t.auth.noAccount : t.auth.hasAccount}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary hover:underline font-semibold"
            >
              {mode === 'login' ? t.auth.signup : t.auth.login}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
