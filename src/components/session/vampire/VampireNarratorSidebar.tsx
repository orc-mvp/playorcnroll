import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { supabase } from '@/integrations/supabase/client';
import { getDisciplineLabel } from '@/lib/vampiro/disciplineLabels';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import VampiroCharacterSheet from '@/components/character/vampiro/VampiroCharacterSheet';
import { TrackerChangeConfirmModal, TrackerType } from './TrackerChangeConfirmModal';
import { NarratorTrackerAdjustModal } from './NarratorTrackerAdjustModal';
import {
  Crown,
  Users,
  Dices,
  Moon,
  Plus,
  Droplets,
  Sparkles,
  Heart,
  AlertTriangle,
  Skull,
  FileText,
} from 'lucide-react';

interface VampiroCharacterData {
  player?: string;
  chronicle?: string;
  clan?: string;
  generation?: string;
  attributes?: {
    physical: { strength: number; dexterity: number; stamina: number };
    social: { charisma: number; manipulation: number; appearance: number };
    mental: { perception: number; intelligence: number; wits: number };
  };
  disciplines?: Record<string, number>;
  humanity?: number;
  willpower?: number;
}

interface Participant {
  id: string;
  user_id: string;
  character_id: string | null;
  session_blood_pool?: number;
  session_willpower_current?: number;
  session_health_damage?: boolean[];
  experience_points?: number;
  character?: {
    id: string;
    name: string;
    concept: string | null;
    game_system: string;
    vampiro_data: VampiroCharacterData | null;
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
}

interface VampireNarratorSidebarProps {
  sessionId: string;
  participants: Participant[];
   scenes: Scene[];
   currentScene: Scene | null;
   onRequestTest: () => void;
   onRequestRoll: () => void;
   onSceneChange: (scene: Scene) => void;
   onEventCreated?: (event: { event_type: string; event_data: Record<string, unknown>; scene_id: string | null; session_id: string }) => void;
}

export function VampireNarratorSidebar({
  sessionId,
  participants,
   scenes,
   currentScene,
   onRequestTest,
   onRequestRoll,
   onSceneChange,
   onEventCreated,
}: VampireNarratorSidebarProps) {
  const { t, language } = useI18n();
  const { toast } = useToast();

  const [newSceneName, setNewSceneName] = useState('');
  const [newSceneDesc, setNewSceneDesc] = useState('');
  const [isCreatingScene, setIsCreatingScene] = useState(false);
  const [showSceneForm, setShowSceneForm] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Participant['character'] | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  // Confirmation modal state for narrator edits
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Narrator adjust modal state (with +/- controls)
  const [adjustModal, setAdjustModal] = useState<{
    type: TrackerType;
    participantId: string;
    characterId?: string;
    characterName: string;
    currentValue: number;
    maxValue?: number;
    isPermanent?: boolean;
  } | null>(null);

  const handleCreateScene = async () => {
    if (!newSceneName.trim()) return;

    setIsCreatingScene(true);

    try {
      // Deactivate current scene if any
      if (currentScene) {
        await supabase
          .from('scenes')
          .update({ is_active: false })
          .eq('id', currentScene.id);
      }

      // Create new scene
      const { data: scene, error } = await supabase
        .from('scenes')
        .insert({
          session_id: sessionId,
          name: newSceneName.trim(),
          description: newSceneDesc.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Update session with current scene
      await supabase
        .from('sessions')
        .update({ current_scene_id: scene.id })
        .eq('id', sessionId);

      // Add event to feed
      await supabase.from('session_events').insert({
        session_id: sessionId,
        scene_id: scene.id,
        event_type: 'scene_started',
        event_data: {
          scene_name: scene.name,
          scene_description: scene.description,
        },
      });

      toast({ title: t.vampireSession.sceneCreated });
      setNewSceneName('');
      setNewSceneDesc('');
      setShowSceneForm(false);
      onSceneChange(scene);
    } catch (error) {
      toast({ title: t.vampireSession.errorCreatingScene, variant: 'destructive' });
    } finally {
      setIsCreatingScene(false);
    }
  };


  // Open the adjust modal (with +/- controls)
  const openAdjustModal = (
    type: TrackerType,
    currentValue: number,
    participantId: string,
    characterName: string,
    characterId?: string,
    maxValue?: number,
    isPermanent?: boolean
  ) => {
    setAdjustModal({
      type,
      participantId,
      characterId,
      characterName,
      currentValue,
      maxValue,
      isPermanent,
    });
  };

  // Handle confirmation from adjust modal - sets up the pending change and opens confirm modal
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
    });
    setAdjustModal(null);
    setIsConfirmOpen(true);
  };

  // Confirm the pending change
  const confirmChange = async () => {
    if (!pendingChange) return;

    try {
      // Handle humanity changes (permanent - update character record)
      if (pendingChange.type === 'humanity' && pendingChange.characterId) {
        // Fetch current vampiro_data
        const { data: charData, error: fetchError } = await supabase
          .from('characters')
          .select('vampiro_data')
          .eq('id', pendingChange.characterId)
          .single();

        if (fetchError) throw fetchError;

        // Update humanity in the object
        const updatedData = {
          ...(charData.vampiro_data as VampiroCharacterData),
          humanity: pendingChange.newValue,
        };

        // Save back to database
        const { error: updateError } = await supabase
          .from('characters')
          .update({ vampiro_data: updatedData })
          .eq('id', pendingChange.characterId);

        if (updateError) throw updateError;
      } else {
        // Handle session trackers (temporary)
        const updateData: Record<string, number | boolean[]> = {};
        
        switch (pendingChange.type) {
          case 'blood':
            updateData.session_blood_pool = pendingChange.newValue;
            break;
          case 'willpower':
            updateData.session_willpower_current = pendingChange.newValue;
            break;
          case 'health':
            const newHealth = Array(7).fill(false);
            for (let i = 0; i < pendingChange.newValue; i++) {
              newHealth[i] = true;
            }
            updateData.session_health_damage = newHealth;
            break;
        }

        await supabase
          .from('session_participants')
          .update(updateData)
          .eq('id', pendingChange.participantId);
      }

      // Emit event to session feed
      const eventData = {
        tracker_type: pendingChange.type,
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

      // Optimistically add event to local feed
      onEventCreated?.({
        event_type: 'tracker_change',
        event_data: eventData,
        scene_id: currentScene?.id || null,
        session_id: sessionId,
      });

      toast({ title: t.vampireSession.changeSaved });
    } catch (error) {
      toast({ title: t.vampireSession.errorSaving, variant: 'destructive' });
    }

    setIsConfirmOpen(false);
    setPendingChange(null);
  };

  // Cancel the pending change
  const cancelChange = () => {
    setIsConfirmOpen(false);
    setPendingChange(null);
  };

  return (
    <div className="space-y-4">
      {/* Narrator Badge */}
      <div className="flex items-center gap-2 text-destructive">
        <Crown className="w-5 h-5" />
        <span className="font-medieval">{t.roles.narrator}</span>
      </div>

      {/* Request Test Card */}
      <Card className="medieval-card border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            <Dices className="w-4 h-4 text-destructive" />
            {t.vampiroTests.requestTest}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={onRequestTest}
            className="w-full bg-destructive hover:bg-destructive/90"
          >
            <Dices className="w-4 h-4 mr-2" />
            {t.vampiroTests.test}
          </Button>
          <Button
            onClick={onRequestRoll}
            variant="outline"
            className="w-full border-destructive/30 hover:bg-destructive/10"
          >
            <Dices className="w-4 h-4 mr-2" />
            {t.vampiroTests.roll}
          </Button>
        </CardContent>
      </Card>

      {/* Coterie (Players) */}
      <Card className="medieval-card border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-destructive" />
            Coterie
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
                const vampData = p.character?.vampiro_data;
                const maxWillpower = vampData?.willpower || 1;
                const humanity = vampData?.humanity || 7;
                const bloodPool = p.session_blood_pool || 0;
                const currentWillpower = p.session_willpower_current || 0;
                const healthDamage = p.session_health_damage || [];
                const damagedLevels = healthDamage.filter(Boolean).length;
                
                // Critical state detection
                const isBloodCritical = bloodPool === 0;
                const isWillpowerCritical = currentWillpower === 0;
                const hasCriticalState = isBloodCritical || isWillpowerCritical;
                
                return (
                  <div
                    key={p.id}
                    className={`p-2 rounded-lg space-y-2 ${
                      hasCriticalState 
                        ? 'bg-destructive/20 border border-destructive/40 animate-pulse' 
                        : 'bg-muted/30'
                    }`}
                  >
                    {/* Critical State Badge */}
                    {hasCriticalState && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {t.vampireSession.critical}
                      </Badge>
                    )}

                    {/* Character Name & Clan */}
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-destructive shrink-0" />
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
                        <p className="text-xs text-muted-foreground capitalize">
                          {vampData?.clan || ''}
                          {vampData?.generation && ` • ${vampData.generation}ª Geração`}
                        </p>
                      </div>
                    </div>

                    {/* Disciplines Summary (read-only, sorted by level descending) */}
                    {vampData?.disciplines && Object.keys(vampData.disciplines).filter(k => (vampData.disciplines?.[k] || 0) > 0).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(vampData.disciplines)
                          .filter(([, v]) => v > 0)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-[10px] px-1.5 py-0">
                              {getDisciplineLabel(key, language, t)}: {value}
                            </Badge>
                          ))}
                        {Object.entries(vampData.disciplines).filter(([, v]) => v > 0).length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{Object.entries(vampData.disciplines).filter(([, v]) => v > 0).length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Interactive Trackers Row */}
                    {p.character && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {/* Blood Pool - Clickable */}
                        <button
                          type="button"
                          onClick={() => {
                            openAdjustModal('blood', bloodPool, p.id, p.character?.name || '', undefined, 50);
                          }}
                          className={`flex flex-col items-center p-1.5 rounded border cursor-pointer transition-colors hover:bg-muted/50 ${
                            isBloodCritical 
                              ? 'bg-destructive/30 border-destructive' 
                              : 'bg-destructive/10 border-destructive/20'
                          }`}
                        >
                          {isBloodCritical ? (
                            <Skull className="w-3 h-3 text-destructive mb-0.5 animate-pulse" />
                          ) : (
                            <Droplets className="w-3 h-3 text-destructive mb-0.5" />
                          )}
                          <span className="font-medium text-destructive">{bloodPool}</span>
                          <span className="text-muted-foreground text-[10px]">{t.vampiro?.bloodPool || 'Sangue'}</span>
                        </button>
                        
                        {/* Willpower - Clickable */}
                        <button
                          type="button"
                          onClick={() => {
                            openAdjustModal('willpower', currentWillpower, p.id, p.character?.name || '', undefined, maxWillpower);
                          }}
                          className={`flex flex-col items-center p-1.5 rounded border cursor-pointer transition-colors hover:bg-muted/50 ${
                            isWillpowerCritical 
                              ? 'bg-amber-500/30 border-amber-500' 
                              : 'bg-muted/50 border-border'
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
                          <span className="text-muted-foreground text-[10px]">{t.vampiro?.willpowerCurrent || 'Vontade'}</span>
                        </button>
                        
                        {/* Health - Clickable */}
                        <button
                          type="button"
                          onClick={() => {
                            openAdjustModal('health', damagedLevels, p.id, p.character?.name || '', undefined, 7);
                          }}
                          className={`flex flex-col items-center p-1.5 rounded border cursor-pointer transition-colors hover:bg-muted/50 ${
                            damagedLevels >= 5 
                              ? 'bg-destructive/20 border-destructive/40' 
                              : damagedLevels >= 3 
                                ? 'bg-orange-500/10 border-orange-500/30' 
                                : 'bg-muted/50 border-border'
                          }`}
                        >
                          <Heart className={`w-3 h-3 mb-0.5 ${
                            damagedLevels >= 5 ? 'text-destructive' : damagedLevels >= 3 ? 'text-orange-500' : 'text-foreground'
                          }`} />
                          <span className={`font-medium ${
                            damagedLevels >= 5 ? 'text-destructive' : damagedLevels >= 3 ? 'text-orange-500' : ''
                          }`}>{7 - damagedLevels}/7</span>
                          <span className="text-muted-foreground text-[10px]">{t.vampiro?.healthLevels || 'Vitalidade'}</span>
                        </button>
                      </div>
                    )}

                    {/* Humanity - Clickable (PERMANENT) */}
                    {p.character && (
                      <button
                        type="button"
                        onClick={() => {
                          openAdjustModal('humanity', humanity, p.id, p.character?.name || '', p.character?.id, 10, true);
                        }}
                        className="flex items-center gap-2 p-1.5 rounded border bg-muted/50 border-border cursor-pointer transition-colors hover:bg-muted/70 w-full"
                      >
                        <Moon className="w-3 h-3 text-foreground" />
                        <span className="font-medium text-sm">{humanity}/10</span>
                        <span className="text-muted-foreground text-[10px] flex-1">{t.vampiro?.humanity || 'Humanidade'}</span>
                        <span className="text-[8px] px-1 py-0.5 bg-destructive/20 text-destructive rounded">⚡</span>
                      </button>
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
              <Moon className="w-5 h-5 text-destructive" />
              {t.vampireSession.sheetOf} {selectedCharacter?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {selectedCharacter && selectedCharacter.vampiro_data && (
              <VampiroCharacterSheet
                character={{
                  id: selectedCharacter.id,
                  name: selectedCharacter.name,
                  concept: selectedCharacter.concept,
                  vampiro_data: selectedCharacter.vampiro_data,
                }}
                sessionTrackers={{
                  bloodPool: selectedParticipant?.session_blood_pool ?? 0,
                  willpower: selectedParticipant?.session_willpower_current ?? 0,
                  healthDamage: selectedParticipant?.session_health_damage ?? [false, false, false, false, false, false, false],
                }}
                experiencePoints={selectedParticipant?.experience_points}
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
