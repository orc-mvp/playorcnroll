/**
 * MagoPlayerSidePanel — painel lateral do jogador na sala Storyteller para Mago.
 * Mostra info do personagem, Esferas e membros da Cabala.
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
import { Star, Sparkles, Users, User, FileText } from 'lucide-react';
import MagoCharacterSheet from '@/components/character/mago/MagoCharacterSheet';
import { MAGO_SPHERES, type MagoCharacterData } from '@/lib/mago/spheres';
import type { StorytellerParticipant } from '@/lib/storyteller/types';

interface Props {
  character: StorytellerParticipant['character'];
  experiencePoints?: number;
  sessionTrackers?: Record<string, unknown>;
  sheetLocked?: boolean;
  participants?: StorytellerParticipant[];
  currentUserId?: string;
}

export function MagoPlayerSidePanel({
  character,
  experiencePoints,
  sessionTrackers,
  sheetLocked = true,
  participants = [],
  currentUserId,
}: Props) {
  const { t, language } = useI18n();
  const data = character?.vampiro_data as MagoCharacterData | null;
  const [showSheet, setShowSheet] = useState(false);

  if (!character) {
    return (
      <Card className="medieval-card border-purple-500/20">
        <CardContent className="py-8 text-center">
          <Star className="w-12 h-12 mx-auto mb-3 text-purple-500/30" />
          <p className="text-muted-foreground font-body">{t.vampireSession.noCharacterSelected}</p>
        </CardContent>
      </Card>
    );
  }

  const cabalMembers = participants.filter(
    (p) => p.character_id && p.user_id !== currentUserId,
  );

  return (
    <>
      <div className="space-y-4">
        <Card className="medieval-card border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/30">
                <Star className="w-6 h-6 text-purple-500" />
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
                {data?.tradition && (
                  <Badge variant="outline" className="border-purple-500/30 text-purple-500 text-xs">
                    {data.tradition}
                  </Badge>
                )}
                {data?.essence && (
                  <Badge
                    variant="outline"
                    className="border-purple-500/20 text-muted-foreground text-xs ml-1"
                  >
                    {(t.mago as any)[`essence_${data.essence}`] || data.essence}
                  </Badge>
                )}
              </div>
            </div>
            {character.concept && (
              <p className="text-sm text-muted-foreground mt-2 font-body">{character.concept}</p>
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

        {/* Esferas */}
        {data?.spheres && Object.values(data.spheres).some((v) => v > 0) && (
          <Card className="medieval-card border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-medieval text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                {t.mago.spheres}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {MAGO_SPHERES.map((sphere) => {
                  const value = (data.spheres as Record<string, number>)[sphere.key] || 0;
                  if (value === 0) return null;
                  return (
                    <div key={sphere.key} className="flex items-center justify-between text-sm">
                      <span className="font-body capitalize">
                        {language === 'pt-BR' ? sphere.labelPt : sphere.labelEn}
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < value ? 'bg-purple-500' : 'bg-muted-foreground/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cabala */}
        {cabalMembers.length > 0 && (
          <Card className="medieval-card border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-medieval text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                {data?.cabal || (language === 'pt-BR' ? 'Cabala' : 'Cabal')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cabalMembers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <User className="w-4 h-4 text-purple-500/70" />
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col w-[95vw]">
          <DialogHeader>
            <DialogTitle className="font-medieval flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-500" />
              {language === 'pt-BR' ? 'Minha Ficha' : 'My Sheet'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {character && character.vampiro_data && (
              <MagoCharacterSheet
                character={{
                  id: character.id,
                  name: character.name,
                  concept: character.concept,
                  vampiro_data: character.vampiro_data,
                }}
                sessionTrackers={sessionTrackers as any}
                experiencePoints={experiencePoints}
                readOnly={sheetLocked}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
