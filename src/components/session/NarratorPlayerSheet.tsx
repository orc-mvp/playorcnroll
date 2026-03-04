import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  User,
  Sword,
  Shield,
  Heart,
  Brain,
  Flame,
  Sparkles,
  Scroll,
  Crown,
  Star,
  AlertTriangle,
  Eye,
  ScrollText,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { MarksModal } from '@/components/character/MarksModal';
import type { Participant } from '@/pages/Session';

interface NarratorPlayerSheetProps {
  participant: Participant;
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

interface MinorMarkData {
  id: string;
  name: string;
  attribute: string;
  description: string;
  effect: string;
}

interface ExtendedNarrative {
  type: 'npc' | 'reputation' | 'resource' | 'promise';
  name: string;
  description: string;
}

export function NarratorPlayerSheet({ participant }: NarratorPlayerSheetProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [minorMarksData, setMinorMarksData] = useState<MinorMarkData[]>([]);

  const character = participant.character;

  useEffect(() => {
    if (!character?.minor_marks || character.minor_marks.length === 0) return;

    const fetchMinorMarks = async () => {
      const { data } = await supabase
        .from('minor_marks')
        .select('*')
        .in('id', character.minor_marks!);
      if (data) setMinorMarksData(data);
    };
    fetchMinorMarks();
  }, [character?.minor_marks]);

  if (!character) return null;

  const getAttributeType = (attr: string): string => {
    const key = `${attr}_type` as keyof typeof character;
    return (character[key] as string) || 'neutral';
  };

  const minorMarkIds = character.minor_marks || [];
  const majorMarks = (character.major_marks as any[]) || [];
  const epicMarks = ((character as any).epic_marks as any[]) || [];
  const negativeMarks = ((character as any).negative_marks as any[]) || [];
  const markProgress = (character.mark_progress as Record<string, number>) || {};
  const extendedNarratives = (character.extended_narratives as ExtendedNarrative[]) || [];

  const totalMarks = minorMarkIds.length + majorMarks.length + epicMarks.length;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors text-left"
          >
            <User className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medieval text-sm truncate">{character.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {participant.profile?.display_name || t.session.playerLabel}
              </p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              <Scroll className="w-3 h-3 mr-1" />
              {totalMarks}
            </Badge>
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2 space-y-3 pl-2 border-l-2 border-primary/20">
          {/* Character Header */}
          {character.concept && (
            <p className="text-xs text-muted-foreground font-body italic">
              {character.concept}
            </p>
          )}

          {/* Attributes */}
          <div className="space-y-1.5">
            <p className="font-medieval text-xs text-muted-foreground uppercase tracking-wider">
              {t.character.attributes}
            </p>
            {attributeKeys.map((attr) => {
              const Icon = attributeIcons[attr];
              const type = getAttributeType(attr);
              return (
                <div
                  key={attr}
                  className="flex items-center justify-between p-1.5 rounded bg-muted/30"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3 h-3 text-primary" />
                    <span className="font-medieval text-xs">{t.attributes[attr]}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${typeColors[type]}`}>
                    {t.attributes[type]}
                  </Badge>
                </div>
              );
            })}
          </div>

          {/* Heroic Moves */}
          <div className="flex items-center justify-between p-2 rounded bg-muted/30">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="font-medieval text-xs">{t.character.heroicMoves}</span>
            </div>
            <span className="font-medieval text-lg text-primary">{character.heroic_moves_stored}</span>
          </div>

          {/* Minor Marks */}
          {minorMarksData.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-medieval text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Star className="w-3 h-3" />
                {t.character.minorMarks} ({minorMarksData.length})
              </p>
              {minorMarksData.map((mark) => {
                const Icon = attributeIcons[mark.attribute] || Star;
                return (
                  <div key={mark.id} className="p-1.5 rounded bg-muted/30 border border-border">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon className="w-3 h-3 text-primary" />
                      <span className="font-medieval text-xs">{mark.name}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1 ml-auto">
                        {t.attributes[mark.attribute as keyof typeof t.attributes] || mark.attribute}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-body">{mark.description}</p>
                    <p className="text-[10px] text-primary font-body italic">{mark.effect}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Marks Summary */}
          <div className="grid grid-cols-4 gap-1 text-center">
            <div className="p-1.5 rounded bg-muted/30">
              <Scroll className="w-3 h-3 text-primary mx-auto mb-0.5" />
              <p className="font-medieval text-sm text-primary">{minorMarkIds.length}</p>
              <p className="text-[9px] text-muted-foreground">{t.character.minorMarks}</p>
            </div>
            <div className="p-1.5 rounded bg-muted/30">
              <Crown className="w-3 h-3 text-amber-500 mx-auto mb-0.5" />
              <p className="font-medieval text-sm text-amber-500">{majorMarks.length}</p>
              <p className="text-[9px] text-muted-foreground">{t.character.majorMarks}</p>
            </div>
            <div className="p-1.5 rounded bg-muted/30">
              <Star className="w-3 h-3 text-yellow-400 mx-auto mb-0.5" />
              <p className="font-medieval text-sm text-yellow-400">{epicMarks.length}</p>
              <p className="text-[9px] text-muted-foreground">{t.character.epicMarks}</p>
            </div>
            <div className="p-1.5 rounded bg-muted/30">
              <AlertTriangle className="w-3 h-3 text-red-500 mx-auto mb-0.5" />
              <p className="font-medieval text-sm text-red-500">{negativeMarks.length}</p>
              <p className="text-[9px] text-muted-foreground">{t.character.negativeMarks}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-7"
            onClick={() => setShowMarksModal(true)}
          >
            <Eye className="w-3 h-3 mr-1" />
            {t.character.viewDetails || 'Ver Todas as Marcas'}
          </Button>

          {/* Mark Progress */}
          {Object.keys(markProgress).length > 0 && (
            <div className="space-y-1.5">
              <p className="font-medieval text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <ScrollText className="w-3 h-3" />
                {t.character.markProgress}
              </p>
              {Object.entries(markProgress).map(([theme, points]) => (
                <div key={theme} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medieval text-xs">{theme}</span>
                    <span className="text-[10px] text-muted-foreground">{points}/3</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
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
            <div className="space-y-1.5">
              <p className="font-medieval text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3" />
                {t.character.extendedNarratives} ({extendedNarratives.length})
              </p>
              {extendedNarratives.map((narrative, index) => {
                const typeLabels: Record<string, string> = {
                  npc: t.heroicMoves.npcAlly,
                  reputation: t.heroicMoves.reputation,
                  resource: t.heroicMoves.resource,
                  promise: t.heroicMoves.promiseFulfilled,
                };
                return (
                  <div key={index} className="p-1.5 rounded bg-muted/30 border border-border">
                    <Badge variant="outline" className="text-[10px] py-0 px-1 mb-0.5">
                      {typeLabels[narrative.type] || narrative.type}
                    </Badge>
                    <p className="font-medieval text-xs">{narrative.name}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{narrative.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Marks Modal */}
      <MarksModal
        open={showMarksModal}
        onOpenChange={setShowMarksModal}
        minorMarkIds={minorMarkIds}
        majorMarks={majorMarks}
        epicMarks={epicMarks}
        negativeMarks={negativeMarks}
      />
    </>
  );
}
