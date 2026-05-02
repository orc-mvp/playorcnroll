/**
 * LobisomemPlayerSidePanel — extraído de WerewolfSession.tsx (era WerewolfPlayerPanel inline).
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
import { Dog, Sparkles, Users, User, FileText, Crown } from 'lucide-react';
import LobisomemCharacterSheet from '@/components/character/lobisomem/LobisomemCharacterSheet';
import type { LobisomemCharacterData } from '@/lib/lobisomem/diceUtils';
import { isShifterData, getShifterAuspiceLabel } from '@/lib/lobisomem/auspiceLabels';
import type { StorytellerParticipant } from '@/lib/storyteller/types';

interface Props {
  character: StorytellerParticipant['character'];
  experiencePoints?: number;
  sessionTrackers?: Record<string, unknown>;
  sheetLocked?: boolean;
  participants?: StorytellerParticipant[];
  currentUserId?: string;
}

export function LobisomemPlayerSidePanel({
  character,
  experiencePoints,
  sessionTrackers,
  sheetLocked = true,
  participants = [],
  currentUserId,
}: Props) {
  const { t, language } = useI18n();
  const lobData = character?.vampiro_data as LobisomemCharacterData | null;
  const [showSheet, setShowSheet] = useState(false);

  if (!character) {
    return (
      <Card className="medieval-card border-emerald-500/20">
        <CardContent className="py-8 text-center">
          <Dog className="w-12 h-12 mx-auto mb-3 text-emerald-500/30" />
          <p className="text-muted-foreground font-body">
            {t.vampireSession.noCharacterSelected}
          </p>
        </CardContent>
      </Card>
    );
  }

  const packMembers = participants.filter(
    (p) => p.character_id && p.user_id !== currentUserId,
  );
  const isBSD = lobData?.tribe === 'Black Spiral Dancers';

  return (
    <>
      <div className="space-y-4">
        <Card className="medieval-card border-emerald-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                <Dog className="w-6 h-6 text-emerald-500" />
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
                {lobData?.tribe && (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-xs">
                    {lobData.tribe}
                  </Badge>
                )}
                {lobData?.auspice && (
                  <Badge variant="outline" className="border-emerald-500/20 text-muted-foreground text-xs ml-1">
                    {lobData.auspice}
                  </Badge>
                )}
              </div>
            </div>
            {character.concept && (
              <p className="text-sm text-muted-foreground mt-2 font-body">{character.concept}</p>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowSheet(true)} className="w-full mt-3">
              <FileText className="w-4 h-4 mr-2" />
              {t.vampireSession.viewFullSheet}
            </Button>
          </CardContent>
        </Card>

        {lobData?.gifts &&
          Object.values(lobData.gifts).some((g) => (g as string[])?.length > 0) && (
            <Card className="medieval-card border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="font-medieval text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  {t.lobisomem.gifts}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {[1, 2, 3, 4, 5].map((level) => {
                    const gifts = (lobData.gifts as Record<number, string[]>)?.[level] || [];
                    if (gifts.length === 0) return null;
                    return gifts.map((gift, i) => (
                      <div
                        key={`${level}-${i}`}
                        className="text-sm font-body pl-2 border-l-2 border-emerald-500/30 py-0.5"
                      >
                        <span className="text-xs text-muted-foreground mr-1">{level}.</span>
                        {gift}
                      </div>
                    ));
                  })}
                </div>
              </CardContent>
            </Card>
          )}

        {lobData?.renown &&
          (lobData.renown.glory > 0 || lobData.renown.honor > 0 || lobData.renown.wisdom > 0) && (
            <Card className="medieval-card border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="font-medieval text-sm flex items-center gap-2">
                  <Crown className="w-4 h-4 text-emerald-500" />
                  {t.lobisomem?.renown || 'Renome'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {[
                    {
                      key: 'glory',
                      label: isBSD
                        ? t.lobisomem?.bsd_glory || 'Astúcia'
                        : t.lobisomem?.glory || 'Glória',
                      value: lobData.renown.glory,
                    },
                    {
                      key: 'honor',
                      label: isBSD
                        ? t.lobisomem?.bsd_honor || 'Poder'
                        : t.lobisomem?.honor || 'Honra',
                      value: lobData.renown.honor,
                    },
                    {
                      key: 'wisdom',
                      label: isBSD
                        ? t.lobisomem?.bsd_wisdom || 'Infâmia'
                        : t.lobisomem?.wisdom || 'Sabedoria',
                      value: lobData.renown.wisdom,
                    },
                  ].map(({ key, label, value }) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="font-body">{label}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < value ? 'bg-emerald-500' : 'bg-muted-foreground/20'
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

        {packMembers.length > 0 && (
          <Card className="medieval-card border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-medieval text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                {language === 'pt-BR' ? 'Matilha' : 'Pack'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {packMembers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <User className="w-4 h-4 text-emerald-500/70" />
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
              <Dog className="w-5 h-5 text-emerald-500" />
              Minha Ficha
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {character && character.vampiro_data && (
              <LobisomemCharacterSheet
                character={{
                  id: character.id,
                  name: character.name,
                  concept: character.concept,
                  vampiro_data: character.vampiro_data,
                  experience_points: experiencePoints,
                }}
                sessionTrackers={sessionTrackers as any}
                readOnly={sheetLocked}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
