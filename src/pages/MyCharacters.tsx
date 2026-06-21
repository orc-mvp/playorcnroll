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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
  Moon,
  Dog,
  Star,
  PawPrint,
  Trash2,
} from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';
import UpgradeBanner from '@/components/UpgradeBanner';
import UpgradeRequiredModal from '@/components/UpgradeRequiredModal';
import { getGameSystem, GameSystemId } from '@/lib/gameSystems';

interface Character {
  id: string;
  name: string;
  concept: string | null;
  game_system: string;
  aggression_type: string;
  determination_type: string;
  seduction_type: string;
  cunning_type: string;
  faith_type: string;
  heroic_moves_stored: number;
  minor_marks: string[] | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 9;

const attributeIcons: Record<string, React.ElementType> = {
  aggression: Sword,
  determination: Shield,
  seduction: Heart,
  cunning: Brain,
  faith: Flame,
};

type SystemStyle = {
  Icon: React.ElementType;
  badgeClass: string;
  avatarClass: string;
  avatarIconClass: string;
  edition: string | null;
};

const systemStyles: Record<string, SystemStyle> = {
  herois_marcados: {
    Icon: Sword,
    badgeClass: 'bg-primary/10 text-primary border-primary/40',
    avatarClass: 'bg-primary/10 hover:bg-primary/20',
    avatarIconClass: 'text-primary',
    edition: null,
  },
  vampiro_v3: {
    Icon: Moon,
    badgeClass: 'bg-red-500/10 text-red-500 border-red-500/40',
    avatarClass: 'bg-red-500/10 hover:bg-red-500/20',
    avatarIconClass: 'text-red-500',
    edition: 'V3',
  },
  lobisomem_w20: {
    Icon: Dog,
    badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40',
    avatarClass: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    avatarIconClass: 'text-emerald-500',
    edition: '20ª Ed',
  },
  lobisomem_w5: {
    Icon: Dog,
    badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40',
    avatarClass: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    avatarIconClass: 'text-emerald-500',
    edition: '5ª Ed',
  },
  mago_m20: {
    Icon: Star,
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/40',
    avatarClass: 'bg-purple-500/10 hover:bg-purple-500/20',
    avatarIconClass: 'text-purple-400',
    edition: '20ª Ed',
  },
  mago_m5: {
    Icon: Star,
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/40',
    avatarClass: 'bg-purple-500/10 hover:bg-purple-500/20',
    avatarIconClass: 'text-purple-400',
    edition: '5ª Ed',
  },
  metamorfos_w20: {
    Icon: PawPrint,
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/40',
    avatarClass: 'bg-amber-500/10 hover:bg-amber-500/20',
    avatarIconClass: 'text-amber-500',
    edition: '20ª Ed',
  },
};

const defaultSystemStyle: SystemStyle = {
  Icon: Sword,
  badgeClass: 'bg-primary/10 text-primary border-primary/40',
  avatarClass: 'bg-primary/10 hover:bg-primary/20',
  avatarIconClass: 'text-primary',
  edition: null,
};

export default function MyCharacters() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { isPremium } = usePremium();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const canCreate = isPremium || characters.length < 3;

  useEffect(() => {
    if (!user) return;

    const fetchCharacters = async () => {
      // Select only fields used by the cards — avoid fetching heavy jsonb (vampiro_data, marks, narratives, notes)
      const { data } = await supabase
        .from('characters')
        .select(
          'id, name, concept, game_system, aggression_type, determination_type, seduction_type, cunning_type, faith_type, heroic_moves_stored, minor_marks, created_at'
        )
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      setCharacters((data as Character[]) || []);
      setLoading(false);
    };

    fetchCharacters();
  }, [user]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      // Check if character is in any active session
      const { data: activeParticipations } = await supabase
        .from('session_participants')
        .select('id, session_id, sessions!inner(status)')
        .eq('character_id', deleteTarget.id);

      const inActiveSession = activeParticipations?.some(
        (p: any) => p.sessions?.status !== 'ended'
      );

      if (inActiveSession) {
        toast({
          title: t.myCharacters.cannotDeleteInSession,
          variant: 'destructive',
        });
        setDeleting(false);
        setDeleteTarget(null);
        return;
      }

      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      setCharacters((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast({
        title: t.myCharacters.characterDeleted,
        description: deleteTarget.name,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error deleting character:', error);
      toast({
        title: t.myCharacters.errorDeleting,
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

  const totalPages = Math.ceil(characters.length / ITEMS_PER_PAGE);
  const paginatedCharacters = characters.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getSystemInfo = (systemId: string) => {
    const system = getGameSystem(systemId as GameSystemId);
    const style = systemStyles[systemId] || defaultSystemStyle;
    return { system, style };
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-5 h-5 text-primary shrink-0" />
              <h1 className="font-medieval text-lg sm:text-xl text-foreground truncate">{t.nav.characters}</h1>
            </div>
          </div>

          {canCreate ? (
            <Link to="/character/create" className="shrink-0">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">{t.character.create}</span>
                <span className="sm:hidden">{t.myCharacters.newShort}</span>
              </Button>
            </Link>
          ) : (
            <Button size="sm" className="shrink-0" onClick={() => setUpgradeOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{t.character.create}</span>
              <span className="sm:hidden">{t.myCharacters.newShort}</span>
            </Button>
          )}
        </div>
      </header>
      <UpgradeBanner />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {characters.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCharacters.map((char) => {
                const strongAttrs = getStrongAttributes(char);
                const { system, Icon: SystemIcon, color } = getSystemInfo(char.game_system);

                return (
                  <Card
                    key={char.id}
                    className="medieval-card hover:border-primary/50 transition-colors group"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <Link
                            to={`/character/${char.id}`}
                            className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 hover:bg-primary/20 transition-colors"
                          >
                            <User className="w-6 h-6 text-primary" />
                          </Link>
                          
                          <div className="flex items-center gap-1">
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-1.5 py-0.5 ${color} border-current/30`}
                            >
                              <SystemIcon className="w-3 h-3 mr-1" />
                              {system?.shortName || 'PBTA'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`${t.common.delete} ${char.name}`}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeleteTarget(char);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        <Link to={`/character/${char.id}`} className="flex-1 min-w-0">
                          <h3 className="font-medieval text-base truncate hover:text-primary transition-colors">
                            {char.name}
                          </h3>
                          {char.concept && (
                            <p className="text-xs text-muted-foreground font-body truncate">
                              {char.concept}
                            </p>
                          )}
                        </Link>

                        {char.game_system === 'herois_marcados' && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-0.5">
                              {strongAttrs.map((attr) => {
                                const AttrIcon = attributeIcons[attr];
                                return (
                                  <AttrIcon
                                    key={attr}
                                    className="w-3.5 h-3.5 text-green-500"
                                    title={t.attributes[attr]}
                                  />
                                );
                              })}
                            </div>

                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {char.minor_marks?.length || 0} {t.character.minorMarks}
                            </Badge>

                            {char.heroic_moves_stored > 0 && (
                              <div className="flex items-center gap-0.5 text-[10px] text-primary">
                                <Sparkles className="w-3 h-3" />
                                <span>{char.heroic_moves_stored}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <Card className="medieval-card">
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medieval text-lg mb-2">
                {t.myCharacters.noCharacters}
              </h3>
              <p className="text-muted-foreground font-body mb-4">
                {t.myCharacters.createFirst}
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

      <UpgradeRequiredModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />



      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-medieval">
              {t.myCharacters.deleteCharacter}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              {t.myCharacters.deleteConfirm.replace('{name}', deleteTarget?.name || '')}
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
