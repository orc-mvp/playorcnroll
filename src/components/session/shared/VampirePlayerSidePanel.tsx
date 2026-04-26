/**
 * VampirePlayerSidePanel — extraído de VampireSession.tsx (era VampirePlayerPanel inline).
 * Mostra info do personagem Vampiro: header, disciplinas, XP e coterie.
 */

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Moon, Sparkles, Users, User, FileText } from 'lucide-react';
import VampiroCharacterSheet from '@/components/character/vampiro/VampiroCharacterSheet';
import { getDisciplineLabel } from '@/lib/vampiro/disciplineLabels';
import type { StorytellerParticipant } from '@/lib/storyteller/types';

interface Props {
  character: StorytellerParticipant['character'];
  experiencePoints?: number;
  sessionTrackers?: Record<string, unknown>;
  sheetLocked?: boolean;
  participants?: StorytellerParticipant[];
  currentUserId?: string;
}

export function VampirePlayerSidePanel({
  character,
  experiencePoints,
  sessionTrackers,
  sheetLocked = true,
  participants = [],
  currentUserId,
}: Props) {
  const { t, language } = useI18n();
  const vampiroData = character?.vampiro_data;
  const [showSheet, setShowSheet] = useState(false);

  if (!character) {
    return (
      <Card className="medieval-card border-destructive/20">
        <CardContent className="py-8 text-center">
          <Moon className="w-12 h-12 mx-auto mb-3 text-destructive/30" />
          <p className="text-muted-foreground font-body">
            {t.vampireSession.noCharacterSelected}
          </p>
        </CardContent>
      </Card>
    );
  }

  const coterieMembers = participants.filter(
    (p) => p.character_id && p.user_id !== currentUserId,
  );

  return (
    <>
      <div className="space-y-4">
        <Card className="medieval-card border-destructive/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/30">
                <Moon className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medieval text-lg">{character.name}</h3>
                  {(experiencePoints ?? 0) > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 font-mono">
                      {experiencePoints} XP
                    </Badge>
                  )}
                </div>
                {vampiroData?.clan && (
                  <Badge variant="outline" className="border-destructive/30 text-destructive text-xs">
                    {vampiroData.clan}
                  </Badge>
                )}
              </div>
            </div>
            {character.concept && (
              <p className="text-sm text-muted-foreground mt-2 font-body">
                {character.concept}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSheet(true)}
              className="w-full mt-3"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t.vampireSession.viewFullSheet}
            </Button>
          </CardContent>
        </Card>

        {vampiroData?.disciplines &&
          Object.keys(vampiroData.disciplines).length > 0 && (
            <Card className="medieval-card border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="font-medieval text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-destructive" />
                  {t.vampiro.disciplines}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(vampiroData.disciplines as Record<string, number>).map(
                    ([key, value]) =>
                      value > 0 ? (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="font-body capitalize">
                            {getDisciplineLabel(key, language, t)}
                          </span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < value ? 'bg-destructive' : 'bg-muted-foreground/20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null,
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        {coterieMembers.length > 0 && (
          <Card className="medieval-card border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-medieval text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-destructive" />
                {t.vampireSession.coterie}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {coterieMembers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                      <User className="w-4 h-4 text-destructive/70" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medieval text-sm truncate">
                        {p.character?.name || p.profile?.display_name || t.vampireSession.noCharacter}
                      </p>
                      {p.character?.name && p.profile?.display_name && (
                        <p className="text-xs text-muted-foreground font-body truncate">
                          {p.profile.display_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showSheet} onOpenChange={setShowSheet}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-medieval flex items-center gap-2">
              <Moon className="w-5 h-5 text-destructive" />
              Minha Ficha
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {character && character.vampiro_data && (
              <VampiroCharacterSheet
                character={{
                  id: character.id,
                  name: character.name,
                  concept: character.concept,
                  vampiro_data: character.vampiro_data,
                }}
                sessionTrackers={sessionTrackers as any}
                experiencePoints={experiencePoints}
                participantId={participants.find((p) => p.user_id === currentUserId)?.id}
                readOnly={sheetLocked}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
