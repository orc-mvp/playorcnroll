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
import LobisomemCharacterSheet from '@/components/character/lobisomem/LobisomemCharacterSheet';
import { TrackerChangeConfirmModal, TrackerType } from '../vampire/TrackerChangeConfirmModal';
import { NarratorTrackerAdjustModal } from '../vampire/NarratorTrackerAdjustModal';
import {
  Crown,
  Users,
  Dices,
  Dog,
  Sparkles,
  Heart,
  AlertTriangle,
  Skull,
  FileText,
  Flame,
  Zap,
} from 'lucide-react';
import type { LobisomemCharacterData } from '@/lib/lobisomem/diceUtils';

interface Participant {
  id: string;
  user_id: string;
  character_id: string | null;
  session_gnosis?: number;
  session_rage?: number;
  session_willpower_current?: number;
  session_health_damage?: boolean[];
  session_form?: string;
  experience_points?: number;
  sheet_locked?: boolean;
  character?: {
    id: string;
    name: string;
    concept: string | null;
    game_system: string;
    vampiro_data: LobisomemCharacterData | null;
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
  isPermanent?: boolean;
  actualTrackerType?: string; // for mapping back to werewolf trackers
}

interface WerewolfNarratorSidebarProps {
  sessionId: string;
  participants: Participant[];
  scenes: Scene[];
  currentScene: Scene | null;
  onRequestTest: () => void;
  onRequestRoll: () => void;
  onSceneChange: (scene: Scene) => void;
  onEventCreated?: (event: { event_type: string; event_data: Record<string, unknown>; scene_id: string | null; session_id: string }) => void;
}

const getFormLabel = (form: string, t: any) => {
  const key = `form_${form}` as keyof typeof t.lobisomem;
  return (t.lobisomem as any)?.[key] || form;
};

export function WerewolfNarratorSidebar({
  sessionId,
  participants,
  scenes,
  currentScene,
  onRequestTest,
  onRequestRoll,
  onSceneChange,
  onEventCreated,
}: WerewolfNarratorSidebarProps) {
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
    isPermanent?: boolean;
    actualTrackerType?: string;
  } | null>(null);

  const openAdjustModal = (
    type: TrackerType,
    currentValue: number,
    participantId: string,
    characterName: string,
    characterId?: string,
    maxValue?: number,
    isPermanent?: boolean,
    actualTrackerType?: string
  ) => {
    setAdjustModal({ type, participantId, characterId, characterName, currentValue, maxValue, isPermanent, actualTrackerType });
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
      isPermanent: adjustModal.isPermanent,
      actualTrackerType: adjustModal.actualTrackerType,
    });
    setAdjustModal(null);
    setIsConfirmOpen(true);
  };

  const confirmChange = async () => {
    if (!pendingChange) return;

    try {
      const updateData: Record<string, number | boolean[] | string> = {};
      const actualType = pendingChange.actualTrackerType || pendingChange.type;

      switch (actualType) {
        case 'gnosis':
          updateData.session_gnosis = pendingChange.newValue;
          break;
        case 'rage':
          updateData.session_rage = pendingChange.newValue;
          break;
        case 'willpower':
          updateData.session_willpower_current = pendingChange.newValue;
          break;
        case 'health':
          const newHealth = Array(7).fill(false);
          for (let i = 0; i < pendingChange.newValue; i++) newHealth[i] = true;
          updateData.session_health_damage = newHealth;
          break;
      }

      await supabase.from('session_participants').update(updateData).eq('id', pendingChange.participantId);

      const eventData = {
        tracker_type: actualType,
        character_name: pendingChange.characterName,
        character_id: pendingChange.characterId,
        old_value: pendingChange.currentValue,
        new_value: pendingChange.newValue,
        is_narrator_change: true,
        is_permanent: pendingChange.isPermanent || false,
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
      {/* Badge "Narrador" removido — já há indicação no header da sessão */}

      {/* Request Test Card removido — agora é único, renderizado pelo StorytellerSession */}

      {/* Pack (Players) */}
      <Card className="medieval-card border-emerald-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            {language === 'pt-BR' ? 'Matilha' : 'Pack'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t.vampireSession.noPlayersConnected}</p>
          ) : (
            <div className="space-y-3">
              {participants.map((p) => {
                const lobData = p.character?.vampiro_data as LobisomemCharacterData | null;
                const maxGnosis = lobData?.gnosis || 1;
                const maxRage = lobData?.rage || 1;
                const maxWillpower = lobData?.willpower || 1;
                const currentGnosis = p.session_gnosis || 0;
                const currentRage = p.session_rage || 0;
                const currentWillpower = p.session_willpower_current || 0;
                const healthDamage = p.session_health_damage || [];
                const damagedLevels = healthDamage.filter(Boolean).length;
                const currentForm = p.session_form || 'hominid';

                const isGnosisCritical = currentGnosis === 0;
                const isWillpowerCritical = currentWillpower === 0;
                const hasCriticalState = isGnosisCritical || isWillpowerCritical;

                return (
                  <div
                    key={p.id}
                    className={`p-2 rounded-lg space-y-2 ${
                      hasCriticalState ? 'bg-destructive/20 border border-destructive/40 animate-pulse' : 'bg-muted/30'
                    }`}
                  >
                    {hasCriticalState && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {t.vampireSession.critical}
                      </Badge>
                    )}

                    {/* Character Name & Tribe */}
                    <div className="flex items-center gap-2">
                      <Dog className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medieval text-sm truncate">{p.character?.name || t.vampireSession.noCharacter}</p>
                          {(p.experience_points ?? 0) > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 font-mono">{p.experience_points} XP</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {lobData?.tribe && <span className="capitalize">{lobData.tribe}</span>}
                          {lobData?.auspice && <><span>•</span><span>{isShifterData(lobData) ? getShifterAuspiceLabel(lobData.auspice) : lobData.auspice}</span></>}
                        </div>
                      </div>
                    </div>

                    {/* Current Form Badge */}
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-[10px]">
                      <Dog className="w-3 h-3 mr-1" />
                      {getFormLabel(currentForm, t)}
                    </Badge>

                    {/* Gifts summary */}
                    {lobData?.gifts && Object.values(lobData.gifts).some(g => g?.length > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(lobData.gifts)
                          .flatMap(([level, gifts]) => (gifts || []).map(g => ({ level: Number(level), name: g })))
                          .slice(0, 3)
                          .map((g, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                              {g.name}
                            </Badge>
                          ))}
                        {Object.values(lobData.gifts).flat().filter(Boolean).length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{Object.values(lobData.gifts).flat().filter(Boolean).length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Interactive Trackers Row */}
                    {p.character && (
                      <div className="grid grid-cols-4 gap-1.5 text-xs">
                        {/* Gnosis */}
                        <button
                          type="button"
                          onClick={() => openAdjustModal('blood' as TrackerType, currentGnosis, p.id, p.character?.name || '', undefined, maxGnosis, false, 'gnosis')}
                          className={`flex flex-col items-center p-1.5 rounded border cursor-pointer transition-colors hover:bg-muted/50 ${
                            isGnosisCritical ? 'bg-amber-500/30 border-amber-500' : 'bg-emerald-500/10 border-emerald-500/20'
                          }`}
                        >
                          {isGnosisCritical
                            ? <Skull className="w-3 h-3 text-amber-500 mb-0.5 animate-pulse" />
                            : <Sparkles className="w-3 h-3 text-emerald-500 mb-0.5" />}
                          <span className={`font-medium ${isGnosisCritical ? 'text-amber-500' : 'text-emerald-500'}`}>{currentGnosis}</span>
                          <span className="text-muted-foreground text-[9px]">{t.lobisomem?.gnosis || 'Gnose'}</span>
                        </button>

                        {/* Rage */}
                        <button
                          type="button"
                          onClick={() => openAdjustModal('blood' as TrackerType, currentRage, p.id, p.character?.name || '', undefined, maxRage, false, 'rage')}
                          className="flex flex-col items-center p-1.5 rounded border cursor-pointer transition-colors hover:bg-muted/50 bg-destructive/10 border-destructive/20"
                        >
                          <Flame className="w-3 h-3 text-destructive mb-0.5" />
                          <span className="font-medium text-destructive">{currentRage}</span>
                          <span className="text-muted-foreground text-[9px]">{t.lobisomem?.rage || 'Fúria'}</span>
                        </button>

                        {/* Willpower */}
                        <button
                          type="button"
                          onClick={() => openAdjustModal('willpower', currentWillpower, p.id, p.character?.name || '', undefined, maxWillpower, false, 'willpower')}
                          className={`flex flex-col items-center p-1.5 rounded border cursor-pointer transition-colors hover:bg-muted/50 ${
                            isWillpowerCritical ? 'bg-amber-500/30 border-amber-500' : 'bg-muted/50 border-border'
                          }`}
                        >
                          {isWillpowerCritical
                            ? <AlertTriangle className="w-3 h-3 text-amber-500 mb-0.5 animate-pulse" />
                            : <Zap className="w-3 h-3 text-foreground mb-0.5" />}
                          <span className={`font-medium ${isWillpowerCritical ? 'text-amber-500' : ''}`}>{currentWillpower}/{maxWillpower}</span>
                          <span className="text-muted-foreground text-[9px]">{t.lobisomem?.willpowerLabel || 'Vontade'}</span>
                        </button>

                        {/* Health */}
                        <button
                          type="button"
                          onClick={() => openAdjustModal('health', damagedLevels, p.id, p.character?.name || '', undefined, 7, false, 'health')}
                          className={`flex flex-col items-center p-1.5 rounded border cursor-pointer transition-colors hover:bg-muted/50 ${
                            damagedLevels >= 5 ? 'bg-destructive/20 border-destructive/40'
                              : damagedLevels >= 3 ? 'bg-orange-500/10 border-orange-500/30'
                              : 'bg-muted/50 border-border'
                          }`}
                        >
                          <Heart className={`w-3 h-3 mb-0.5 ${damagedLevels >= 5 ? 'text-destructive' : damagedLevels >= 3 ? 'text-orange-500' : 'text-foreground'}`} />
                          <span className={`font-medium ${damagedLevels >= 5 ? 'text-destructive' : damagedLevels >= 3 ? 'text-orange-500' : ''}`}>{7 - damagedLevels}/7</span>
                          <span className="text-muted-foreground text-[9px]">{t.lobisomem?.vitality || 'Vitalidade'}</span>
                        </button>
                      </div>
                    )}

                    {/* View Character Sheet Button */}
                    {p.character && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedCharacter(p.character); setSelectedParticipant(p); }}
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
      <Dialog open={!!selectedCharacter} onOpenChange={(open) => { if (!open) { setSelectedCharacter(null); setSelectedParticipant(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-medieval flex items-center gap-2">
              <Dog className="w-5 h-5 text-emerald-500" />
              {t.vampireSession.sheetOf} {selectedCharacter?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {selectedCharacter && selectedCharacter.vampiro_data && (
              <LobisomemCharacterSheet
                character={{
                  id: selectedCharacter.id,
                  name: selectedCharacter.name,
                  concept: selectedCharacter.concept,
                  vampiro_data: selectedCharacter.vampiro_data,
                  experience_points: (selectedCharacter as any).experience_points ?? 0,
                }}
                sessionTrackers={{
                  gnosis: selectedParticipant?.session_gnosis ?? 0,
                  rage: selectedParticipant?.session_rage ?? 0,
                  willpower: selectedParticipant?.session_willpower_current ?? 0,
                  healthDamage: selectedParticipant?.session_health_damage ?? Array(7).fill(false),
                  form: selectedParticipant?.session_form || 'hominid',
                }}
                readOnly
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Narrator Tracker Adjust Modal */}
      {adjustModal && (
        <NarratorTrackerAdjustModal
          open={!!adjustModal}
          trackerType={adjustModal.type}
          characterName={adjustModal.characterName}
          currentValue={adjustModal.currentValue}
          maxValue={adjustModal.maxValue}
          isPermanent={adjustModal.isPermanent}
          onConfirm={handleAdjustConfirm}
          onCancel={() => setAdjustModal(null)}
        />
      )}

      {/* Tracker Change Confirmation Modal */}
      {pendingChange && (
        <TrackerChangeConfirmModal
          open={isConfirmOpen}
          trackerType={pendingChange.type}
          currentValue={pendingChange.currentValue}
          newValue={pendingChange.newValue}
          characterName={pendingChange.characterName}
          isNarrator={true}
          isPermanent={pendingChange.isPermanent}
          onConfirm={confirmChange}
          onCancel={cancelChange}
        />
      )}
    </div>
  );
}
