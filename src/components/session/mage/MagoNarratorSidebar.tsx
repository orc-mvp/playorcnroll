import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import MagoCharacterSheet from '@/components/character/mago/MagoCharacterSheet';
import { TrackerChangeConfirmModal, TrackerType } from '../vampire/TrackerChangeConfirmModal';
import { NarratorTrackerAdjustModal } from '../vampire/NarratorTrackerAdjustModal';
import {
  Users,
  Sparkles,
  Heart,
  AlertTriangle,
  Skull,
  FileText,
  Star,
  Zap,
} from 'lucide-react';
import type { MagoCharacterData } from '@/lib/mago/spheres';

interface Participant {
  id: string;
  user_id: string;
  character_id: string | null;
  session_quintessence?: number;
  session_paradox?: number;
  session_arete?: number;
  session_willpower_current?: number;
  session_health_damage?: boolean[];
  experience_points?: number;
  sheet_locked?: boolean;
  character?: {
    id: string;
    name: string;
    concept: string | null;
    game_system: string;
    vampiro_data: MagoCharacterData | null;
  } | null;
  profile?: {
    display_name: string | null;
  } | null;
}

interface Scene {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  session_id: string;
}

interface PendingChange {
  type: TrackerType;
  currentValue: number;
  newValue: number;
  participantId: string;
  characterId?: string;
  characterName: string;
  actualTrackerType?: string;
}

interface MagoNarratorSidebarProps {
  sessionId: string;
  participants: Participant[];
  scenes: Scene[];
  currentScene: Scene | null;
  onRequestTest: () => void;
  onRequestRoll: () => void;
  onSceneChange: (scene: Scene) => void;
  onEventCreated?: (event: { event_type: string; event_data: Record<string, unknown>; scene_id: string | null; session_id: string }) => void;
}

export function MagoNarratorSidebar({
  sessionId,
  participants,
  currentScene,
  onEventCreated,
}: MagoNarratorSidebarProps) {
  const { t, language } = useI18n();
  const { toast } = useToast();

  const [selectedCharacter, setSelectedCharacter] = useState<Participant['character'] | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [adjustModal, setAdjustModal] = useState<{
    type: TrackerType;
    participantId: string;
    characterId?: string;
    characterName: string;
    currentValue: number;
    maxValue?: number;
    actualTrackerType?: string;
  } | null>(null);

  const openAdjustModal = (
    type: TrackerType,
    currentValue: number,
    participantId: string,
    characterName: string,
    characterId?: string,
    maxValue?: number,
    actualTrackerType?: string,
  ) => {
    setAdjustModal({ type, participantId, characterId, characterName, currentValue, maxValue, actualTrackerType });
  };

  const handleAdjustConfirm = (newValue: number) => {
    if (!adjustModal) return;
    setPendingChange({
      type: adjustModal.type,
      currentValue: adjustModal.currentValue,
      newValue,
      participantId: adjustModal.participantId,
      characterId: adjustModal.characterId,
      characterName: adjustModal.characterName,
      actualTrackerType: adjustModal.actualTrackerType,
    });
    setAdjustModal(null);
    setIsConfirmOpen(true);
  };

  const confirmChange = async () => {
    if (!pendingChange) return;

    try {
      const updateData: Record<string, number | boolean[]> = {};
      const actualType = pendingChange.actualTrackerType || pendingChange.type;

      switch (actualType) {
        case 'quintessence':
          updateData.session_quintessence = pendingChange.newValue;
          break;
        case 'paradox':
          updateData.session_paradox = pendingChange.newValue;
          break;
        case 'willpower':
          updateData.session_willpower_current = pendingChange.newValue;
          break;
        case 'health': {
          const newHealth = Array(7).fill(false);
          for (let i = 0; i < pendingChange.newValue; i++) newHealth[i] = true;
          updateData.session_health_damage = newHealth;
          break;
        }
      }

      await supabase.from('session_participants').update(updateData).eq('id', pendingChange.participantId);

      const eventData = {
        tracker_type: actualType,
        character_name: pendingChange.characterName,
        character_id: pendingChange.characterId,
        old_value: pendingChange.currentValue,
        new_value: pendingChange.newValue,
        is_narrator_change: true,
      };

      await supabase.from('session_events').insert({
        session_id: sessionId,
        scene_id: currentScene?.id || null,
        event_type: 'tracker_change',
        event_data: eventData,
      });

      onEventCreated?.({
        event_type: 'tracker_change',
        event_data: eventData,
        scene_id: currentScene?.id || null,
        session_id: sessionId,
      });

      toast({ title: t.vampireSession.changeSaved });
    } catch {
      toast({ title: t.vampireSession.errorSaving, variant: 'destructive' });
    }

    setIsConfirmOpen(false);
    setPendingChange(null);
  };

  const cancelChange = () => {
    setIsConfirmOpen(false);
    setPendingChange(null);
  };

  return (
    <div className="space-y-4">
      <Card className="medieval-card border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            {language === 'pt-BR' ? 'Cabala' : 'Cabal'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t.vampireSession.noPlayersConnected}
            </p>
          ) : (
            <div className="space-y-3">
              {participants.map((p) => {
                const data = p.character?.vampiro_data as MagoCharacterData | null;
                const maxArete = data?.arete || 1;
                const maxWillpower = data?.willpower || 1;
                const currentQuintessence = p.session_quintessence ?? 0;
                const currentParadox = p.session_paradox ?? 0;
                const currentWillpower = p.session_willpower_current ?? 0;
                const healthDamage = p.session_health_damage || [];
                const damagedLevels = healthDamage.filter(Boolean).length;

                const isWillpowerCritical = currentWillpower === 0;
                const isParadoxCritical = currentParadox >= 15;
                const hasCriticalState = isWillpowerCritical || isParadoxCritical;

                return (
                  <div
                    key={p.id}
                    className={`p-2 rounded-lg space-y-2 ${
                      hasCriticalState
                        ? 'bg-destructive/20 border border-destructive/40 animate-pulse'
                        : 'bg-muted/30'
                    }`}
                  >
                    {hasCriticalState && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {t.vampireSession.critical}
                      </Badge>
                    )}

                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-purple-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medieval text-sm truncate">
                            {p.character?.name || t.vampireSession.noCharacter}
                          </p>
                          {(p.experience_points ?? 0) > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 font-mono">
                              {p.experience_points} XP
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {data?.tradition && <span className="capitalize">{data.tradition}</span>}
                          {data?.essence && <><span>•</span><span className="capitalize">{data.essence}</span></>}
                        </div>
                      </div>
                    </div>

                    {p.character && (
                      <div className="grid grid-cols-5 gap-1.5 text-xs">
                        {/* Quintessência */}
                        <button
                          type="button"
                          onClick={() =>
                            openAdjustModal('blood' as TrackerType, currentQuintessence, p.id, p.character?.name || '', undefined, 20, 'quintessence')
                          }
                          className="flex flex-col items-center p-1.5 rounded border cursor-pointer transition-colors hover:bg-muted/50 bg-purple-500/10 border-purple-500/20"
                        >
                          <Sparkles className="w-3 h-3 text-purple-500 mb-0.5" />
                          <span className="font-medium text-purple-500">{currentQuintessence}</span>
                          <span className="text-muted-foreground text-[9px]">
                            {t.mago?.quintessence || 'Quint.'}
                          </span>
                        </button>

                        {/* Paradoxo */}
                        <button
                          type="button"
                          onClick={() =>
                            openAdjustModal('blood' as TrackerType, currentParadox, p.id, p.character?.name || '', undefined, 20, 'paradox')
                          }
                          className={`flex flex-col items-center p-1.5 rounded border cursor-pointer transition-colors hover:bg-muted/50 ${
                            isParadoxCritical
                              ? 'bg-destructive/30 border-destructive animate-pulse'
                              : 'bg-destructive/10 border-destructive/20'
                          }`}
                        >
                          <Zap className="w-3 h-3 text-destructive mb-0.5" />
                          <span className="font-medium text-destructive">{currentParadox}</span>
                          <span className="text-muted-foreground text-[9px]">
                            {t.mago?.paradox || 'Paradoxo'}
                          </span>
                        </button>

                        {/* Arête (fixo, não-clicável) */}
                        <div className="flex flex-col items-center p-1.5 rounded border bg-purple-500/5 border-purple-500/20">
                          <Star className="w-3 h-3 text-purple-500 mb-0.5" />
                          <span className="font-medium text-purple-500">{maxArete}</span>
                          <span className="text-muted-foreground text-[9px]">
                            {t.mago?.arete || 'Arête'}
                          </span>
                        </div>

                        {/* Vontade */}
                        <button
                          type="button"
                          onClick={() =>
                            openAdjustModal('willpower', currentWillpower, p.id, p.character?.name || '', undefined, maxWillpower, 'willpower')
                          }
                          className={`flex flex-col items-center p-1.5 rounded border cursor-pointer transition-colors hover:bg-muted/50 ${
                            isWillpowerCritical ? 'bg-amber-500/30 border-amber-500' : 'bg-muted/50 border-border'
                          }`}
                        >
                          {isWillpowerCritical ? (
                            <AlertTriangle className="w-3 h-3 text-amber-500 mb-0.5 animate-pulse" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-foreground mb-0.5" />
                          )}
                          <span className={`font-medium ${isWillpowerCritical ? 'text-amber-500' : ''}`}>
                            {currentWillpower}/{maxWillpower}
                          </span>
                          <span className="text-muted-foreground text-[9px]">
                            {t.mago?.willpowerLabel || t.vampiro?.willpowerCurrent || 'Vontade'}
                          </span>
                        </button>

                        {/* Vitalidade */}
                        <button
                          type="button"
                          onClick={() =>
                            openAdjustModal('health', damagedLevels, p.id, p.character?.name || '', undefined, 7, 'health')
                          }
                          className={`flex flex-col items-center p-1.5 rounded border cursor-pointer transition-colors hover:bg-muted/50 ${
                            damagedLevels >= 5
                              ? 'bg-destructive/20 border-destructive/40'
                              : damagedLevels >= 3
                              ? 'bg-orange-500/10 border-orange-500/30'
                              : 'bg-muted/50 border-border'
                          }`}
                        >
                          <Heart
                            className={`w-3 h-3 mb-0.5 ${
                              damagedLevels >= 5
                                ? 'text-destructive'
                                : damagedLevels >= 3
                                ? 'text-orange-500'
                                : 'text-foreground'
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              damagedLevels >= 5
                                ? 'text-destructive'
                                : damagedLevels >= 3
                                ? 'text-orange-500'
                                : ''
                            }`}
                          >
                            {7 - damagedLevels}/7
                          </span>
                          <span className="text-muted-foreground text-[9px]">
                            {t.mago?.vitality || t.vampiro?.healthLevels || 'Vit.'}
                          </span>
                        </button>
                      </div>
                    )}

                    {p.character && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCharacter(p.character);
                          setSelectedParticipant(p);
                        }}
                        className="w-full mt-1 text-xs h-7"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        {t.vampireSession.viewSheet}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Character Sheet Modal */}
      <Dialog
        open={!!selectedCharacter}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCharacter(null);
            setSelectedParticipant(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-medieval flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-500" />
              {t.vampireSession.sheetOf} {selectedCharacter?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {selectedCharacter && selectedCharacter.vampiro_data && (
              <MagoCharacterSheet
                character={{
                  id: selectedCharacter.id,
                  name: selectedCharacter.name,
                  concept: selectedCharacter.concept,
                  vampiro_data: selectedCharacter.vampiro_data,
                  experience_points: (selectedCharacter as any).experience_points ?? 0,
                }}
                sessionTrackers={{
                  quintessence: selectedParticipant?.session_quintessence ?? 0,
                  paradox: selectedParticipant?.session_paradox ?? 0,
                  arete: selectedParticipant?.session_arete ?? 1,
                  willpower: selectedParticipant?.session_willpower_current ?? 0,
                  healthDamage: selectedParticipant?.session_health_damage ?? Array(7).fill(false),
                }}
                readOnly
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {adjustModal && (
        <NarratorTrackerAdjustModal
          open={!!adjustModal}
          trackerType={adjustModal.type}
          characterName={adjustModal.characterName}
          currentValue={adjustModal.currentValue}
          maxValue={adjustModal.maxValue}
          onConfirm={handleAdjustConfirm}
          onCancel={() => setAdjustModal(null)}
        />
      )}

      {pendingChange && (
        <TrackerChangeConfirmModal
          open={isConfirmOpen}
          trackerType={pendingChange.type}
          currentValue={pendingChange.currentValue}
          newValue={pendingChange.newValue}
          characterName={pendingChange.characterName}
          isNarrator={true}
          onConfirm={confirmChange}
          onCancel={cancelChange}
        />
      )}
    </div>
  );
}
