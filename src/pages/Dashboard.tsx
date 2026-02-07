import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { CharacterOptionsModal } from '@/components/dashboard/CharacterOptionsModal';
import { 
  Users, 
  Plus, 
  LogOut, 
  Crown, 
  Scroll,
  BookOpen
} from 'lucide-react';
import logoLateral from '@/assets/logo-orcnroll-lateral.webp';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [showCharacterModal, setShowCharacterModal] = useState(false);

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

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src={logoLateral}
              alt="Orc and Roll"
              className="h-8 sm:h-10 object-contain"
            />
          </Link>

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
            {t.auth.loginTitle.replace('Back', '')} {profile.display_name || ''}
          </h2>
          <p className="text-muted-foreground font-body">
            {t.dashboard.welcomeGeneric}
          </p>
        </div>

        {/* Quick Actions - Unified for all users */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
          {/* Create Session */}
          <Link to="/session/create">
            <Card className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group h-full">
              <CardHeader className="p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <CardTitle className="font-medieval text-base md:text-lg">{t.session.create}</CardTitle>
                <CardDescription className="font-body text-xs md:text-sm">
                  {t.dashboard.createSessionDesc}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* My Sessions */}
          <Link to="/sessions">
            <Card className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group h-full">
              <CardHeader className="p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <CardTitle className="font-medieval text-base md:text-lg">{t.session.mySessions}</CardTitle>
                <CardDescription className="font-body text-xs md:text-sm">
                  {t.dashboard.mySessionsDesc}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Join Session */}
          <Link to="/join">
            <Card className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group h-full">
              <CardHeader className="p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <CardTitle className="font-medieval text-base md:text-lg">{t.session.join}</CardTitle>
                <CardDescription className="font-body text-xs md:text-sm">
                  {t.dashboard.joinSessionDesc}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Characters */}
          <Card 
            className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group h-full"
            onClick={() => setShowCharacterModal(true)}
          >
            <CardHeader className="p-4 md:p-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                <Scroll className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <CardTitle className="font-medieval text-base md:text-lg">{t.nav.characters}</CardTitle>
              <CardDescription className="font-body text-xs md:text-sm">
                {t.dashboard.charactersDesc}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Manage Marks */}
          <Link to="/marks">
            <Card className="medieval-card hover:border-primary/50 transition-colors cursor-pointer group h-full">
              <CardHeader className="p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <Crown className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <CardTitle className="font-medieval text-base md:text-lg">{t.marks.createCustom}</CardTitle>
                <CardDescription className="font-body text-xs md:text-sm">
                  {t.dashboard.marksDesc}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <RecentActivity userId={user.id} />
      </main>

      {/* Character Options Modal */}
      <CharacterOptionsModal 
        open={showCharacterModal} 
        onOpenChange={setShowCharacterModal} 
      />
    </div>
  );
}
