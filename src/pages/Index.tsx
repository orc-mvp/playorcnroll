import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Sword, Shield, Scroll, Flame, Snowflake, Crown, Users, Dices } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, language, setLanguage } = useI18n();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
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

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 opacity-10">
            <Shield className="w-32 h-32 text-primary" />
          </div>
          <div className="absolute bottom-20 right-10 opacity-10">
            <Sword className="w-32 h-32 text-primary transform rotate-45" />
          </div>
          <div className="absolute top-40 right-20 opacity-5">
            <Scroll className="w-24 h-24 text-foreground" />
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center z-10 max-w-4xl mx-auto">
          {/* Title */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Sword className="w-12 h-12 md:w-16 md:h-16 text-primary animate-pulse-gold" />
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-medieval text-foreground text-shadow-medieval">
              Heróis Marcados
            </h1>
            <Sword className="w-12 h-12 md:w-16 md:h-16 text-primary transform scale-x-[-1] animate-pulse-gold" />
          </div>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground font-body mb-4">
            {language === 'pt-BR' 
              ? 'Um RPG narrativo de fantasia medieval'
              : 'A narrative fantasy medieval RPG'
            }
          </p>

          <p className="text-lg text-muted-foreground/80 font-body mb-12 max-w-2xl mx-auto">
            {language === 'pt-BR'
              ? 'Onde heróis são definidos por suas marcas, e cada escolha molda o destino.'
              : 'Where heroes are defined by their marks, and every choice shapes destiny.'
            }
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/auth">
              <Button size="lg" className="btn-medieval text-lg px-8 py-6">
                <Crown className="w-5 h-5 mr-2" />
                {t.auth.signup}
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="btn-medieval text-lg px-8 py-6">
                {t.auth.login}
              </Button>
            </Link>
          </div>

          {/* Feature Icons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Dices className="w-7 h-7 text-primary" />
              </div>
              <span className="font-medieval text-sm text-foreground">
                {language === 'pt-BR' ? 'Dados 3D' : '3D Dice'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <span className="font-medieval text-sm text-foreground">
                {language === 'pt-BR' ? 'Tempo Real' : 'Real-time'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Flame className="w-7 h-7 text-orange-400" />
              </div>
              <span className="font-medieval text-sm text-foreground">
                {language === 'pt-BR' ? 'Extremos' : 'Extremes'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Scroll className="w-7 h-7 text-primary" />
              </div>
              <span className="font-medieval text-sm text-foreground">
                {language === 'pt-BR' ? 'Marcas' : 'Marks'}
              </span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-medieval text-center mb-12 text-foreground text-shadow-medieval">
            {language === 'pt-BR' ? 'Sistema de Jogo' : 'Game System'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Attributes */}
            <div className="medieval-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medieval text-xl">
                  {language === 'pt-BR' ? '5 Atributos' : '5 Attributes'}
                </h3>
              </div>
              <ul className="space-y-2 font-body text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  {t.attributes.aggression}
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  {t.attributes.determination}
                </li>
                <li className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-pink-400" />
                  {t.attributes.seduction}
                </li>
                <li className="flex items-center gap-2">
                  <Scroll className="w-4 h-4 text-purple-400" />
                  {t.attributes.cunning}
                </li>
                <li className="flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-blue-400" />
                  {t.attributes.faith}
                </li>
              </ul>
            </div>

            {/* Dice System */}
            <div className="medieval-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Dices className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medieval text-xl">
                  {language === 'pt-BR' ? 'Sistema 2d6' : '2d6 System'}
                </h3>
              </div>
              <p className="font-body text-muted-foreground mb-4">
                {language === 'pt-BR' 
                  ? 'Role 2 dados e some modificadores. Resultados especiais ativam Extremos!'
                  : 'Roll 2 dice and add modifiers. Special results trigger Extremes!'
                }
              </p>
              <div className="space-y-1 text-sm font-body">
                <div className="flex justify-between text-destructive">
                  <span>6-</span>
                  <span>{t.tests.failure}</span>
                </div>
                <div className="flex justify-between text-warning">
                  <span>7-9</span>
                  <span>{t.tests.partial}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>10+</span>
                  <span>{t.tests.success}</span>
                </div>
              </div>
            </div>

            {/* Marks */}
            <div className="medieval-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Scroll className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medieval text-xl">
                  {language === 'pt-BR' ? 'Marcas' : 'Marks'}
                </h3>
              </div>
              <p className="font-body text-muted-foreground">
                {language === 'pt-BR'
                  ? 'Heróis são definidos por suas Marcas - habilidades especiais que influenciam dados e narrativa. Evolua de Marcas Menores para Épicas!'
                  : 'Heroes are defined by their Marks - special abilities that influence dice and narrative. Evolve from Minor to Epic Marks!'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sword className="w-5 h-5 text-primary" />
            <span className="font-medieval text-foreground">Heróis Marcados</span>
          </div>
          <p className="text-sm text-muted-foreground font-body">
            {language === 'pt-BR' 
              ? 'Um RPG narrativo de fantasia medieval'
              : 'A narrative fantasy medieval RPG'
            }
          </p>
        </div>
      </footer>
    </div>
  );
}
