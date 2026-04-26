import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleEditor } from '@/components/ui/simple-editor';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wand2 } from 'lucide-react';
import SessionFamilySelector from '@/components/SessionFamilySelector';
import type { GameSystemFamily } from '@/lib/gameSystems';
import { GameSystemId, getGameSystem } from '@/lib/gameSystems';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function CreateSession() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const [family, setFamily] = useState<GameSystemFamily | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!authLoading && !user) {
    navigate('/auth', { replace: true });
    return null;
  }

  /**
   * Mapeia a família escolhida para o `game_system` que será gravado em
   * `sessions.game_system`. Famílias unificadas usam o ID da família.
   * - `herois_marcados` → sala dedicada de Heróis Marcados.
   * - `storyteller`     → sala unificada WoD; aceita personagens de
   *   Vampiro/Lobisomem/Mago/Metamorfos sem amarrar a sessão a um
   *   sistema único (o sistema de cada personagem é definido na ficha).
   */
  const familyToGameSystem = (f: GameSystemFamily): string => f;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!family) {
      toast({
        title: t.session.error,
        description: t.session.selectGameSystem,
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: t.session.error,
        description: t.session.sessionNameRequired,
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    try {
      const inviteCode = generateInviteCode();

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          narrator_id: user.id,
          invite_code: inviteCode,
          status: 'lobby',
          game_system: gameSystem,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t.session.sessionCreated,
        description: `${t.session.inviteCode}: ${inviteCode}`,
      });

      navigate(`/session/${data.id}/lobby`);
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error creating session:', error);
      toast({
        title: t.session.errorCreatingSession,
        description: error.message || t.session.tryAgain,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-medieval text-2xl">
          {t.common.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-medieval text-lg sm:text-xl md:text-2xl text-foreground truncate">
            {t.session.create}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="medieval-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Wand2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-medieval text-2xl">
              {t.session.newAdventure}
            </CardTitle>
            <CardDescription className="font-body">
              {t.session.configureSession}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-medieval">
                  {t.session.gameSystem} *
                </Label>
                <GameSystemSelector
                  value={gameSystem}
                  onChange={setGameSystem}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="font-medieval">
                  {t.session.name} *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.session.sessionNamePlaceholder}
                  className="font-body"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-medieval">
                  {t.session.description}
                </Label>
                <SimpleEditor
                  value={description}
                  onChange={setDescription}
                  placeholder={t.session.sessionDescPlaceholder}
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                className="w-full font-medieval text-lg h-12"
                disabled={isSubmitting || !name.trim() || !gameSystem || !getGameSystem(gameSystem)?.available}
              >
                {isSubmitting ? t.common.loading : t.session.create}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
