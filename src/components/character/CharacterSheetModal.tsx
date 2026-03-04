import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  User,
  Sword,
  Shield,
  Heart,
  Brain,
  Flame,
  Eye,
  Sparkles,
  Scroll,
  Crown,
  Star,
  AlertTriangle,
  ScrollText,
  Users,
} from 'lucide-react';
import type { Participant } from '@/pages/Session';

interface CharacterSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant: Participant | null;
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

const attributeColors: Record<string, string> = {
  aggression: 'text-red-500 bg-red-500/10 border-red-500/30',
  determination: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  seduction: 'text-pink-500 bg-pink-500/10 border-pink-500/30',
  cunning: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  faith: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
};

interface MinorMarkData {
  id: string;
  name: string;
  attribute: string;
  description: string;
  effect: string;
}

interface MajorMark {
  id: string;
  name: string;
  attribute: string;
  description?: string;
  effect?: string;
  isTemporary?: boolean;
}

interface ExtendedNarrative {
  type: 'npc' | 'reputation' | 'resource' | 'promise';
  name: string;
  description: string;
}

export function CharacterSheetModal({ open, onOpenChange, participant }: CharacterSheetModalProps) {
  const { t } = useI18n();
  const [minorMarksData, setMinorMarksData] = useState<MinorMarkData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAttribute, setFilterAttribute] = useState<string | null>(null);

  const character = participant?.character;

  useEffect(() => {
    if (!open || !character?.minor_marks || character.minor_marks.length === 0) {
      setMinorMarksData([]);
      return;
    }

    const fetchMinorMarks = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('minor_marks')
        .select('*')
        .in('id', character.minor_marks!);
      if (data) setMinorMarksData(data);
      setLoading(false);
    };
    fetchMinorMarks();
  }, [open, character?.minor_marks]);

  if (!character) return null;

  const getAttributeType = (attr: string): string => {
    const key = `${attr}_type` as keyof typeof character;
    return (character[key] as string) || 'neutral';
  };

  const minorMarkIds = character.minor_marks || [];
  const majorMarks = (character.major_marks as MajorMark[]) || [];
  const epicMarks = ((character as any).epic_marks as MajorMark[]) || [];
  const negativeMarks = ((character as any).negative_marks as MajorMark[]) || [];
  const markProgress = (character.mark_progress as Record<string, number>) || {};
  const extendedNarratives = (character.extended_narratives as ExtendedNarrative[]) || [];

  const filteredMinorMarks = filterAttribute
    ? minorMarksData.filter((m) => m.attribute === filterAttribute)
    : minorMarksData;
  const filteredMajorMarks = filterAttribute
    ? majorMarks.filter((m) => m.attribute === filterAttribute)
    : majorMarks;
  const filteredEpicMarks = filterAttribute
    ? epicMarks.filter((m) => m.attribute === filterAttribute)
    : epicMarks;
  const filteredNegativeMarks = filterAttribute
    ? negativeMarks.filter((m) => m.attribute === filterAttribute)
    : negativeMarks;

  const renderMarkCard = (mark: MinorMarkData | MajorMark, type: 'minor' | 'major' | 'epic' | 'negative') => {
    const Icon = attributeIcons[mark.attribute] || Scroll;
    const colorClass = attributeColors[mark.attribute] || '';
    const typeIcon = { minor: Scroll, major: Crown, epic: Star, negative: AlertTriangle }[type];
    const TypeIcon = typeIcon;
    const typeBorderClass = {
      minor: 'border-primary/30',
      major: 'border-amber-500/50',
      epic: 'border-yellow-400/50',
      negative: 'border-red-500/50',
    }[type];

    return (
      <div key={mark.id} className={cn('p-3 rounded-lg border-2 bg-card/50', typeBorderClass)}>
        <div className="flex items-start gap-3">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <TypeIcon className={cn(
                'w-3 h-3',
                type === 'minor' && 'text-primary',
                type === 'major' && 'text-amber-500',
                type === 'epic' && 'text-yellow-400',
                type === 'negative' && 'text-red-500'
              )} />
              <h4 className="font-medieval text-sm truncate">{mark.name}</h4>
              {'isTemporary' in mark && mark.isTemporary && (
                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
                  Temp
                </Badge>
              )}
            </div>
            {'description' in mark && mark.description && (
              <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{mark.description}</p>
            )}
            {'effect' in mark && mark.effect && (
              <p className="text-xs text-primary">
                <strong>{t.marks.effect}:</strong> {mark.effect}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-medieval flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {character.name}
          </DialogTitle>
          {character.concept && (
            <p className="text-sm text-muted-foreground font-body">{character.concept}</p>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Attributes */}
            <div className="space-y-2">
              <h4 className="font-medieval text-sm text-muted-foreground uppercase tracking-wider">
                {t.character.attributes}
              </h4>
              <div className="grid gap-1.5">
                {attributeKeys.map((attr) => {
                  const Icon = attributeIcons[attr];
                  const type = getAttributeType(attr);
                  return (
                    <div key={attr} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="font-medieval text-sm">{t.attributes[attr]}</span>
                      </div>
                      <Badge variant="outline" className={`text-xs ${typeColors[type]}`}>
                        {t.attributes[type]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Heroic Moves */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medieval text-sm">{t.character.heroicMoves}</span>
              </div>
              <span className="font-medieval text-2xl text-primary">{character.heroic_moves_stored}</span>
            </div>

            {/* Mark Progress */}
            {Object.keys(markProgress).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medieval text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <ScrollText className="w-4 h-4" />
                  {t.character.markProgress}
                </h4>
                {Object.entries(markProgress).map(([theme, points]) => (
                  <div key={theme} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <span className="font-medieval text-sm">{theme}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full ${
                            i <= points ? 'bg-primary' : 'bg-muted border border-border'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Extended Narratives */}
            {extendedNarratives.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medieval text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {t.character.extendedNarratives} ({extendedNarratives.length})
                </h4>
                {extendedNarratives.map((narrative, index) => {
                  const typeLabels: Record<string, string> = {
                    npc: t.heroicMoves.npcAlly,
                    reputation: t.heroicMoves.reputation,
                    resource: t.heroicMoves.resource,
                    promise: t.heroicMoves.promiseFulfilled,
                  };
                  return (
                    <div key={index} className="p-2 rounded-lg bg-muted/30 border border-border">
                      <Badge variant="outline" className="text-xs mb-1">
                        {typeLabels[narrative.type] || narrative.type}
                      </Badge>
                      <p className="font-medieval text-sm">{narrative.name}</p>
                      <p className="text-xs text-muted-foreground font-body mt-0.5">{narrative.description}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Marks Tabs */}
            <div className="space-y-2">
              <h4 className="font-medieval text-sm text-muted-foreground uppercase tracking-wider">
                {t.marks?.tabMarks || 'Marcas'}
              </h4>

              {/* Attribute Filter */}
              <div className="flex gap-1 flex-wrap pb-2 border-b border-border">
                <Button
                  variant={filterAttribute === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterAttribute(null)}
                  className="h-7 px-2 text-xs"
                >
                  {t.common.all}
                </Button>
                {Object.keys(attributeIcons).map((attr) => {
                  const Icon = attributeIcons[attr];
                  return (
                    <Button
                      key={attr}
                      variant={filterAttribute === attr ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterAttribute(filterAttribute === attr ? null : attr)}
                      className="h-7 w-7 p-0"
                      title={t.attributes[attr as keyof typeof t.attributes]}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </Button>
                  );
                })}
              </div>

              <Tabs defaultValue="minor">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="minor" className="text-xs gap-1">
                    <Scroll className="w-3 h-3" />
                    <Badge variant="secondary" className="h-5 px-1.5">{filteredMinorMarks.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="major" className="text-xs gap-1">
                    <Crown className="w-3 h-3" />
                    <Badge variant="secondary" className="h-5 px-1.5">{filteredMajorMarks.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="epic" className="text-xs gap-1">
                    <Star className="w-3 h-3" />
                    <Badge variant="secondary" className="h-5 px-1.5">{filteredEpicMarks.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="negative" className="text-xs gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <Badge variant="secondary" className="h-5 px-1.5">{filteredNegativeMarks.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="minor" className="mt-2 space-y-2">
                  {loading ? (
                    <p className="text-center text-muted-foreground py-4">{t.common.loading}</p>
                  ) : filteredMinorMarks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">{t.characterSheet.noMarksEmpty.minor}</p>
                  ) : (
                    filteredMinorMarks.map((mark) => renderMarkCard(mark, 'minor'))
                  )}
                </TabsContent>
                <TabsContent value="major" className="mt-2 space-y-2">
                  {filteredMajorMarks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">{t.characterSheet.noMarksEmpty.major}</p>
                  ) : (
                    filteredMajorMarks.map((mark) => renderMarkCard(mark, 'major'))
                  )}
                </TabsContent>
                <TabsContent value="epic" className="mt-2 space-y-2">
                  {filteredEpicMarks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">{t.characterSheet.noMarksEmpty.epic}</p>
                  ) : (
                    filteredEpicMarks.map((mark) => renderMarkCard(mark, 'epic'))
                  )}
                </TabsContent>
                <TabsContent value="negative" className="mt-2 space-y-2">
                  {filteredNegativeMarks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">{t.characterSheet.noMarksEmpty.negative}</p>
                  ) : (
                    filteredNegativeMarks.map((mark) => renderMarkCard(mark, 'negative'))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
