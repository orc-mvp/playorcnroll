import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sword, Moon, Users, Dices, Zap, Shield } from 'lucide-react';
import { GAME_SYSTEMS } from '@/lib/gameSystems';
import logoLarge from '@/assets/logo-orcnroll-large.webp';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, language, setLanguage } = useI18n();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const systemIcons = {
    herois_marcados: <Sword className="w-10 h-10" />,
    vampiro_v3: <Moon className="w-10 h-10" />,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="container mx-auto flex items-center justify-between">
          {/* Language Toggle */}
          <div className="flex gap-2">
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

          {/* Login Button */}
          <Link to="/login">
            <Button variant="outline" className="font-medieval">
              {t.auth.login}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 bg-parchment">
        {/* Logo */}
        <div className="mb-6">
          <img
            src={logoLarge}
            alt="Orc and Roll"
            className="w-40 h-40 md:w-56 md:h-56 object-contain"
          />
        </div>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-on-light-alt font-body mb-12 text-center">
          {t.landing.tagline}
        </p>

        {/* Game Systems Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full mb-12">
          {GAME_SYSTEMS.map((system) => {
            const description = system.description[language as 'pt-BR' | 'en'] || system.description['pt-BR'];
            
            return (
              <div
                key={system.id}
                className="relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-primary bg-card hover:border-primary/80 transition-all"
              >
                <div
                  className={`p-4 rounded-full ${
                    system.color === 'primary'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-destructive/20 text-destructive'
                  }`}
                >
                  {systemIcons[system.id]}
                </div>

                <div className="text-center">
                  <h3 className="font-medieval text-xl font-semibold mb-1 text-foreground">
                    {system.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-body">
                    {system.shortName}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground font-body text-center">
                  {description}
                </p>

                <div className="flex flex-wrap justify-center gap-1">
                  {system.features.slice(0, 3).map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                <Link to="/login" className="w-full">
                  <Button className="w-full font-medieval">
                    {t.landing.play}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link to="/signup">
            <Button size="lg" className="font-medieval text-lg px-8 py-6">
              {t.auth.signup}
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-medieval text-center mb-12 text-foreground">
            {t.landing.platformFeatures}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 3D Dice */}
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Dices className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-medieval text-xl mb-2">
                {t.landing.dice3d}
              </h3>
              <p className="text-muted-foreground font-body text-sm">
                {t.landing.dice3dDesc}
              </p>
            </div>

            {/* Real-time */}
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-medieval text-xl mb-2">
                {t.landing.realtime}
              </h3>
              <p className="text-muted-foreground font-body text-sm">
                {t.landing.realtimeDesc}
              </p>
            </div>

            {/* Managed Sessions */}
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-medieval text-xl mb-2">
                {t.landing.managedSessions}
              </h3>
              <p className="text-muted-foreground font-body text-sm">
                {t.landing.managedSessionsDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border bg-parchment">
        <div className="container mx-auto text-center">
          <img
            src={logoLarge}
            alt="Orc and Roll"
            className="w-12 h-12 mx-auto mb-4 object-contain"
          />
          <p className="text-sm text-on-light-alt font-body">
            {t.landing.tagline}
          </p>
        </div>
      </footer>
    </div>
  );
}
