import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Sword, 
  Users, 
  Plus, 
  LogOut, 
  Crown, 
  Scroll,
  BookOpen
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const { t, language, setLanguage } = useI18n();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
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

  if (!user || !profile) {
    return null;
  }

  const isNarrator = profile.role === 'narrator';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sword className="w-6 h-6 text-primary" />
            <h1 className="font-medieval text-xl md:text-2xl text-foreground">
              Heróis Marcados
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
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

            {/* User Info */}
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              {isNarrator ? <Crown className="w-4 h-4 text-primary" /> : <Users className="w-4 h-4 text-primary" />}
              <span className="font-body">
                {profile.display_name || user.email}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medieval">
                {isNarrator ? t.roles.narrator : t.roles.player}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              title={t.auth.logout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h2 className="font-medieval text-3xl md:text-4xl text-foreground mb-2 text-shadow-medieval">
            {t.auth.loginTitle.replace('Back', '')} {profile.display_name || t.roles[profile.role]}
          </h2>
          <p className="text-muted-foreground font-body">
            {isNarrator 
              ? 'Gerencie suas sessões e conduza aventuras épicas'
              : 'Gerencie seus personagens e participe de aventuras'
            }
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {isNarrator ? (
            <>
              {/* Create Session */}
              <Link to="/session/create">
                <Card className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-medieval">{t.session.create}</CardTitle>
                    <CardDescription className="font-body">
                      Inicie uma nova aventura com seus jogadores
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              {/* My Sessions */}
              <Link to="/sessions">
                <Card className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-medieval">{t.session.mySessions}</CardTitle>
                    <CardDescription className="font-body">
                      Acesse sessões anteriores e em andamento
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              {/* Manage Marks */}
              <Card className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                    <Scroll className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-medieval">{t.marks.createCustom}</CardTitle>
                  <CardDescription className="font-body">
                    Crie marcas personalizadas para suas campanhas
                  </CardDescription>
                </CardHeader>
              </Card>
            </>
          ) : (
            <>
              {/* Create Character */}
              <Link to="/character/create">
                <Card className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-medieval">{t.character.create}</CardTitle>
                    <CardDescription className="font-body">
                      Crie um novo herói para suas aventuras
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              {/* My Characters */}
              <Link to="/characters">
                <Card className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-medieval">{t.nav.characters}</CardTitle>
                    <CardDescription className="font-body">
                      Gerencie seus personagens existentes
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              {/* Join Session */}
              <Link to="/join">
                <Card className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-medieval">{t.session.join}</CardTitle>
                    <CardDescription className="font-body">
                      Entre em uma sessão usando código de convite
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </>
          )}
        </div>

        {/* Recent Activity */}
        <Card className="medieval-card">
          <CardHeader>
            <CardTitle className="font-medieval flex items-center gap-2">
              <Scroll className="w-5 h-5 text-primary" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground font-body">
              <p>Nenhuma atividade recente</p>
              <p className="text-sm mt-2">
                {isNarrator 
                  ? 'Crie uma sessão para começar!'
                  : 'Crie um personagem ou entre em uma sessão!'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
