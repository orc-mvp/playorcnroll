import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  User,
  Sword,
  Shield,
  Heart,
  Brain,
  Flame,
  Sparkles,
  Star,
  Skull,
  Crown,
  Users,
  ScrollText,
  AlertTriangle,
  Clock,
  Check,
  Pencil,
} from 'lucide-react';
import { EditCharacterModal } from '@/components/character/EditCharacterModal';
import type { Json } from '@/integrations/supabase/types';

interface MajorMark {
  name: string;
  scope: string;
  effect: string;
  is_permanent?: boolean;
  is_temporary?: boolean;
  created_at?: string;
}

interface ExtendedNarrative {
  type: 'npc' | 'reputation' | 'resource' | 'promise';
  name: string;
  description: string;
  created_at?: string;
}

interface MinorMarkData {
  id: string;
  name: string;
  attribute: string;
  description: string;
  effect: string;
}

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
  major_marks: Json | null;
  epic_marks: Json | null;
  negative_marks: Json | null;
  extended_narratives: Json | null;
  mark_progress: Json | null;
  created_at: string;
  updated_at: string;
}

const attributeIcons: Record<string, React.ElementType> = {
  aggression: Sword,
  determination: Shield,
  seduction: Heart,
  cunning: Brain,
  faith: Flame,
};

const attributeKeys = ['aggression', 'determination', 'seduction', 'cunning', 'faith'] as const;

const typeColors: Record<string, string> = {
  strong: 'bg-green-500/20 text-green-500 border-green-500/30',
  neutral: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  weak: 'bg-red-500/20 text-red-500 border-red-500/30',
};

export default function CharacterSheet() {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useI18n();
  const { toast } = useToast();

  const [character, setCharacter] = useState<Character | null>(null);
  const [minorMarksData, setMinorMarksData] = useState<MinorMarkData[]>([]);
  const [complications, setComplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const isOwner = character && user && character.id && user.id;

  useEffect(() => {
    if (!characterId || !user) return;

    const fetchCharacter = async () => {
      // Fetch character
      const { data: charData, error: charError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();

      if (charError || !charData) {
        toast({
          title: language === 'pt-BR' ? 'Personagem não encontrado' : 'Character not found',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setCharacter(charData);

      // Fetch minor marks details
      if (charData.minor_marks && charData.minor_marks.length > 0) {
        const { data: marksData } = await supabase
          .from('minor_marks')
          .select('*')
          .in('id', charData.minor_marks);

        setMinorMarksData(marksData || []);
      }

      // Fetch complications history
      const { data: compsData } = await supabase
        .from('complications')
        .select('*')
        .eq('character_id', characterId)
        .order('created_at', { ascending: false });

      setComplications(compsData || []);

      setLoading(false);
    };

    fetchCharacter();
  }, [characterId, user, navigate, toast, language]);

  const handleCharacterUpdate = (updated: Character) => {
    setCharacter((prev) => (prev ? { ...prev, ...updated } : prev));
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

  if (!character) return null;

  const getAttributeType = (attr: string): string => {
    const key = `${attr}_type` as keyof Character;
    return (character[key] as string) || 'neutral';
  };

  const majorMarks = (character.major_marks as unknown as MajorMark[]) || [];
  const epicMarks = (character.epic_marks as unknown as MajorMark[]) || [];
  const negativeMarks = (character.negative_marks as unknown as MajorMark[]) || [];
  const extendedNarratives = (character.extended_narratives as unknown as ExtendedNarrative[]) || [];
  const markProgress = (character.mark_progress as unknown as Record<string, number>) || {};

  const permanentMajorMarks = majorMarks.filter((m) => m.is_permanent !== false);
  const temporaryMajorMarks = majorMarks.filter((m) => m.is_temporary === true);

  const activeComplications = complications.filter((c) => !c.is_manifested);
  const manifestedComplications = complications.filter((c) => c.is_manifested);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h1 className="font-medieval text-xl text-foreground">{t.character.sheet}</h1>
            </div>
          </div>

          {isOwner && (
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
              <Pencil className="w-4 h-4 mr-1" />
              {t.common.edit}
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="space-y-6 pb-8">
            {/* Character Header */}
            <Card className="medieval-card">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-medieval text-2xl text-foreground">{character.name}</h2>
                    {character.concept && (
                      <p className="text-muted-foreground font-body mt-1">{character.concept}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="font-medieval">
                          {character.heroic_moves_stored} {t.character.heroicMovesStored}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attributes */}
            <Card className="medieval-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-medieval flex items-center gap-2">
                  <Sword className="w-5 h-5 text-primary" />
                  {t.character.attributes}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {attributeKeys.map((attr) => {
                    const Icon = attributeIcons[attr];
                    const type = getAttributeType(attr);

                    return (
                      <div
                        key={attr}
                        className="flex flex-col items-center p-3 rounded-lg bg-muted/30 border border-border"
                      >
                        <Icon className="w-6 h-6 text-primary mb-2" />
                        <span className="font-medieval text-sm text-center">
                          {t.attributes[attr]}
                        </span>
                        <Badge variant="outline" className={`mt-2 text-xs ${typeColors[type]}`}>
                          {t.attributes[type]}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Minor Marks */}
            <Card className="medieval-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-medieval flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  {t.character.minorMarks}
                  <Badge variant="outline" className="ml-auto">
                    {minorMarksData.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {minorMarksData.length > 0 ? (
                  <div className="space-y-3">
                    {minorMarksData.map((mark) => {
                      const Icon = attributeIcons[mark.attribute] || Star;
                      return (
                        <div
                          key={mark.id}
                          className="p-3 rounded-lg bg-muted/30 border border-border"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-primary" />
                            <span className="font-medieval">{mark.name}</span>
                            <Badge variant="outline" className="text-xs ml-auto">
                              {t.attributes[mark.attribute as keyof typeof t.attributes] || mark.attribute}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-body">
                            {mark.description}
                          </p>
                          <p className="text-sm text-primary font-body mt-1 italic">
                            {mark.effect}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4 font-body">
                    {language === 'pt-BR' ? 'Nenhuma marca menor' : 'No minor marks'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Major Marks */}
            <Card className="medieval-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-medieval flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  {t.character.majorMarks}
                  <Badge variant="outline" className="ml-auto">
                    {permanentMajorMarks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {permanentMajorMarks.length > 0 ? (
                  <div className="space-y-3">
                    {permanentMajorMarks.map((mark, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-primary/5 border border-primary/20"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-4 h-4 text-primary" />
                          <span className="font-medieval">{mark.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground font-body">
                          <strong>{t.marks.scope}:</strong> {mark.scope}
                        </p>
                        <p className="text-sm text-primary font-body mt-1">
                          <strong>{t.marks.effect}:</strong> {mark.effect}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4 font-body">
                    {language === 'pt-BR' ? 'Nenhuma marca maior' : 'No major marks'}
                  </p>
                )}

                {/* Temporary Marks */}
                {temporaryMajorMarks.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <h4 className="font-medieval text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {t.marks.majorTemporary}
                    </h4>
                    <div className="space-y-2">
                      {temporaryMajorMarks.map((mark, index) => (
                        <div
                          key={index}
                          className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                        >
                          <span className="font-medieval text-sm">{mark.name}</span>
                          <p className="text-xs text-muted-foreground">{mark.scope}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Epic Marks */}
            {epicMarks.length > 0 && (
              <Card className="medieval-card border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="font-medieval flex items-center gap-2 text-primary">
                    <Sparkles className="w-5 h-5" />
                    {t.character.epicMarks}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {epicMarks.map((mark, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30"
                      >
                        <span className="font-medieval text-primary">{mark.name}</span>
                        <p className="text-sm text-muted-foreground font-body mt-1">
                          {mark.effect}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Negative Marks */}
            {negativeMarks.length > 0 && (
              <Card className="medieval-card border-red-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="font-medieval flex items-center gap-2 text-red-500">
                    <Skull className="w-5 h-5" />
                    {t.character.negativeMarks}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {negativeMarks.map((mark, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                      >
                        <span className="font-medieval text-red-500">{mark.name}</span>
                        <p className="text-sm text-muted-foreground font-body mt-1">
                          {mark.effect}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mark Progress */}
            {Object.keys(markProgress).length > 0 && (
              <Card className="medieval-card">
                <CardHeader className="pb-3">
                  <CardTitle className="font-medieval flex items-center gap-2">
                    <ScrollText className="w-5 h-5 text-primary" />
                    {t.character.markProgress}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(markProgress).map(([theme, points]) => (
                      <div key={theme} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medieval text-sm">{theme}</span>
                          <span className="text-sm text-muted-foreground">
                            {points}/3
                          </span>
                        </div>
                        <Progress value={(points / 3) * 100} className="h-2" />
                        <div className="flex gap-1">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full ${
                                i <= points
                                  ? 'bg-primary'
                                  : 'bg-muted border border-border'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Extended Narratives */}
            <Card className="medieval-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-medieval flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {t.character.extendedNarratives}
                  <Badge variant="outline" className="ml-auto">
                    {extendedNarratives.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extendedNarratives.length > 0 ? (
                  <div className="space-y-3">
                    {extendedNarratives.map((narrative, index) => {
                      const typeLabels: Record<string, string> = {
                        npc: t.heroicMoves.npcAlly,
                        reputation: t.heroicMoves.reputation,
                        resource: t.heroicMoves.resource,
                        promise: t.heroicMoves.promiseFulfilled,
                      };

                      return (
                        <div
                          key={index}
                          className="p-3 rounded-lg bg-muted/30 border border-border"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {typeLabels[narrative.type] || narrative.type}
                            </Badge>
                          </div>
                          <span className="font-medieval">{narrative.name}</span>
                          <p className="text-sm text-muted-foreground font-body mt-1">
                            {narrative.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4 font-body">
                    {language === 'pt-BR'
                      ? 'Nenhuma narrativa estendida'
                      : 'No extended narratives'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Complications */}
            <Card className="medieval-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-medieval flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  {t.character.complications}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible defaultValue="active">
                  {/* Active Complications */}
                  <AccordionItem value="active" className="border-none">
                    <AccordionTrigger className="font-medieval text-sm py-2 hover:no-underline">
                      {language === 'pt-BR' ? 'Ativas' : 'Active'} ({activeComplications.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      {activeComplications.length > 0 ? (
                        <div className="space-y-2">
                          {activeComplications.map((comp) => (
                            <div
                              key={comp.id}
                              className="p-2 rounded-lg bg-red-500/10 border border-red-500/20"
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs text-red-500 border-red-500/30">
                                  {t.complications[comp.type as keyof typeof t.complications] || comp.type}
                                </Badge>
                                {!comp.is_visible && (
                                  <Badge variant="outline" className="text-xs">
                                    {t.complications.hidden}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm font-body mt-1">{comp.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          {language === 'pt-BR'
                            ? 'Nenhuma complicação ativa'
                            : 'No active complications'}
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Manifested Complications (History) */}
                  <AccordionItem value="history" className="border-none">
                    <AccordionTrigger className="font-medieval text-sm py-2 hover:no-underline">
                      {language === 'pt-BR' ? 'Histórico' : 'History'} ({manifestedComplications.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      {manifestedComplications.length > 0 ? (
                        <div className="space-y-2">
                          {manifestedComplications.map((comp) => (
                            <div
                              key={comp.id}
                              className="p-2 rounded-lg bg-muted/30 border border-border"
                            >
                              <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                <Badge variant="outline" className="text-xs">
                                  {t.complications[comp.type as keyof typeof t.complications] || comp.type}
                                </Badge>
                              </div>
                              <p className="text-sm font-body mt-1">{comp.description}</p>
                              {comp.manifest_note && (
                                <p className="text-xs text-muted-foreground italic mt-1">
                                  {comp.manifest_note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          {language === 'pt-BR'
                            ? 'Nenhuma complicação resolvida'
                            : 'No resolved complications'}
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </main>

      {/* Edit Character Modal */}
      {character && (
        <EditCharacterModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          character={character}
          onSave={handleCharacterUpdate}
        />
      )}
    </div>
  );
}
