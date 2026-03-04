import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Sword,
  Shield,
  Heart,
  Brain,
  Flame,
  Sparkles,
  AlertCircle,
  Scroll,
  Crown,
  Star,
  AlertTriangle,
  Eye,
  ScrollText,
  Users,
} from 'lucide-react';
import { ComplicationsPlayerPanel } from '@/components/complications/ComplicationsPlayerPanel';
import { MarksModal } from '@/components/character/MarksModal';
import type { SessionData, Participant } from '@/pages/Session';

interface PlayerSidebarProps {
  session: SessionData;
  participants: Participant[];
  userId: string;
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

export function PlayerSidebar({ session, participants, userId }: PlayerSidebarProps) {
  const { t } = useI18n();
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [minorMarksData, setMinorMarksData] = useState<MinorMarkData[]>([]);

  const myParticipant = participants.find((p) => p.user_id === userId);
  const character = myParticipant?.character;

  // Fetch minor marks details
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

  if (!character) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="font-body">{t.narrator?.noCharacterSelected || 'Personagem não encontrado'}</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-4">
      {/* Character Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medieval text-lg truncate">{character.name}</h3>
          {character.concept && (
            <p className="text-sm text-muted-foreground font-body truncate">
              {character.concept}
            </p>
          )}
        </div>
      </div>

      {/* Attributes */}
      <Card className="medieval-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-base">
            {t.character.attributes}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {attributeKeys.map((attr) => {
              const Icon = attributeIcons[attr];
              const type = getAttributeType(attr);
              
              return (
                <div
                  key={attr}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="font-medieval text-sm">
                      {t.attributes[attr]}
                    </span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${typeColors[type]}`}>
                    {t.attributes[type]}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Heroic Moves */}
      <Card className="medieval-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {t.character.heroicMoves}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 py-4">
            <span className="text-4xl font-medieval text-primary">
              {character.heroic_moves_stored}
            </span>
            <span className="text-sm text-muted-foreground font-body">
              {t.character.heroicMovesStored}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Minor Marks Details */}
      {minorMarksData.length > 0 && (
        <Card className="medieval-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-medieval text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              {t.character.minorMarks}
              <Badge variant="outline" className="ml-auto text-xs">
                {minorMarksData.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {minorMarksData.map((mark) => {
              const Icon = attributeIcons[mark.attribute] || Star;
              return (
                <div key={mark.id} className="p-2 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-3 h-3 text-primary" />
                    <span className="font-medieval text-sm">{mark.name}</span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {t.attributes[mark.attribute as keyof typeof t.attributes] || mark.attribute}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">{mark.description}</p>
                  <p className="text-xs text-primary font-body mt-1 italic">{mark.effect}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Marks Summary Card */}
      <Card className="medieval-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            <Scroll className="w-4 h-4 text-primary" />
            {t.marks?.tabMarks || 'Marcas'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Scroll className="w-3 h-3 text-primary" />
                <p className="text-xs text-muted-foreground font-body">
                  {t.character.minorMarks}
                </p>
              </div>
              <p className="font-medieval text-lg text-primary">
                {minorMarkIds.length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Crown className="w-3 h-3 text-amber-500" />
                <p className="text-xs text-muted-foreground font-body">
                  {t.character.majorMarks}
                </p>
              </div>
              <p className="font-medieval text-lg text-amber-500">
                {majorMarks.length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-3 h-3 text-yellow-400" />
                <p className="text-xs text-muted-foreground font-body">
                  {t.character.epicMarks}
                </p>
              </div>
              <p className="font-medieval text-lg text-yellow-400">
                {epicMarks.length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <p className="text-xs text-muted-foreground font-body">
                  {t.character.negativeMarks}
                </p>
              </div>
              <p className="font-medieval text-lg text-red-500">
                {negativeMarks.length}
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowMarksModal(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {t.character.viewDetails || 'Ver Todas as Marcas'}
          </Button>
        </CardContent>
      </Card>

      {/* Mark Progress */}
      {Object.keys(markProgress).length > 0 && (
        <Card className="medieval-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-medieval text-base flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-primary" />
              {t.character.markProgress}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(markProgress).map(([theme, points]) => (
                <div key={theme} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medieval text-sm">{theme}</span>
                    <span className="text-xs text-muted-foreground">{points}/3</span>
                  </div>
                  <Progress value={(points / 3) * 100} className="h-2" />
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full ${
                          i <= points ? 'bg-primary' : 'bg-muted border border-border'
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
      {extendedNarratives.length > 0 && (
        <Card className="medieval-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-medieval text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              {t.character.extendedNarratives}
              <Badge variant="outline" className="ml-auto text-xs">
                {extendedNarratives.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    {narrative.description}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Complications Panel */}
      <ComplicationsPlayerPanel 
        sessionId={session.id}
        characterId={character.id}
      />

      {/* Marks Modal */}
      <MarksModal
        open={showMarksModal}
        onOpenChange={setShowMarksModal}
        minorMarkIds={minorMarkIds}
        majorMarks={majorMarks}
        epicMarks={epicMarks}
        negativeMarks={negativeMarks}
      />
    </div>
  );
}
