import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wand2 } from 'lucide-react';

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

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated or not a narrator
  if (!authLoading && (!user || profile?.role !== 'narrator')) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da sessão é obrigatório',
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
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sessão criada!',
        description: `Código de convite: ${inviteCode}`,
      });

      navigate(`/session/${data.id}/lobby`);
    } catch (error: any) {
      console.error('Error creating session:', error);
      toast({
        title: 'Erro ao criar sessão',
        description: error.message || 'Tente novamente',
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
      {/* Header */}
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="medieval-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Wand2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-medieval text-2xl">
              Nova Aventura
            </CardTitle>
            <CardDescription className="font-body">
              Configure sua sessão e convide jogadores
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Session Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medieval">
                  {t.session.name} *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: A Queda do Rei Sombrio"
                  className="font-body"
                  disabled={isSubmitting}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="font-medieval">
                  {t.session.description}
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Uma breve descrição da aventura (opcional)"
                  className="font-body min-h-[100px] resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full font-medieval text-lg h-12"
                disabled={isSubmitting || !name.trim()}
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
