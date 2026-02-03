import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  User,
  Plus,
  Sword,
  Shield,
  Heart,
  Brain,
  Flame,
  Sparkles,
  ChevronRight,
  Trash2,
} from 'lucide-react';

interface Character {
  id: string;
  name: string;
  concept: string | null;
  aggression_type: string;
  determination_type: string;
  seduction_type: string;
  cunning_type: string;
  faith_type: string;
  heroic_moves_stored: number;
  minor_marks: string[] | null;
  created_at: string;
}

const attributeIcons: Record<string, React.ElementType> = {
  aggression: Sword,
  determination: Shield,
  seduction: Heart,
  cunning: Brain,
  faith: Flame,
};

export default function MyCharacters() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useI18n();
  const { toast } = useToast();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchCharacters = async () => {
      const { data } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      setCharacters(data || []);
      setLoading(false);
    };

    fetchCharacters();
  }, [user]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      setCharacters((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast({
        title: language === 'pt-BR' ? 'Personagem excluído' : 'Character deleted',
        description: deleteTarget.name,
      });
    } catch (error) {
      console.error('Error deleting character:', error);
      toast({
        title: language === 'pt-BR' ? 'Erro ao excluir' : 'Error deleting',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-medieval text-2xl">
          {t.common.loading}
        </div>
      </div>
    );
  }

  const getStrongAttributes = (char: Character) => {
    const attrs = ['aggression', 'determination', 'seduction', 'cunning', 'faith'] as const;
    return attrs.filter((attr) => char[`${attr}_type` as keyof Character] === 'strong');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h1 className="font-medieval text-xl text-foreground">{t.nav.characters}</h1>
            </div>
          </div>

          <Link to="/character/create">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              {t.character.create}
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {characters.length > 0 ? (
          <div className="grid gap-4">
            {characters.map((char) => {
              const strongAttrs = getStrongAttributes(char);

              return (
                <Card
                  key={char.id}
                  className="medieval-card hover:border-primary/50 transition-colors group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Link
                        to={`/character/${char.id}`}
                        className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 hover:bg-primary/20 transition-colors"
                      >
                        <User className="w-7 h-7 text-primary" />
                      </Link>

                      <Link to={`/character/${char.id}`} className="flex-1 min-w-0">
                        <h3 className="font-medieval text-lg truncate hover:text-primary transition-colors">
                          {char.name}
                        </h3>
                        {char.concept && (
                          <p className="text-sm text-muted-foreground font-body truncate">
                            {char.concept}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2">
                          {/* Strong Attributes */}
                          <div className="flex items-center gap-1">
                            {strongAttrs.map((attr) => {
                              const Icon = attributeIcons[attr];
                              return (
                                <Icon
                                  key={attr}
                                  className="w-4 h-4 text-green-500"
                                  title={t.attributes[attr]}
                                />
                              );
                            })}
                          </div>

                          {/* Minor Marks Count */}
                          <Badge variant="outline" className="text-xs">
                            {char.minor_marks?.length || 0} {t.character.minorMarks}
                          </Badge>

                          {/* Heroic Moves */}
                          {char.heroic_moves_stored > 0 && (
                            <div className="flex items-center gap-1 text-xs text-primary">
                              <Sparkles className="w-3 h-3" />
                              <span>{char.heroic_moves_stored}</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteTarget(char);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Link to={`/character/${char.id}`}>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="medieval-card">
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medieval text-lg mb-2">
                {language === 'pt-BR' ? 'Nenhum personagem' : 'No characters'}
              </h3>
              <p className="text-muted-foreground font-body mb-4">
                {language === 'pt-BR'
                  ? 'Crie seu primeiro herói para começar!'
                  : 'Create your first hero to get started!'}
              </p>
              <Link to="/character/create">
                <Button>
                  <Plus className="w-4 h-4 mr-1" />
                  {t.character.create}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-medieval">
              {language === 'pt-BR' ? 'Excluir Personagem?' : 'Delete Character?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              {language === 'pt-BR' ? (
                <>
                  Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Esta ação
                  não pode ser desfeita. Todas as marcas, narrativas e progresso serão perdidos
                  permanentemente.
                </>
              ) : (
                <>
                  Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This
                  action cannot be undone. All marks, narratives, and progress will be permanently
                  lost.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t.common.loading : t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
